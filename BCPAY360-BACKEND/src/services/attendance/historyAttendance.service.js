import db from "../../config/db.js";
import { getS3SignedUrl } from "../../utils/s3.util.js";

/* ==========================================================
   HELPERS
   ========================================================== */

const minutesToHM = (minutes) => {
  if (!minutes || minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const formatTimeDisplay = (dt) => {
  if (!dt) return null;
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d)) return null;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const formatDateOnly = (dt) => {
  if (!dt) return null;
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Status map matches employee attendance.controller.js numeric codes
const STATUS_MAP = { 0: "ABSENT", 1: "PRESENT", 2: "LATE", 3: "HALF_DAY" };

export const getHistoryAttendance = async ({
  companyId,
  employeeId,
  from,
  to
}) => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateOnly(today);

  /* ================= EMPLOYEE ================= */

  const [[employee]] = await db.query(
    `
    SELECT
      e.id,
      e.employee_code,
      e.full_name,
      e.employee_status,
      DATE_FORMAT(e.joining_date,'%Y-%m-%d') AS joining_date,
      e.branch_id,
      dept.department_name AS department,
      desig.designation_name AS designation,
      sh.shift_name,
      ep.profile_photo_url
    FROM employees e
    LEFT JOIN departments dept ON dept.id = e.department_id
    LEFT JOIN designations desig ON desig.id = e.designation_id
    LEFT JOIN shifts sh ON sh.id = e.shift_id
    LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
    WHERE e.id = ?
      AND e.company_id = ?
    `,
    [employeeId, companyId]
  );

  if (!employee) throw new Error("Employee not found");

  const joiningDateStr = employee.joining_date;

  /* ================= DATE RANGE ================= */

  let startDate = from ? new Date(from) : new Date(joiningDateStr);
  let endDate = to ? new Date(to) : today;

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (startDate > endDate) throw new Error("Invalid date range");

  const startStr = formatDateOnly(startDate);
  const endStr = formatDateOnly(endDate);
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  /* ================= ATTENDANCE ================= */

  const [attendanceRows] = await db.query(
    `
    SELECT
      DATE_FORMAT(attendance_date,'%Y-%m-%d') AS attendance_date,
      status,
      is_late,
      check_in_time,
      check_out_time,
      work_minutes,
      overtime_minutes,
      late_minutes,
      check_in_lat,
      check_in_lng,
      check_out_lat,
      check_out_lng,
      auto_checkout
    FROM attendance
    WHERE employee_id = ?
      AND attendance_date BETWEEN ? AND ?
    `,
    [employeeId, startStr, endStr]
  );

  const attendanceMap = {};
  attendanceRows.forEach(row => {
    attendanceMap[row.attendance_date] = row;
  });

  /* ================= HOLIDAYS ================= */

  const [holidayRows] = await db.query(
    `
    SELECT DATE_FORMAT(holiday_date,'%Y-%m-%d') AS holiday_date
    FROM branch_holidays
    WHERE company_id = ?
      AND branch_id = ?
      AND is_active = 1
      AND applies_to_attendance = 1
    `,
    [companyId, employee.branch_id]
  );

  const holidaySet = new Set(holidayRows.map(h => h.holiday_date));

  /* ================= BUILD CALENDAR ================= */

  const data = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);

    const dateStr = formatDateOnly(current);
    const att = attendanceMap[dateStr];

    let resolvedStatus;
    let worked_minutes = 0;
    let overtime_mins = 0;
    let late_mins = 0;
    let is_late = 0;

    // BEFORE JOINING
    if (dateStr < joiningDateStr) {
      resolvedStatus = "-";
    }
    // FUTURE
    else if (dateStr > todayStr) {
      resolvedStatus = "UNMARKED";
    }
    // HOLIDAY
    else if (holidaySet.has(dateStr)) {
      resolvedStatus = "HOLIDAY";
    }
    // ATTENDANCE EXISTS
    else if (att) {
      // Use numeric status from DB, map to text
      resolvedStatus = STATUS_MAP[att.status] || "ABSENT";
      worked_minutes = att.work_minutes || 0;
      overtime_mins = att.overtime_minutes || 0;
      late_mins = att.late_minutes || 0;
      is_late = att.is_late || 0;
    }
    // NO RECORD
    else {
      resolvedStatus = "ABSENT";
    }

    data.push({
      // Clean date only (YYYY-MM-DD)
      date: dateStr,
      shift_name: employee.shift_name || "-",
      status: resolvedStatus,
      is_late,
      // Clean "12:13 PM" format times
      check_in_time: att ? formatTimeDisplay(att.check_in_time) : null,
      check_out_time: att ? formatTimeDisplay(att.check_out_time) : null,
      // Minutes (raw) + formatted
      worked_minutes,
      formatted_worked_time: minutesToHM(worked_minutes),
      overtime_minutes: overtime_mins,
      formatted_overtime: minutesToHM(overtime_mins),
      late_minutes: late_mins,
      formatted_late: minutesToHM(late_mins),
      check_in_location:
        att?.check_in_lat && att?.check_in_lng
          ? `${att.check_in_lat}, ${att.check_in_lng}`
          : null,
      check_out_location:
        att?.check_out_lat && att?.check_out_lng
          ? `${att.check_out_lat}, ${att.check_out_lng}`
          : null,
      source: att?.auto_checkout ? "AUTO_CHECKOUT" : "MANUAL"
    });
  }

  /* ================= SUMMARY STATS ================= */

  const summary = {
    total_days: data.filter(d => d.status !== "-").length,
    present_days: 0,
    half_days: 0,
    absent_days: 0,
    late_days: 0,
    holiday_days: data.filter(d => d.status === "HOLIDAY").length,
    total_worked_minutes: 0,
    total_overtime_minutes: 0
  };

  data.forEach(d => {
    if (d.status === "PRESENT") summary.present_days += 1;
    else if (d.status === "HALF_DAY") { summary.present_days += 0.5; summary.half_days += 1; }
    else if (d.status === "ABSENT") summary.absent_days += 1;
    if (d.is_late) summary.late_days += 1;
    summary.total_worked_minutes += d.worked_minutes;
    summary.total_overtime_minutes += d.overtime_minutes;
  });

  /* ================= RESPONSE ================= */

  return {
    viewType: "HISTORY",
    employee: {
      id: employee.id,
      code: employee.employee_code,
      name: employee.full_name,
      profile_photo_url: employee.profile_photo_url
        ? await getS3SignedUrl(employee.profile_photo_url)
        : null,
      department: employee.department || "-",
      designation: employee.designation || "-",
      shift: employee.shift_name || "-",
      status: employee.employee_status,
      joining_date: joiningDateStr
    },
    summary,
    data
  };
};
