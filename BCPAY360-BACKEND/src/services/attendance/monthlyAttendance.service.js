import db from "../../config/db.js";
import { getS3SignedUrl } from "../../utils/s3.util.js";

/* ==========================================================
   HELPERS
   ========================================================== */

const formatDateOnly = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Status map matches employee attendance.controller.js numeric codes
const STATUS_MAP = { 0: "ABSENT", 1: "PRESENT", 2: "LATE", 3: "HALF_DAY" };

export const getMonthlyAttendance = async ({
  companyId,
  fromDate,
  toDate,
  page = 1,
  limit = 20,
  search = "",
  departmentId = "",
  shiftId = ""
}) => {
  if (!fromDate || !toDate) throw new Error("fromDate and toDate are required");

  const offset = (page - 1) * limit;

  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateOnly(today);

  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) throw new Error("Invalid date range");

  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  /* ================= FILTER ================= */

  const conditions = [];
  const values = [companyId];

  if (search) {
    conditions.push(`(e.full_name LIKE ? OR e.employee_code LIKE ?)`);
    values.push(`%${search}%`, `%${search}%`);
  }
  if (departmentId) { conditions.push(`e.department_id = ?`); values.push(departmentId); }
  if (shiftId) { conditions.push(`e.shift_id = ?`); values.push(shiftId); }

  const whereClause = conditions.length ? " AND " + conditions.join(" AND ") : "";

  /* ================= EMPLOYEES ================= */

  const [employees] = await db.query(
    `
    SELECT
      e.id AS employee_id,
      e.employee_code,
      e.full_name,
      DATE_FORMAT(e.joining_date,'%Y-%m-%d') AS joining_date,
      e.branch_id,
      ep.profile_photo_url,
      dept.department_name AS department,
      sh.shift_name
    FROM employees e
    LEFT JOIN departments dept ON dept.id = e.department_id
    LEFT JOIN shifts sh ON sh.id = e.shift_id
    LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
    WHERE e.company_id = ?
      AND e.employee_status = 'ACTIVE'
      ${whereClause}
    ORDER BY e.employee_code
    LIMIT ? OFFSET ?
    `,
    [...values, Number(limit), offset]
  );

  if (!employees.length) {
    return {
      viewType: "MONTHLY",
      fromDate,
      toDate,
      data: [],
      pagination: { page, limit, total_records: 0 }
    };
  }

  const employeeIds = employees.map(e => e.employee_id);

  /* ================= HOLIDAYS ================= */

  const [holidayRows] = await db.query(
    `
    SELECT branch_id,
           DATE_FORMAT(holiday_date,'%Y-%m-%d') AS holiday_date
    FROM branch_holidays
    WHERE company_id = ?
      AND holiday_date BETWEEN ? AND ?
      AND is_active = 1
      AND applies_to_attendance = 1
    `,
    [companyId, fromDate, toDate]
  );

  const holidayMap = {};
  holidayRows.forEach(row => {
    if (!holidayMap[row.branch_id]) holidayMap[row.branch_id] = new Set();
    holidayMap[row.branch_id].add(row.holiday_date);
  });

  /* ================= ATTENDANCE ================= */

  const [attendanceRows] = await db.query(
    `
    SELECT
      employee_id,
      DATE_FORMAT(attendance_date,'%Y-%m-%d') AS attendance_date,
      status,
      is_late,
      work_minutes,
      overtime_minutes,
      check_in_time
    FROM attendance
    WHERE employee_id IN (?)
      AND attendance_date BETWEEN ? AND ?
    `,
    [employeeIds, fromDate, toDate]
  );

  const attendanceMap = {};
  attendanceRows.forEach(row => {
    attendanceMap[`${row.employee_id}_${row.attendance_date}`] = row;
  });

  /* ================= BUILD MONTHLY ================= */

  const data = await Promise.all(employees.map(async (emp, index) => {
    const days = {};
    const totals = {
      present: 0,
      half_day: 0,
      absent: 0,
      holiday: 0,
      late: 0,
      unmarked: 0,
      total_worked_minutes: 0,
      total_overtime_minutes: 0
    };

    const joiningDateStr = emp.joining_date;

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      const dateStr = formatDateOnly(current);
      const dayNumber = current.getDate();
      const record = attendanceMap[`${emp.employee_id}_${dateStr}`];

      let value;

      // BEFORE JOINING
      if (dateStr < joiningDateStr) {
        value = "-";
      }
      // FUTURE
      else if (dateStr > todayStr) {
        value = "U";
        totals.unmarked++;
      }
      // HOLIDAY
      else if (holidayMap[emp.branch_id] && holidayMap[emp.branch_id].has(dateStr)) {
        value = "H";
        totals.holiday++;
      }
      // ATTENDANCE EXISTS
      else if (record) {
        // Map numeric DB status to text label
        const textStatus = STATUS_MAP[record.status] || "ABSENT";

        if (textStatus === "PRESENT" || textStatus === "LATE") {
          value = "P";
          totals.present++;
          if (record.is_late) totals.late++;
        } else if (textStatus === "HALF_DAY") {
          value = "HD";
          totals.half_day++;
          totals.present += 0.5;
        } else {
          value = "A";
          totals.absent++;
        }

        totals.total_worked_minutes += record.work_minutes || 0;
        totals.total_overtime_minutes += record.overtime_minutes || 0;
      }
      // NO RECORD
      else {
        value = "A";
        totals.absent++;
      }

      days[dayNumber] = value;
    }

    /* Photo URL */
    let photoKey = emp.profile_photo_url;
    if (photoKey && photoKey.startsWith("http")) {
      try {
        const urlObj = new URL(photoKey);
        photoKey = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
      } catch (e) {
        photoKey = emp.profile_photo_url;
      }
    }

    return {
      sl_no: offset + index + 1,
      employee_id: emp.employee_id,
      employee_code: emp.employee_code,
      name: emp.full_name,
      profile_photo: await getS3SignedUrl(photoKey),
      department: emp.department || "-",
      shift: emp.shift_name || "-",
      // Clean joining date (YYYY-MM-DD, no timestamp)
      joining_date: joiningDateStr,
      days,
      totals
    };
  }));

  /* ================= COUNT ================= */

  const [[{ total_records }]] = await db.query(
    `SELECT COUNT(*) AS total_records FROM employees e WHERE e.company_id = ? AND e.employee_status = 'ACTIVE' ${whereClause}`,
    values
  );

  return {
    viewType: "MONTHLY",
    fromDate,
    toDate,
    data,
    pagination: { page, limit, total_records }
  };
};
