import db from "../../config/db.js";
import logger from "../../utils/logger.js";

const MODULE_NAME = "EMPLOYEE_HOME_CONTROLLER";

export const getEmployeeHome = async (req, res) => {
  try {
    const employeeId = req.user.id;

    /* ---------------------------------
       1️⃣ TODAY ATTENDANCE
    --------------------------------- */
    const [[attendance]] = await db.query(
      `SELECT
        a.id,
        a.attendance_date,
        a.check_in_time,
        a.check_out_time,
        s.start_time AS shift_start,
        s.end_time AS shift_end,
        s.is_night_shift,
        a.work_minutes,
        a.overtime_minutes,
        a.status,
        a.session_status,
        a.session_status = 1 AS is_checked_in_session
      FROM attendance a
      JOIN shifts s ON s.id = a.shift_id
      WHERE a.employee_id = ?
        AND a.attendance_date = CURDATE()
      LIMIT 1`,
      [employeeId]
    );

    /* ---------------------------------
       2️⃣ MONTH ATTENDANCE STATS
    --------------------------------- */
    const [[attendanceStats]] = await db.query(
      `SELECT
        COUNT(*) AS total_days,
        SUM(status IN (1, 3, 4)) AS present_days,
        SUM(status = 0) AS absent_days,
        SUM(is_late = 1) AS late_days,
        SUM(overtime_minutes > 0) AS overtime_days
      FROM attendance
      WHERE employee_id = ?
        AND MONTH(attendance_date) = MONTH(CURDATE())
        AND YEAR(attendance_date) = YEAR(CURDATE())`,
      [employeeId]
    );

    const performance = {
      sunday: null,
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null
    };





    const [performanceRows] = await db.query(
      `
        SELECT
        DATE_FORMAT(attendance_date, '%Y-%m-%d') AS date,
        LOWER(DAYNAME(attendance_date)) AS weekday,
        SUM(work_minutes) AS total_worked_minutes
        FROM attendance
        WHERE employee_id = ?
          AND attendance_date BETWEEN
              DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
              AND DATE_ADD(
                    DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
                    INTERVAL 6 DAY
                  )
        GROUP BY attendance_date
        ORDER BY attendance_date
      `,
      [employeeId]
    );

    if (performanceRows && performanceRows.length > 0) {
      for (const row of performanceRows) {
        if (performance.hasOwnProperty(row.weekday)) {
          const totalMins = Number(row.total_worked_minutes) || 0;
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          
          performance[row.weekday] = {
            date: row.date, 
            total_worked_minutes: totalMins,
            formatted_worked_time: `${h}h ${m}m`
          };
        }
      }
    }


    /* ---------------------------------
       3️⃣ TODAY ATTENDANCE SHAPE
    --------------------------------- */
    const formatTime = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      return `${h}:${m}:${s}`;
    };

    const STATUS_MAP = {
      0: "ABSENT",
      1: "PRESENT",
      2: "LATE",
      3: "HALF_DAY",
      4: "LATE_PRESENT"
    };

    /* ---------------------------------
       3.1️⃣ OVERTIME STATUS
    --------------------------------- */
    const [lastOt] = attendance ? await db.query(
      `SELECT id, 
              DATE_FORMAT(overtime_start, '%H:%i:%s') as ot_start_time,
              DATE_FORMAT(overtime_end, '%H:%i:%s') as ot_end_time,
              overtime_end IS NULL as is_open,
              overtime_start
       FROM overtime_logs 
       WHERE attendance_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [attendance.id]
    ) : [[]];

    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
    const ot = lastOt[0] || {};
    const isOTStarted = !!ot.is_open;
    const isOTCompleted = !!ot.ot_start_time && !ot.is_open;

    const todayAttendance = attendance
      ? {
        attendance_id: attendance.id,
        date: attendance.attendance_date,
        status: STATUS_MAP[attendance.status] !== undefined ? STATUS_MAP[attendance.status] : "UNMARKED",
        check_in_time: formatTime(attendance.check_in_time),
        check_out_time: formatTime(attendance.check_out_time),
        shift_start: attendance.shift_start,
        shift_end: attendance.shift_end,
        worked_minutes: attendance.work_minutes,
        overtime_minutes: attendance.overtime_minutes,
        session_status: attendance.session_status,
        is_checked_in_session: !!attendance.is_checked_in_session,
        is_present:
          attendance.status !== 0 &&
          attendance.session_status !== 0,
        is_late: attendance.status === 2 || attendance.status === 4,
        // Overtime Flags
        is_ot_session: isOTStarted,
        is_ot_start: isOTStarted,
        is_ot_completed: isOTCompleted,
        ot_start_time: ot.ot_start_time || null,
        ot_end_time: ot.ot_end_time || null
      }
      : null;

    /* ---------------------------------
       4️⃣ RECENT ACTIVITIES (BACKEND DRIVEN)
    --------------------------------- */
    const recentActivities = [];

    if (attendance) {
      // Normalize date safely
      const dateObj =
        attendance.attendance_date instanceof Date
          ? attendance.attendance_date
          : new Date(attendance.attendance_date);

      const dateStr = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      // ✅ CHECKED OUT (priority)
      if (attendance.check_out_time) {
        const dateTime = new Date(attendance.check_out_time);

        const timeStr = dateTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        recentActivities.push({
          type: "ATTENDANCE",
          message: `You successfully checked out on ${dateStr}`,
          time: timeStr
        });
      }

      // ✅ CHECKED IN
      else if (attendance.check_in_time) {
        const dateTime = new Date(attendance.check_in_time);

        const timeStr = dateTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        recentActivities.push({
          type: "ATTENDANCE",
          message: `You successfully checked in on ${dateStr}`,
          time: timeStr
        });
      }
    }



    /* ---------------------------------
       5️⃣ FINAL LIST RESPONSE
    --------------------------------- */
    res.json({
      success: true,
      data: [
        {
          performance: performance,
          today: todayAttendance,
          attendanceOverview: attendanceStats,
          recentActivities
        }
      ]
    });

  } catch (err) {
    logger.error(MODULE_NAME, "Employee home data fetch failed", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

