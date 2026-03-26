import db from "../../config/db.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "ATTENDANCE_CONTROLLER";

/* ===============================
  HELPERS
================================ */

const getTodayDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const formatDate = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = (date instanceof Date) ? date : new Date(date);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' });
};

const getLocalDateTime = (date = new Date()) => {
  const d = (date instanceof Date) ? date : new Date(date);
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(d);
  const p = {};
  parts.forEach(part => p[part.type] = part.value);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};

const getISTDate = (date = new Date()) => {
  const d = (date instanceof Date) ? date : new Date(date);
  // Small trick to get a Date object that LOOKS like IST components but is actually shifted
  const istStr = getLocalDateTime(d);
  return new Date(istStr);
};

/**
 * Converts HH:mm:ss to minutes from midnight for cross-midnight boundary detection.
 */
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const parts = String(timeString).split(':');
  if (parts.length < 2) return 0;
  return Number(parts[0]) * 60 + Number(parts[1]);
};

/**
 * Construct absolute Date objects for a shift on a specific attendance date.
 * Strictly handles night shifts where end_time < start_time.
 */
const getShiftStartEndDT = (attendanceDateStr, startTimeStr, endTimeStr) => {
  const [y, m, d] = attendanceDateStr.split('-').map(Number);
  
  const parseTime = (s) => {
    const parts = String(s).split(':').map(Number);
    return { h: parts[0] || 0, min: parts[1] || 0, sec: parts[2] || 0 };
  };

  const st = parseTime(startTimeStr);
  const et = parseTime(endTimeStr);

  // In an IST-centric app, "09:00:00" means 9:00 AM India Time.
  // We calculate the UTC instant by subtracting 5.5 hours from the UTC representation of these parts.
  const createDT = (h, m, s) => {
    const utcDT = new Date(Date.UTC(y, m - 1, d, h, m, s));
    return new Date(utcDT.getTime() - (5.5 * 3600000));
  };

  const startDT = createDT(st.h, st.min, st.sec);
  const endDT = createDT(et.h, et.min, et.sec);

  if (timeToMinutes(endTimeStr) < timeToMinutes(startTimeStr)) {
    endDT.setDate(endDT.getDate() + 1);
  }

  return { startDT, endDT };
};

/**
 * Determines the logical attendance date based on shift settings and current time.
 */
const getAttendanceDate = (shiftStart, shiftEnd) => {
  const now = getISTDate(new Date());
  const startMin = timeToMinutes(shiftStart);
  const endMin = timeToMinutes(shiftEnd);
  // Current minutes from midnight (IST)
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let attendanceDateStr = formatDate(new Date());
  let d = new Date(attendanceDateStr);

  // Night shift logic: if now is early morning before shift end, it's yesterday's shift.
  if (endMin < startMin) {
    if (nowMin < endMin) {
      d.setDate(d.getDate() - 1);
      attendanceDateStr = formatDate(d);
    }
  }

  return attendanceDateStr;
};

/* ===============================
  CHECK IN
================================ */

