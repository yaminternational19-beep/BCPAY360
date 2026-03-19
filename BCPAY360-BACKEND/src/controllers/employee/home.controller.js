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
        id,
        attendance_date,
        check_in_time,
        check_out_time,
        NULL AS shift_start,
        NULL AS shift_end,
        min_work_minutes,
        full_day_minutes,
        worked_minutes,
        overtime_minutes,
        attendance_status AS status,
        session_status = 'IN_PROGRESS' AS is_checked_in_session
      FROM attendance
      WHERE employee_id = ?
        AND attendance_date = CURDATE()
      LIMIT 1`,
      [employeeId]
    );

    /* ---------------------------------
       2️⃣ MONTH ATTENDANCE STATS
    --------------------------------- */
    const [[attendanceStats]] = await db.query(
      `SELECT
        COUNT(*) AS total_days,
        SUM(attendance_status IN ('PRESENT','HALF_DAY')) AS present_days,
        SUM(attendance_status = 'ABSENT') AS absent_days,
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
  SUM(overtime_minutes) AS total_overtime_minutes
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

    for (const row of performanceRows) {
      performance[row.weekday] = {
        date: row.date,
        total_overtime_minutes: Number(row.total_overtime_minutes) || 0
      };
    }

    if (performanceRows && performanceRows.length > 0) {
      for (const row of performanceRows) {
        if (performance.hasOwnProperty(row.weekday)) {
          performance[row.weekday] = {
            date: row.date, // YYYY-MM-DD
            total_overtime_minutes: Number(row.total_overtime_minutes) || 0
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
      const h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      return `${h % 12 || 12}:${m} ${ampm}`;
    };

    const todayAttendance = attendance
      ? {
        attendance_id: attendance.id,
        date: attendance.attendance_date,
        status: attendance.status,
        check_in_time: formatTime(attendance.check_in_time),
        check_out_time: formatTime(attendance.check_out_time),
        shift_start: attendance.shift_start,
        shift_end: attendance.shift_end,
        worked_minutes: attendance.worked_minutes,
        min_work_minutes: attendance.min_work_minutes,
        full_day_minutes: attendance.full_day_minutes,
        overtime_minutes: attendance.overtime_minutes,
        is_checked_in_session: !!attendance.is_checked_in_session,
        is_present:
          attendance.status !== "ABSENT" &&
          attendance.status !== "NOT_STARTED",
        is_late: attendance.status === "LATE"
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
        const dateTime = new Date(
          `${dateObj.toISOString().slice(0, 10)}T${attendance.check_out_time}`
        );

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
        const dateTime = new Date(
          `${dateObj.toISOString().slice(0, 10)}T${attendance.check_in_time}`
        );

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

