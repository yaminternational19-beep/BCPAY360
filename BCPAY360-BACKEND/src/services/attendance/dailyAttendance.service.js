import db from "../../config/db.js";
import { getS3SignedUrl } from "../../utils/s3.util.js";

/* ==========================================================
   HELPERS (matches employee attendance.controller.js exactly)
   ========================================================== */

// IST-correct time - but for admin we need UTC-safe status comparison
const getISTNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

const minutesToHM = (minutes) => {
  if (!minutes || minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// Format a JS Date object to HH:MM AM/PM display
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

// Format a date to YYYY-MM-DD only (strip time)
const formatDateOnly = (dt) => {
  if (!dt) return null;
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * DAILY Attendance View (Admin)
 * Date-driven, shift-aware, consistent with employee attendance controller
 */
export const getDailyAttendance = async ({
  companyId,
  date,
  page = 1,
  limit = 20,
  search = "",
  branchId = "",
  departmentId = "",
  shiftId = "",
  status = ""
}) => {
  const offset = (page - 1) * limit;
  const now = getISTNow();
  const todayStr = formatDateOnly(now);

  /* ===========================
     FILTER CONDITIONS
  =========================== */
  const conditions = [];
  const values = [date, companyId];

  if (search) {
    conditions.push(`(e.full_name LIKE ? OR e.employee_code LIKE ?)`);
    values.push(`%${search}%`, `%${search}%`);
  }
  if (branchId) { conditions.push(`e.branch_id = ?`); values.push(branchId); }
  if (departmentId) { conditions.push(`e.department_id = ?`); values.push(departmentId); }
  if (shiftId) { conditions.push(`e.shift_id = ?`); values.push(shiftId); }

  const whereClause = conditions.length ? " AND " + conditions.join(" AND ") : "";

  /* ===========================
     MAIN QUERY
  =========================== */
  const [rows] = await db.query(
    `
    SELECT
      e.id AS employee_id,
      e.employee_code,
      e.full_name,
      ep.profile_photo_url,
      dept.department_name AS department,
      desig.designation_name AS designation,
      sh.shift_name,
      sh.start_time AS shift_start_time,
      sh.end_time AS shift_end_time,
      sh.grace_minutes,
      a.check_in_time,
      a.check_out_time,
      a.work_minutes,
      a.overtime_minutes,
      a.late_minutes,
      a.is_late,
      a.check_in_lat,
      a.check_in_lng,
      a.check_out_lat,
      a.check_out_lng,
      a.status AS db_status,
      a.auto_checkout
    FROM employees e
    LEFT JOIN attendance a
      ON a.employee_id = e.id
     AND a.attendance_date = ?
    LEFT JOIN departments dept ON dept.id = e.department_id AND dept.is_active = 1
    LEFT JOIN designations desig ON desig.id = e.designation_id AND desig.is_active = 1
    LEFT JOIN shifts sh ON sh.id = e.shift_id AND sh.is_active = 1
    LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
    WHERE e.company_id = ?
      AND e.employee_status = 'ACTIVE'
      ${whereClause}
    ORDER BY e.employee_code
    LIMIT ? OFFSET ?
    `,
    [...values, Number(limit), offset]
  );

  /* ===========================
     STATUS MAP (matches employee controller numeric codes)
  =========================== */
  const STATUS_MAP = { 0: "ABSENT", 1: "PRESENT", 2: "LATE", 3: "HALF_DAY" };

  /* ===========================
     BUSINESS LOGIC
  =========================== */
  const isFuture = date > todayStr;
  const isPast = date < todayStr;

  const computedData = await Promise.all(
    rows.map(async (row, index) => {
      // --- Status Resolution ---
      let resolvedStatus = "UNMARKED";

      if (isFuture) {
        resolvedStatus = "UNMARKED";
      } else if (row.check_in_time) {
        // Has checked in — use DB status, map numeric to text
        if (row.db_status !== null && row.db_status !== undefined) {
          resolvedStatus = STATUS_MAP[row.db_status] || "PRESENT";
        } else {
          resolvedStatus = "PRESENT";
        }
      } else {
        // No check-in
        resolvedStatus = isPast ? "ABSENT" : "UNMARKED";
      }

      // --- Photo URL ---
      let photoKey = row.profile_photo_url;
      if (photoKey && photoKey.startsWith("http")) {
        try {
          const urlObj = new URL(photoKey);
          photoKey = urlObj.pathname.startsWith("/")
            ? urlObj.pathname.substring(1)
            : urlObj.pathname;
        } catch (e) {
          photoKey = row.profile_photo_url;
        }
      }

      const worked_minutes = row.work_minutes || 0;
      const overtime_mins = row.overtime_minutes || 0;
      const late_mins = row.late_minutes || 0;

      return {
        sl_no: offset + index + 1,
        employee_id: row.employee_id,
        employee_code: row.employee_code,
        name: row.full_name,
        profile_photo_url: await getS3SignedUrl(photoKey),
        department: row.department || "-",
        designation: row.designation || "-",
        shift_name: row.shift_name || "-",
        shift_start_time: row.shift_start_time || null,
        shift_end_time: row.shift_end_time || null,
        status: resolvedStatus,
        is_late: row.is_late || 0,
        // Clean "12:13 PM" format
        check_in_time: formatTimeDisplay(row.check_in_time),
        check_out_time: formatTimeDisplay(row.check_out_time),
        // Clean date only (no timestamp)
        attendance_date: date,
        // Minutes (raw) + formatted
        worked_minutes,
        formatted_worked_time: minutesToHM(worked_minutes),
        overtime_minutes: overtime_mins,
        formatted_overtime: minutesToHM(overtime_mins),
        late_minutes: late_mins,
        formatted_late: minutesToHM(late_mins),
        check_in_location: row.check_in_lat && row.check_in_lng ? `${row.check_in_lat}, ${row.check_in_lng}` : null,
        check_out_location: row.check_out_lat && row.check_out_lng ? `${row.check_out_lat}, ${row.check_out_lng}` : null,
        source: row.auto_checkout ? "AUTO_CHECKOUT" : "MANUAL"
      };
    })
  );

  /* ===========================
     SUMMARY
  =========================== */
  const summaryComputed = { total: computedData.length, present: 0, half_day: 0, absent: 0, late: 0, unmarked: 0 };
  for (const row of computedData) {
    if (row.status === "PRESENT") summaryComputed.present++;
    else if (row.status === "LATE") { summaryComputed.present++; summaryComputed.late++; }
    else if (row.status === "HALF_DAY") summaryComputed.half_day++;
    else if (row.status === "ABSENT") summaryComputed.absent++;
    else summaryComputed.unmarked++;
  }

  /* ===========================
     STATUS FILTER
  =========================== */
  const finalData = status ? computedData.filter(d => d.status === status) : computedData;

  /* ===========================
     PAGINATION COUNT
  =========================== */
  const [[{ total_records }]] = await db.query(
    `SELECT COUNT(*) AS total_records FROM employees WHERE company_id = ? AND employee_status = 'ACTIVE'`,
    [companyId]
  );

  return {
    viewType: "DAILY",
    date,
    summary: summaryComputed,
    data: finalData,
    pagination: { page, limit, total_records }
  };
};
