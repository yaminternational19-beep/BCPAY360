import db from "../../config/db.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "ATTENDANCE_CONTROLLER";

const STATUS = {
  ABSENT: 0,
  PRESENT: 1,
  LATE: 2,
  HALF_DAY: 3
};

const STATUS_TEXT = {
  0: "ABSENT",
  1: "PRESENT",
  2: "LATE",
  3: "HALF_DAY"
};

const SESSION = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2
};

const ACTION = {
  CHECK_IN: 1,
  CHECK_OUT: 2,
  AUTO_CHECKOUT: 3,
  OT_START: 4,
  OT_STOP: 5,
  ADMIN_EDIT: 6
};

// 1. Correct Time Functions (Use Only These)
const getISTNow = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const formatDateTime = (date) => {
  // Avoids toISOString() double-conversion timezone bug
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${h}:${min}:${sec}`;
};

const getAttendanceDateStr = (now) => {
  return formatDateTime(now).slice(0, 10);
};

const getAttendanceLogicalDate = (now, shiftStrStart, shiftStrEnd, isNightShift) => {
  const currentHour = now.getHours();
  let logicalDate = new Date(now.getTime());

  if (isNightShift) {
    const startHour = parseInt(shiftStrStart.split(':')[0], 10);
    if (currentHour < startHour && currentHour < 14) {
      logicalDate.setDate(logicalDate.getDate() - 1);
    }
  }
  return formatDateTime(logicalDate).slice(0, 10);
};

const getShiftDateTimes = (logicalDateStr, shiftStrStart, shiftStrEnd, isNightShift) => {
    // Parse strings explicitly to avoid timezone shifts
    const [startH, startM, startS] = shiftStrStart.split(':').map(Number);
    const [endH, endM, endS] = shiftStrEnd.split(':').map(Number);
    
    // logicalDateStr is YYYY-MM-DD
    const [year, month, day] = logicalDateStr.split('-').map(Number);
    
    // We treat these Dates purely as local time containers mapping exactly to the components
    const start = new Date(year, month - 1, day, startH, startM, startS || 0);
    const end = new Date(year, month - 1, day, endH, endM, endS || 0);
    
    if (isNightShift) {
        end.setDate(end.getDate() + 1);
    } else {
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }
    }
    return { start, end };
};


export const checkIn = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const employeeId = req.user.id;
    const { latitude, longitude } = req.body;

    const now = getISTNow();
    const nowStr = formatDateTime(now);

    const [[emp]] = await conn.query(`
      SELECT e.company_id, e.branch_id, e.shift_id,
             s.start_time, s.end_time, s.is_night_shift
      FROM employees e
      JOIN shifts s ON s.id = e.shift_id
      WHERE e.id = ?
    `, [employeeId]);

    if (!emp) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    const attendanceDate = getAttendanceLogicalDate(now, emp.start_time, emp.end_time, emp.is_night_shift);

    // Rule: Employee can check in only once per day per shift.
    const [existing] = await conn.query(`
      SELECT id FROM attendance
      WHERE employee_id = ? AND attendance_date = ?
    `, [employeeId, attendanceDate]);

    if (existing.length) {
      return res.status(400).json({ success: false, message: "Already checked in" });
    }

    const { start: shiftStartDT } = getShiftDateTimes(attendanceDate, emp.start_time, emp.end_time, emp.is_night_shift);
    
    // Calculate late (Check-in before shift start + 30 min -> Present; Check-in after shift start + 30 min -> Late)
    const diffMinutes = Math.floor((now - shiftStartDT) / 60000);
    
    let isLate = 0;
    let lateMinutes = 0;
    let status = STATUS.PRESENT;

    if (diffMinutes > 30) {
      isLate = 1;
      lateMinutes = diffMinutes;
      status = STATUS.LATE;
    }

    await conn.beginTransaction();

    const [result] = await conn.query(`
      INSERT INTO attendance (
        company_id, branch_id, employee_id, shift_id,
        attendance_date, check_in_time,
        check_in_lat, check_in_lng,
        late_minutes, is_late,
        status, session_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      emp.company_id, emp.branch_id, employeeId, emp.shift_id,
      attendanceDate, nowStr,
      latitude, longitude,
      lateMinutes, isLate,
      status, SESSION.IN_PROGRESS
    ]);

    await conn.query(`
      INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [result.insertId, employeeId, ACTION.CHECK_IN, nowStr, latitude, longitude]);

    await conn.commit();

    return res.json({
      success: true,
      message: isLate ? "Checked in (Late)" : "Checked in",
      attendance_id: result.insertId
    });

  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(MODULE_NAME, "Check-in error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};


export const checkOut = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const employeeId = req.user.id;
    const { latitude, longitude } = req.body;

    const now = getISTNow();
    const nowStr = formatDateTime(now);

    const [rows] = await conn.query(`
      SELECT a.*, 
             s.start_time, s.end_time, s.is_night_shift
      FROM attendance a
      JOIN shifts s ON s.id = a.shift_id
      WHERE a.employee_id = ? AND a.session_status = ?
      ORDER BY a.attendance_date DESC LIMIT 1
    `, [employeeId, SESSION.IN_PROGRESS]);

    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No active check-in found" });
    }

    const att = rows[0];
    
    // Parse checkInTime exactly as formatted to correctly subtract work limits
    const checkInTime = new Date(att.check_in_time); 
    // work_minutes = checkout_time - checkin_time
    const workMinutes = Math.floor((now - checkInTime) / 60000);

    // If worked_minutes < 30 -> do NOT allow checkout (keep IN_PROGRESS).
    if (workMinutes < 10) {
      return res.status(400).json({
        success: false,
        message: `Minimum 30 minutes required for checkout`
      });
    }

    // Final Status calculated only during checkout
    let finalStatus;
    // < 4 hrs -> Half Day
    if (workMinutes < 240) {
      finalStatus = STATUS.HALF_DAY;
    } else {
      // >= 4 hrs -> Present
      // (If they were marked Late at check-in, preserve LATE as final status based on the logic matrix)
      finalStatus = att.is_late ? STATUS.LATE : STATUS.PRESENT;
    }

    const { end: shiftEndDT } = getShiftDateTimes(att.attendance_date.toISOString().slice(0, 10), att.start_time, att.end_time, att.is_night_shift);
    
    await conn.beginTransaction();

    await conn.query(`
      UPDATE attendance SET
        check_out_time = ?,
        check_out_lat = ?,
        check_out_lng = ?,
        work_minutes = ?,
        status = ?,
        session_status = ?
      WHERE id = ?
    `, [
      nowStr, latitude, longitude,
      workMinutes,
      finalStatus, SESSION.COMPLETED,
      att.id
    ]);

    await conn.query(`
      INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [att.id, employeeId, ACTION.CHECK_OUT, nowStr, latitude, longitude]);

    await conn.commit();

    return res.json({
      success: true,
      message: "Checked out",
      worked_minutes: workMinutes,
      status: STATUS_TEXT[finalStatus]
    });

  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(MODULE_NAME, "Check-out error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
};


