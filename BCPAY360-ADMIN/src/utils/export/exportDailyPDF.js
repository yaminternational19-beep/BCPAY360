import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatMinutes = (minutes) => {
  if (typeof minutes === 'string' && (minutes.includes('h') || minutes.includes('m'))) {
    return minutes;
  }
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const exportDailyPDF = (rows, date) => {
  if (!rows?.length) return;

  const doc = new jsPDF("landscape");

  doc.text(`Daily Attendance Report - ${date}`, 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [[
      "Emp Code",
      "Name",
      "Dept",
      "Desig",
      "Shift",
      "Status",
      "In",
      "Out",
      "Late",
      "Early",
      "OT",
      "Hours"
    ]],
    body: rows.map(r => [
      r.employee_code,
      r.name,
      r.department,
      r.designation,
      r.shift_name,
      r.status,
      r.check_in_time || "-",
      r.check_out_time || "-",
      formatMinutes(r.late_minutes),
      formatMinutes(r.early_checkout_minutes),
      formatMinutes(r.overtime_minutes),
      r.working_hours || "-"
    ]),
    theme: 'grid',
    headStyles: { fillColor: [33, 37, 41] },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  doc.save(`Daily_Attendance_${date}.pdf`);
};
