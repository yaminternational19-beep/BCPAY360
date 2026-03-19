import * as XLSX from "xlsx";

const formatMinutes = (minutes) => {
  if (typeof minutes === 'string' && (minutes.includes('h') || minutes.includes('m'))) {
    return minutes;
  }
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const exportDailyExcel = (rows, date) => {
  if (!rows?.length) return;

  const data = rows.map(r => ({
    "Employee Code": r.employee_code,
    "Name": r.name,
    "Department": r.department,
    "Designation": r.designation,
    "Shift": r.shift_name,
    "Status": r.status,
    "Check In": r.check_in_time || "-",
    "Check Out": r.check_out_time || "-",
    "Late (Hh Mm)": formatMinutes(r.late_minutes),
    "Early Out (Hh Mm)": formatMinutes(r.early_checkout_minutes),
    "Overtime (Hh Mm)": formatMinutes(r.overtime_minutes),
    "Working Hours": r.working_hours || "-"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily Attendance");

  XLSX.writeFile(wb, `Daily_Attendance_${date}.xlsx`);
};