export const autoCheckoutEmployees = async () => {
  const conn = await db.getConnection();
  try {
    const now = getISTNow();
    const nowStr = formatDateTime(now);

    const [rows] = await conn.query(`
      SELECT a.*, 
             s.start_time, s.end_time, s.is_night_shift, s.auto_checkout_grace_minutes
      FROM attendance a
      JOIN shifts s ON s.id = a.shift_id
      WHERE a.session_status = ?
    `, [SESSION.IN_PROGRESS]);

    for (const att of rows) {
      const attDateStr = formatDateTime(att.attendance_date).slice(0, 10);
      const { end: shiftEndDT } = getShiftDateTimes(attDateStr, att.start_time, att.end_time, att.is_night_shift);
      
      const triggerTimeMS = shiftEndDT.getTime() + (att.auto_checkout_grace_minutes * 60000);
      
      if (now.getTime() > triggerTimeMS) {
        try {
          await conn.beginTransaction();
          
          const shiftEndStr = formatDateTime(shiftEndDT);
          const checkInDT = new Date(att.check_in_time);
          const workMinutes = Math.max(0, Math.floor((shiftEndDT - checkInDT) / 60000));
          
          // Same exactly auto checkout logic: <30min ignore? 
          // If the cron checks them out because they forgot, we apply the rules
          let finalStatus;
          if (workMinutes < 240) {
            finalStatus = STATUS.HALF_DAY;
          } else {
            finalStatus = att.is_late ? STATUS.LATE : STATUS.PRESENT;
          }

          await conn.query(`
            UPDATE attendance SET
              check_out_time = ?,
              work_minutes = ?,
              status = ?,
              auto_checkout = 1,
              session_status = ?
            WHERE id = ?
          `, [
            shiftEndStr, workMinutes, finalStatus, SESSION.COMPLETED, att.id
          ]);

          await conn.query(`
            INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, reason)
            VALUES (?, ?, ?, ?, ?)
          `, [att.id, att.employee_id, ACTION.AUTO_CHECKOUT, nowStr, 'AUTO CHECKOUT']);

          await conn.commit();
          logger.info(MODULE_NAME, `Auto checkout processed for ID: ${att.id}`);
        } catch(err) {
          if (conn) await conn.rollback();
          logger.error(MODULE_NAME, `Auto checkout failed for ID: ${att.id}`, err);
        }
      }
    }
  } catch (err) {
    logger.error(MODULE_NAME, "Auto checkout cron failed", err);
  } finally {
    conn.release();
  }
};