export const checkIn = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { latitude, longitude, device_type } = req.body;
    const employeeId = req.user.id;
    const ipAddress = req.ip || null;
    const source = req.headers["x-client-source"] || "WEB";

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Location required." });
    }

    // 1️⃣ Fetch employee & shift
    const [[emp]] = await conn.query(
      `SELECT e.company_id, e.branch_id, e.joining_date, 
              s.id shift_id, s.start_time, s.end_time, s.grace_minutes, 
              s.min_full_day_minutes, s.min_half_day_minutes
       FROM employees e
       JOIN shifts s ON s.id = e.shift_id
       WHERE e.id = ?`,
      [employeeId]
    );

    if (!emp) {
      return res.status(404).json({ success: false, message: "Shift not found." });
    }

    // 2️⃣ Logic Calculations
    const attendanceDate = getAttendanceDate(emp.start_time, emp.end_time);
    const nowDT = new Date();
    
    // Construct shift start DT for this logical day
    const { startDT: shiftStartDT } = getShiftStartEndDT(attendanceDate, emp.start_time, emp.end_time);

    if (attendanceDate < emp.joining_date) {
      return res.status(403).json({ success: false, message: "Joining date error." });
    }

    // ⏱ Early window calculation (minutes diff)
    const diffInMs = nowDT - shiftStartDT;
    const diffInMins = Math.floor(diffInMs / 60000);

    const EARLY_WINDOW = 60; // Allowed 60m before shift
    if (diffInMins < -EARLY_WINDOW) {
      return res.status(403).json({ success: false, message: `Check-in allowed from ${EARLY_WINDOW}m before shift start.` });
    }

    await conn.beginTransaction();

    // 3️⃣ Row Lock
    const [rows] = await conn.query(
      `SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ? FOR UPDATE`,
      [employeeId, attendanceDate]
    );

    if (rows.length && rows[0].check_in_time) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: "Already checked in." });
    }

    // Late calculation (DATETIME based) - Simplified as per requirement: check_in - shift_start
    const lateMinutes = Math.max(0, diffInMins);
    const isLate = lateMinutes > 0 ? 1 : 0;

    const nowDateTimeStr = getLocalDateTime(nowDT);

    let attendanceId;
    if (!rows.length) {
      const [result] = await conn.query(
        `INSERT INTO attendance (
          company_id, branch_id, employee_id, attendance_date,
          check_in_time, shift_id, check_in_lat, check_in_lng,
          source, late_minutes, is_late, attendance_status, session_status,
          shift_start_snapshot, shift_end_snapshot, full_day_minutes, min_work_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PRESENT', 'IN_PROGRESS', ?, ?, ?, ?)`,
        [
          emp.company_id, emp.branch_id, employeeId, attendanceDate,
          nowDateTimeStr, emp.shift_id, latitude, longitude,
          source, lateMinutes, isLate, emp.start_time, emp.end_time,
          emp.min_full_day_minutes, emp.min_half_day_minutes
        ]
      );
      attendanceId = result.insertId;
    } else {
      attendanceId = rows[0].id;
      await conn.query(
        `UPDATE attendance SET 
          check_in_time = ?, check_in_lat = ?, check_in_lng = ?,
          source = ?, late_minutes = ?, is_late = ?, 
          attendance_status = 'PRESENT', session_status = 'IN_PROGRESS',
          shift_start_snapshot = ?, shift_end_snapshot = ?,
          full_day_minutes = ?, min_work_minutes = ?
         WHERE id = ?`,
        [
          nowDateTimeStr, latitude, longitude, source, lateMinutes, isLate,
          emp.start_time, emp.end_time, emp.min_full_day_minutes, emp.min_half_day_minutes,
          attendanceId
        ]
      );
    }

    // Audit Log
    await conn.query(
      `INSERT INTO attendance_logs (attendance_id, actor_role, actor_id, action, source, device_type, new_data, ip_address)
       VALUES (?, 'EMPLOYEE', ?, 'CHECK_IN', ?, ?, ?, ?)`,
      [
        attendanceId, employeeId, source,
        (device_type?.toUpperCase() === "WEB" ? "DESKTOP" : device_type?.toUpperCase()) || "UNKNOWN",
        JSON.stringify({ check_in_time: nowDateTimeStr, is_late: isLate }),
        ipAddress
      ]
    );

    await conn.commit();

    let successMsg = "Checked in successfully";
    if (isLate) {
      successMsg = `Checked in successfully (Late by ${lateMinutes} mins)`;
    }

    return res.status(200).json({
      success: true,
      message: successMsg,
      data: { 
        attendance_id: attendanceId, 
        check_in_time: nowDateTimeStr,
        late_minutes: lateMinutes,
        is_late: !!isLate
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(MODULE_NAME, "Check-in fail", err);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    conn.release();
  }
};

/* ===============================
  CHECK OUT
================================ */

export const checkOut = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { latitude, longitude, device_type } = req.body;
    const employeeId = req.user.id;
    const ipAddress = req.ip || null;
    const source = req.headers["x-client-source"] || "WEB";

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: "Geo required." });
    }

    await conn.beginTransaction();

    // 1️⃣ Lock row (Find most recent in-progress session)
    const [rows] = await conn.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? AND session_status = 'IN_PROGRESS'
       ORDER BY attendance_date DESC LIMIT 1 FOR UPDATE`,
      [employeeId]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "No active session found." });
    }

    const att = rows[0];
    const nowDT = new Date();
    const nowDateTimeStr = getLocalDateTime(nowDT);

    // 2️⃣ Core Duration Calculations (All DATETIME based)
    const workedMinutes = Math.max(0, Math.floor((nowDT - new Date(att.check_in_time)) / 60000));

    if (workedMinutes < 30) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: "Minimum 30 minutes shift required for manual checkout."
      });
    }

    const attDateStr = formatDate(att.attendance_date);
    const { startDT, endDT } = getShiftStartEndDT(attDateStr, att.shift_start_snapshot, att.shift_end_snapshot);

    // workedMinutes already declared above
    
    // Overtime: diff between now and shift end
    const overtimeMinutes = Math.max(0, Math.floor((nowDT - endDT) / 60000));
    const isOvertime = overtimeMinutes > 0 ? 1 : 0;
    
    // Working Hours Rule: < 3 hours (180 mins) is HALF_DAY, else PRESENT
    const finalAttendanceStatus = workedMinutes < 180 ? 'HALF_DAY' : 'PRESENT';

    // 3️⃣ Update
    await conn.query(
      `UPDATE attendance SET 
        check_out_time = ?, check_out_lat = ?, check_out_lng = ?,
        worked_minutes = ?, overtime_minutes = ?,
        is_overtime = ?, attendance_status = ?, session_status = 'COMPLETED'
       WHERE id = ?`,
      [
        nowDateTimeStr, latitude, longitude,
        workedMinutes, overtimeMinutes,
        isOvertime, finalAttendanceStatus, att.id
      ]
    );

    // 4️⃣ Audit
    await conn.query(
      `INSERT INTO attendance_logs (attendance_id, actor_role, actor_id, action, source, device_type, new_data, ip_address)
       VALUES (?, 'EMPLOYEE', ?, 'CHECK_OUT', ?, ?, ?, ?)`,
      [
        att.id, employeeId, source,
        (device_type?.toUpperCase() === "WEB" ? "DESKTOP" : device_type?.toUpperCase()) || "UNKNOWN",
        JSON.stringify({ 
          check_out_time: nowDateTimeStr, 
          worked_minutes: workedMinutes, 
          overtime: overtimeMinutes, 
          status: finalAttendanceStatus 
        }),
        ipAddress
      ]
    );

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: "Checked out successfully",
      data: { attendance_id: att.id, worked_minutes: workedMinutes, status: finalAttendanceStatus }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(MODULE_NAME, "Check-out fail", err);
    return res.status(500).json({ success: false, message: "Server error." });
  } finally {
    conn.release();
  }
};

/* ===============================
  MY ATTENDANCE LIST
================================ */

export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = getTodayDate();
    let { from, to } = req.query;

    if (!from || !to) {
      from = todayStr;
      to = todayStr;
    }

    const [[emp]] = await db.query(
      `SELECT e.joining_date, s.start_time, s.end_time 
       FROM employees e 
       JOIN shifts s ON s.id = e.shift_id 
       WHERE e.id = ?`,
      [employeeId]
    );

    if (!emp) return res.status(404).json({ success: false, message: "Emp not found." });

    const joiningDateStr = formatDate(emp.joining_date);
    const logicalTodayDateStr = getAttendanceDate(emp.start_time, emp.end_time);

    // 1️⃣ Fetch records
    const [recordsFromDB] = await db.query(
      `SELECT 
        DATE_FORMAT(attendance_date, '%Y-%m-%d') as attendance_date,
        DATE_FORMAT(check_in_time, '%H:%i:%s') as check_in_time,
        DATE_FORMAT(check_out_time, '%H:%i:%s') as check_out_time,
        worked_minutes, overtime_minutes, attendance_status, session_status, is_late
       FROM attendance
       WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
       ORDER BY attendance_date DESC`,
      [employeeId, from, to]
    );

    const recordMap = {};
    recordsFromDB.forEach(r => {
      let displayStatus = r.attendance_status;
      if (r.session_status === 'IN_PROGRESS') {
        displayStatus = 'PRESENT'; // Show PRESENT immediately after check-in
      } else if (r.session_status === 'COMPLETED') {
        displayStatus = (r.attendance_status === 'HALF_DAY') ? 'HALF_DAY' : 'PRESENT';
      }
      recordMap[r.attendance_date] = { ...r, status: displayStatus };
    });

    // 2️⃣ Fill range
    const resultList = [];
    let curr = new Date(from);
    const end = new Date(to);

    while (curr <= end) {
      const dStr = formatDate(curr);
      if (dStr <= logicalTodayDateStr && dStr >= joiningDateStr) {
        if (recordMap[dStr]) {
          resultList.push(recordMap[dStr]);
        } else {
          // Check if shift has completely ended
          const { endDT: logicalShiftEndDT } = getShiftStartEndDT(dStr, emp.start_time, emp.end_time);
          const isShiftEnded = (dStr < logicalTodayDateStr) || (dStr === logicalTodayDateStr && new Date() > logicalShiftEndDT);

          resultList.push({
            attendance_date: dStr, check_in_time: null, check_out_time: null,
            worked_minutes: 0, overtime_minutes: 0,
            status: isShiftEnded ? "ABSENT" : "UNMARKED"
          });
        }
      } else if (dStr < joiningDateStr) {
        resultList.push({ attendance_date: dStr, status: "-" });
      }
      curr.setDate(curr.getDate() + 1);
    }

    resultList.reverse();

    // 3️⃣ Summary calculation
    const summary = {
      total_days: resultList.filter(r => r.status !== "-").length,
      present_days: 0, late_days: 0, half_days: 0, absent_days: 0,
      total_worked_minutes: 0, total_overtime_minutes: 0
    };

    resultList.forEach(r => {
      const s = r.status;
      if (s === 'PRESENT') {
        summary.present_days += 1;
      } else if (s === 'LATE') {
        summary.present_days += 1;
        summary.late_days += 1;
      } else if (s === 'HALF_DAY') {
        summary.present_days += 0.5;
        summary.half_days += 1;
      } else if (s === 'ABSENT') {
        summary.absent_days += 1;
      } else if (s === 'UNMARKED') {
        summary.unmarked_days = (summary.unmarked_days || 0) + 1;
      }
      
      summary.total_worked_minutes += r.worked_minutes || 0;
      summary.total_overtime_minutes += r.overtime_minutes || 0;
    });

    const todayRecord = resultList.find(r => r.attendance_date === logicalTodayDateStr) || { attendance_date: logicalTodayDateStr, status: "UNMARKED" };

    return res.status(200).json({
      success: true,
      data: {
        today: [todayRecord],
        list: [{ range: { from, to }, total_days: resultList.length, records: resultList }],
        total_days_summary: summary
      }
    });

  } catch (err) {
    logger.error(MODULE_NAME, "Dash fail", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ===============================
  AUTO CHECKOUT (CRON)
================================ */

export const autoCheckoutEmployees = async () => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT * FROM attendance 
       WHERE session_status = 'IN_PROGRESS' 
       AND check_in_time IS NOT NULL
       FOR UPDATE`
    );

    const nowDT = new Date(); // Absolute UTC instant
    const BUFFER_MINUTES = 240; // Auto-checkout 4 hours after shift end as per requirement

    for (const att of rows) {
      const attDateStr = formatDate(att.attendance_date);
      const { endDT } = getShiftStartEndDT(attDateStr, att.shift_start_snapshot, att.shift_end_snapshot);
      const triggerTimeDT = new Date(endDT.getTime() + BUFFER_MINUTES * 60000);

      // Debug Logs (Requested)
      logger.info(MODULE_NAME, "Auto-checkout scan", {
        employee_id: att.employee_id,
        attendance_date: attDateStr,
        check_in_time: att.check_in_time,
        server_time_utc: nowDT.toISOString(),
        ist_now: getLocalDateTime(nowDT),
        shift_end_ist: getLocalDateTime(endDT),
        auto_checkout_time_ist: getLocalDateTime(triggerTimeDT),
        is_past_threshold: nowDT > triggerTimeDT
      });

      // If current time > shift end + buffer, trigger auto checkout
      if (nowDT > triggerTimeDT) {
        try {
          // Rule: checkout = shift_end_datetime for strict shift compliance
          const autoCheckoutDT = new Date(endDT); 
          const autoCheckoutStr = getLocalDateTime(autoCheckoutDT);

          const checkInDT = new Date(att.check_in_time);
          
          // worked_minutes = (shift_end_datetime - check_in_time)
          const workedMinutes = Math.max(0, Math.floor((autoCheckoutDT - checkInDT) / 60000));
          
          // In auto checkout at end of shift, OT is typically 0 and early checkout is 0
          const overtimeMinutes = 0; 
          
          // Working Hours Rule: < 3 hours (180 mins) is HALF_DAY
          const finalStatus = workedMinutes < 180 ? 'HALF_DAY' : 'PRESENT';

          await conn.query(
            `UPDATE attendance SET 
              check_out_time = ?, worked_minutes = ?, overtime_minutes = ?,
              is_overtime = 0, attendance_status = ?, session_status = 'COMPLETED',
              remarks = 'AUTO CHECKOUT'
             WHERE id = ?`,
            [autoCheckoutStr, workedMinutes, overtimeMinutes, finalStatus, att.id]
          );

          await conn.query(
            `INSERT INTO attendance_logs (attendance_id, actor_role, actor_id, action, source, new_data, reason)
             VALUES (?, 'SUPER_ADMIN', 0, 'CHECK_OUT', 'AUTO', ?, 'AUTO CHECKOUT')`,
            [att.id, JSON.stringify({ status: finalStatus, method: 'AUTO', checkout_time: autoCheckoutStr })]
          );

          await conn.commit();
          logger.info(MODULE_NAME, `Auto checkout processed for ID: ${att.id}`);
        } catch (err) {
          logger.error(MODULE_NAME, `Auto checkout failed for ID: ${att.id}`, err);
        }
      }
    }
    await conn.commit();
  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(MODULE_NAME, "Auto checkout cron failed", err);
  } finally {
    conn.release();
  }
};
