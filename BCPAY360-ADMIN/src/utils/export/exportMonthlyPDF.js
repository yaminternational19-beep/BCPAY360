import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportMonthlyPDF = (data, fromDate, toDate) => {
  if (!data?.length) return;

  const doc = new jsPDF("landscape");

  doc.text(
    `Monthly Attendance (${fromDate} to ${toDate})`,
    14,
    20
  );

  const days = Object.keys(data[0].days);

  autoTable(doc, {
    startY: 30,
    head: [[
      "Emp Code", "Name", "Dept", "Shift",
      ...days, "P", "A", "L", "U", "H"
    ]],
    body: data.map(emp => [
      emp.employee_code,
      emp.name,
      emp.department,
      emp.shift,
      ...days.map(d => emp.days[d]),
      emp.totals.present,
      emp.totals.absent,
      emp.totals.leave,
      emp.totals.unmarked,
      emp.totals.holiday
    ]),
    styles: { fontSize: 7 }
  });

  doc.save(
    `Monthly_Attendance_${fromDate}_to_${toDate}.pdf`
  );
};