export const autoAbsentEmployees = async () => {
    const conn = await db.getConnection();
    try {
        const now = getISTNow();
        
        const [employees] = await conn.query(`
          SELECT e.id, e.company_id, e.branch_id, e.shift_id,
                 s.start_time, s.end_time, s.is_night_shift
          FROM employees e
          JOIN shifts s ON s.id = e.shift_id
          WHERE e.employee_status = 'ACTIVE'
        `);
        
        for (const emp of employees) {
            const logicalDate = getAttendanceLogicalDate(now, emp.start_time, emp.end_time, emp.is_night_shift);
            const { end: shiftEndDT } = getShiftDateTimes(logicalDate, emp.start_time, emp.end_time, emp.is_night_shift);
            
            // If no check-in and shift_end passed → mark ABSENT.
            if (now > shiftEndDT) {
                const [existing] = await conn.query(`
                  SELECT id FROM attendance
                  WHERE employee_id = ? AND attendance_date = ?
                `, [emp.id, logicalDate]);
                
                if (existing.length === 0) {
                    try {
                        await conn.beginTransaction();
                        await conn.query(`
                          INSERT INTO attendance (
                            company_id, branch_id, employee_id, shift_id,
                            attendance_date, status, session_status, remarks
                          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            emp.company_id, emp.branch_id, emp.id, emp.shift_id,
                            logicalDate, STATUS.ABSENT, SESSION.COMPLETED, 'AUTO ABSENT'
                        ]);
                        await conn.commit();
                    } catch (err) {
                        if (conn) await conn.rollback();
                        logger.error(MODULE_NAME, `Auto absent failed for employee ${emp.id}`, err);
                    }
                }
            }
        }
    } catch (err) {
        logger.error(MODULE_NAME, "Auto absent cron failed", err);
    } finally {
        conn.release();
    }
};


export const startOvertime = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const employeeId = req.user.id;
        const { latitude, longitude } = req.body;
        const now = getISTNow();
        const nowStr = formatDateTime(now);
        
        const [rows] = await conn.query(`
            SELECT a.*, s.end_time, s.start_time, s.is_night_shift
            FROM attendance a
            JOIN shifts s ON s.id = a.shift_id
            WHERE a.employee_id = ?
            ORDER BY a.attendance_date DESC LIMIT 1
        `, [employeeId]);
        
        if (!rows.length) {
            return res.status(400).json({ success: false, message: "No attendance found to start OT" });
        }
        const att = rows[0];
        
        if (att.session_status !== SESSION.COMPLETED) {
            return res.status(400).json({ success: false, message: "Shift not completed yet" });
        }
        
        const { end: shiftEndDT } = getShiftDateTimes(formatDateTime(att.attendance_date).slice(0, 10), att.start_time, att.end_time, att.is_night_shift);
        
        if (now < shiftEndDT) {
            return res.status(400).json({ success: false, message: "Cannot start OT before shift ends" });
        }
        
        const [openOt] = await conn.query(`
            SELECT id FROM overtime_logs
            WHERE employee_id = ? AND overtime_end IS NULL
        `, [employeeId]);
        
        if (openOt.length > 0) {
            return res.status(400).json({ success: false, message: "Overtime already in progress" });
        }

        await conn.beginTransaction();
        
        await conn.query(`
            INSERT INTO overtime_logs (attendance_id, employee_id, overtime_start)
            VALUES (?, ?, ?)
        `, [att.id, employeeId, nowStr]);
        
        await conn.query(`
            INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [att.id, employeeId, ACTION.OT_START, nowStr, latitude, longitude]);

        await conn.commit();
        
        return res.json({ success: true, message: "Overtime started" });
        
    } catch (err) {
        if (conn) await conn.rollback();
        logger.error(MODULE_NAME, "Start overtime error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        conn.release();
    }
};


export const stopOvertime = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const employeeId = req.user.id;
        const { latitude, longitude } = req.body;
        const now = getISTNow();
        const nowStr = formatDateTime(now);
        
        const [otRows] = await conn.query(`
            SELECT o.*
            FROM overtime_logs o
            WHERE o.employee_id = ? AND o.overtime_end IS NULL
            ORDER BY o.id DESC LIMIT 1
        `, [employeeId]);
        
        if (!otRows.length) {
            return res.status(400).json({ success: false, message: "No active overtime found" });
        }
        
        const ot = otRows[0];
        const otStartDT = new Date(ot.overtime_start);
        const durationMinutes = Math.floor((now - otStartDT) / 60000);
        
        let insertDuration = durationMinutes;
        
        if (durationMinutes < 60) {
            insertDuration = 0; // Ignore sub-60 mins
        } else if (durationMinutes > 240) {
            insertDuration = 240; // Cap at 4 hours
        }
        
        await conn.beginTransaction();
        
        await conn.query(`
            UPDATE overtime_logs
            SET overtime_end = ?, duration_minutes = ?
            WHERE id = ?
        `, [nowStr, insertDuration, ot.id]);
        
        await conn.query(`
            UPDATE attendance
            SET overtime_minutes = overtime_minutes + ?
            WHERE id = ?
        `, [insertDuration, ot.attendance_id]);
        
        await conn.query(`
            INSERT INTO attendance_logs (attendance_id, employee_id, action_type, action_time, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [ot.attendance_id, employeeId, ACTION.OT_STOP, nowStr, latitude, longitude]);

        await conn.commit();
        
        return res.json({ 
            success: true, 
            message: insertDuration === 0 ? "Overtime stopped (Ignored: less than 1 hour)" : "Overtime stopped",
            duration: insertDuration
        });
        
    } catch (err) {
        if (conn) await conn.rollback();
        logger.error(MODULE_NAME, "Stop overtime error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        conn.release();
    }
};


export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    let { from, to } = req.query;
    
    const now = getISTNow();
    const todayStr = getAttendanceDateStr(now);
    
    if (!from || !to) {
      from = todayStr;
      to = todayStr;
    }

    const [[emp]] = await db.query(
      `SELECT e.joining_date, s.start_time, s.end_time, s.is_night_shift 
       FROM employees e 
       JOIN shifts s ON s.id = e.shift_id 
       WHERE e.id = ?`,
      [employeeId]
    );

    if (!emp) return res.status(404).json({ success: false, message: "Emp not found." });

    const joiningDateStr = formatDateTime(new Date(emp.joining_date)).slice(0, 10);
    const logicalTodayDateStr = getAttendanceLogicalDate(now, emp.start_time, emp.end_time, emp.is_night_shift);

    const [recordsFromDB] = await db.query(
      `SELECT 
        DATE_FORMAT(attendance_date, '%Y-%m-%d') as attendance_date,
        DATE_FORMAT(check_in_time, '%H:%i:%s') as check_in_time,
        DATE_FORMAT(check_out_time, '%H:%i:%s') as check_out_time,
        work_minutes as worked_minutes, overtime_minutes, status as raw_status, session_status, is_late
       FROM attendance
       WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
       ORDER BY attendance_date DESC`,
      [employeeId, from, to]
    );

    const recordMap = {};
    recordsFromDB.forEach(r => {
      let displayStatus = STATUS_TEXT[r.raw_status] || "UNMARKED";
      if (r.session_status === 1) { 
        displayStatus = "PRESENT";
      }
      
      const { worked_minutes, overtime_minutes, raw_status, is_late, ...rest } = r;
      
      let workH = Math.floor((worked_minutes || 0) / 60);
      let workM = (worked_minutes || 0) % 60;
      let overH = Math.floor((overtime_minutes || 0) / 60);
      let overM = (overtime_minutes || 0) % 60;

      recordMap[r.attendance_date] = { 
        ...rest, 
        is_late,
        raw_status: STATUS_TEXT[raw_status] || "UNMARKED",
        worked_minutes: worked_minutes || 0,
        formatted_worked_time: `${workH}h ${workM}m`,
        overtime_minutes: overtime_minutes || 0,
        formatted_overtime: `${overH}h ${overM}m`,
        status: displayStatus 
      };
    });

    const resultList = [];
    let curr = new Date(from);
    const end = new Date(to);

    while (curr <= end) {
      const dStr = formatDateTime(curr).slice(0, 10);
      if (dStr <= logicalTodayDateStr && dStr >= joiningDateStr) {
        if (recordMap[dStr]) {
          resultList.push(recordMap[dStr]);
        } else {
          const { end: logicalShiftEndDT } = getShiftDateTimes(dStr, emp.start_time, emp.end_time, emp.is_night_shift);
          const isShiftEnded = (now > logicalShiftEndDT);

          resultList.push({
            attendance_date: dStr, check_in_time: null, check_out_time: null,
            worked_minutes: 0,
            formatted_worked_time: "0h 0m",
            overtime_minutes: 0,
            formatted_overtime: "0h 0m",
            raw_status: isShiftEnded ? "ABSENT" : "UNMARKED",
            status: isShiftEnded ? "ABSENT" : "UNMARKED"
          });
        }
      } else if (dStr < joiningDateStr) {
        resultList.push({ attendance_date: dStr, status: "-" });
      }
      curr.setDate(curr.getDate() + 1);
    }

    resultList.reverse();

    const summary = {
      total_days: resultList.filter(r => r.status !== "-").length,
      present_days: 0, late_days: 0, half_days: 0, absent_days: 0,
      total_worked_minutes: 0, total_overtime_minutes: 0
    };

    resultList.forEach(r => {
      // Use raw_status to map to internal rules, falling back to status if needed
      const currentStatus = r.raw_status;
      
      if (currentStatus === 'PRESENT') {
          summary.present_days += 1;
      }
      
      if (currentStatus === 'HALF_DAY') {
          summary.present_days += 0.5;
          summary.half_days += 1;
      }
      
      if (r.is_late === 1) {
          summary.late_days += 1;
      }
      
      if (currentStatus === 'ABSENT') {
          summary.absent_days += 1;
      }
      
      if (currentStatus === 'UNMARKED') {
        summary.unmarked_days = (summary.unmarked_days || 0) + 1;
      }
      
      summary.total_worked_minutes += r.worked_minutes || 0;
      summary.total_overtime_minutes += r.overtime_minutes || 0;
    });

    const todayRecord = resultList.find(r => r.attendance_date === logicalTodayDateStr) || { 
      attendance_date: logicalTodayDateStr, 
      worked_minutes: 0, 
      formatted_worked_time: "0h 0m",
      overtime_minutes: 0,
      formatted_overtime: "0h 0m",
      raw_status: "UNMARKED",
      status: "UNMARKED" 
    };
    
    // Format the summary total times
    let totalWorkH = Math.floor(summary.total_worked_minutes / 60);
    let totalWorkM = summary.total_worked_minutes % 60;
    
    let totalOverH = Math.floor(summary.total_overtime_minutes / 60);
    let totalOverM = summary.total_overtime_minutes % 60;
    
    summary.formatted_total_worked_time = `${totalWorkH}h ${totalWorkM}m`;
    summary.formatted_total_overtime = `${totalOverH}h ${totalOverM}m`;

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
