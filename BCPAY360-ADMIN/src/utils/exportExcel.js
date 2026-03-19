import * as XLSX from "xlsx";

/* ===========================
   CSV EXPORT
=========================== */
export const exportMonthlyCSV = (data, fileName = "monthly-attendance.csv") => {
  if (!data?.length) return;

  const headers = [
    "Employee Code",
    "Employee Name",
    "Department",
    "Shift",
    ...Object.keys(data[0].days),
    "P",
    "A",
    "L",
    "U",
    "H"
  ];

  const rows = data.map(emp => [
    emp.employee_code,
    emp.name,
    emp.department,
    emp.shift,
    ...Object.values(emp.days),
    emp.totals.present,
    emp.totals.absent,
    emp.totals.leave,
    emp.totals.unmarked,
    emp.totals.holiday
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  window.URL.revokeObjectURL(url);
};

/* ===========================
   EXCEL EXPORT
=========================== */
export const exportMonthlyExcel = (data, fileName = "monthly-attendance.xlsx") => {
  if (!data?.length) return;

  const sheetData = data.map(emp => ({
    EmployeeCode: emp.employee_code,
    Name: emp.name,
    Department: emp.department,
    Shift: emp.shift,
    ...emp.days,
    P: emp.totals.present,
    A: emp.totals.absent,
    L: emp.totals.leave,
    U: emp.totals.unmarked,
    H: emp.totals.holiday
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  XLSX.writeFile(workbook, fileName);
};
