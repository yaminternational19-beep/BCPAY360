import * as XLSX from "xlsx";

export const exportMonthlyExcel = (data, fromDate, toDate) => {
  if (!data?.length) return;

  const days = Object.keys(data[0].days);

  const rows = data.map(emp => ({
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

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Monthly Attendance");

  XLSX.writeFile(
    wb,
    `Monthly_Attendance_${fromDate}_to_${toDate}.xlsx`
  );
};
