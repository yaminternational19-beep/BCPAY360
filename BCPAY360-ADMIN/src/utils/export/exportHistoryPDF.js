import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportHistoryPDF = (records, employeeName) => {
  if (!records || !records.length) return;

  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(
    `${employeeName} - Attendance History`,
    14,
    20
  );

  autoTable(doc, {
    startY: 30,
    head: [["Date", "Status", "Check In", "Check Out", "Working Hours"]],
    body: records.map(r => [
      r.attendance_date ? new Date(r.attendance_date).toLocaleDateString("en-GB") : "-",
      r.status || "—",
      r.check_in_time || "-",
      r.check_out_time || "-",
      r.working_hours || "-"
    ]),
    styles: { fontSize: 10 }
  });

  const safeName = employeeName?.replace(/\s+/g, "_") || "Employee";
  doc.save(`${safeName}_Attendance_History.pdf`);
};
