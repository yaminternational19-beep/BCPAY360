import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportMonthlyPDF = (
  data,
  {
    fromDate,
    toDate,
    fileName = "monthly-attendance.pdf"
  } = {}
) => {
  if (!data || !data.length) return;

  const doc = new jsPDF("landscape", "pt", "a4");

  /* ===========================
     HEADER
  =========================== */
  doc.setFontSize(14);
  doc.text("Monthly Attendance Report", 40, 40);

  doc.setFontSize(10);
  doc.text(`Period: ${fromDate} to ${toDate}`, 40, 60);

  /* ===========================
     TABLE HEADERS
  =========================== */
  const days = Object.keys(data[0].days);

  const head = [
    [
      "#",
      "Emp Code",
      "Employee",
      "Department",
      "Shift",
      ...days,
      "P",
      "A",
      "L",
      "U",
      "H"
    ]
  ];

  /* ===========================
     TABLE BODY
  =========================== */
  const body = data.map((emp, index) => [
    index + 1,
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
  ]);

  /* ===========================
     RENDER TABLE
  =========================== */
  autoTable(doc, {
    startY: 80,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      halign: "center"
    },
    headStyles: {
      fillColor: [37, 99, 235], // blue
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      2: { halign: "left" }, // Employee name
      3: { halign: "left" }, // Department
      4: { halign: "left" }  // Shift
    },
    theme: "grid"
  });

  /* ===========================
     SAVE FILE
  =========================== */
  doc.save(fileName);
};
