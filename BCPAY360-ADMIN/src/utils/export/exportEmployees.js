import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ===================================================================================
   HELPER: FORMAT DATA
   =================================================================================== */
const formatEmployeeData = (employees) => {
    return employees.map((emp) => ({
        "ID": emp.id || "-",
        "Emp Code": emp.employee_code || emp.employeeCode || emp.emp_code || "-",
        "Full Name": emp.full_name || emp.fullName || emp.name || "-",
        "Email": emp.email || emp.Email || "-",
        "Phone": emp.phone_number || emp.phoneNumber || emp.phone || "-",
        "Branch": emp.branch_name || emp.branchName || "-",
        "Department": emp.department_name || emp.departmentName || "-",
        "Designation": emp.designation_name || emp.designationName || "-",
        "Emp Type": emp.employee_type_name || emp.employeeTypeName || "-",
        "Shift": emp.shift_name || emp.shiftName || "-",
        "Gender": emp.gender || "-",
        "DOB": (emp.dob || emp.dateOfBirth) ? new Date(emp.dob || emp.dateOfBirth).toLocaleDateString("en-GB") : "-",
        "Father's Name": emp.father_name || emp.fatherName || "-",
        "Religion": emp.religion || "-",
        "Marital Status": emp.marital_status || emp.maritalStatus || "-",
        "Qualification": emp.qualification || "-",
        "Joining Date": (emp.joining_date || emp.joiningDate) ? new Date(emp.joining_date || emp.joiningDate).toLocaleDateString("en-GB") : "-",
        "Experience": emp.experience_years || emp.experienceYears ? `${emp.experience_years || emp.experienceYears} Years` : "-",
        "Salary": (emp.salary || emp.baseSalary) ? `INR ${Number(emp.salary || emp.baseSalary).toLocaleString("en-IN")}` : "-",
        "Annual CTC": (emp.ctc_annual || emp.ctc) ? `INR ${Number(emp.ctc_annual || emp.ctc).toLocaleString("en-IN")}` : "-",
        "Aadhaar Number": emp.aadhaar_number || emp.aadhaarNumber || "-",
        "PAN Number": emp.pan_number || emp.panNumber || "-",
        "UAN Number": emp.uan_number || emp.uanNumber || "-",
        "ESIC Number": emp.esic_number || emp.esicNumber || "-",
        "Bank Name": emp.bank_name || emp.bankName || "-",
        "Account Number": emp.account_number || emp.accountNumber || "-",
        "IFSC Code": emp.ifsc_code || emp.ifscCode || "-",
        "Bank Branch": emp.bank_branch_name || emp.bankBranchName || "-",
        "Address": emp.address || "-",
        "Permanent Address": emp.permanent_address || "-",
        "Job Location": emp.job_location || emp.jobLocation || "-",
        "Profile Photo": emp.profile_photo_url || emp.profilePhotoUrl || emp.profile_photo || "-",
        "Status": emp.employee_status || emp.status || "-",
        "Employment Status": emp.employment_status || "-",
    }));
};

const formatLeaveRequestData = (requests) => {
    return requests.map((req) => ({
        "Emp ID": req.employee_code || req.employeeCode || "-",
        "Full Name": req.full_name || req.fullName || "-",
        "Email": req.email || "-",
        "Phone": req.phone_number || req.phone || "-",
        "Branch": req.branch_name || "-",
        "Department": req.department_name || "-",
        "Designation": req.designation_name || "-",
        "Dates": `${new Date(req.from_date).toLocaleDateString("en-GB")} - ${new Date(req.to_date).toLocaleDateString("en-GB")}`,
        "Duration": `${req.total_days} Day(s)`,
        "Applied On": new Date(req.applied_at).toLocaleDateString("en-GB"),
        "Reason": req.reason || "-",
        "Status": req.status || "PENDING",
    }));
};

const formatAttendanceData = (attendanceRecords) => {
    return attendanceRecords.map((r) => ({
        "Emp ID": r.employee_code || r.employeeCode || "-",
        "Full Name": r.full_name || r.fullName || "-",
        "Date": new Date(r.attendance_date).toLocaleDateString("en-GB"),
        "CheckIn": r.check_in_time || "-",
        "CheckOut": r.check_out_time || "-",
        "LateMins": r.late_minutes || 0,
        "EarlyOutMins": r.early_checkout_minutes || 0,
        "OvertimeMins": r.overtime_minutes || 0,
        "TotalHours": r.working_hours || "-",
        "Status": r.attendance_status || r.status || "-",
    }));
};

/* ===================================================================================
   EXCEL EXPORT
   =================================================================================== */
export const exportEmployeesExcel = (employees, filename = "Employees_Export") => {
    if (!employees || !employees.length) {
        alert("No data to export");
        return;
    }

    const formattedData = formatEmployeeData(employees);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // Auto-width for columns (approximate)
    const cols = Object.keys(formattedData[0]).map(key => ({ wch: Math.max(key.length, 18) }));
    worksheet["!cols"] = cols;

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

export const exportLeaveRequestsExcel = (requests, filename = "Leave_Requests_Export") => {
    if (!requests || !requests.length) {
        alert("No data to export");
        return;
    }

    const formattedData = formatLeaveRequestData(requests);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Requests");

    // Auto-width for columns (approximate)
    const cols = Object.keys(formattedData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet["!cols"] = cols;

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

export const exportAttendanceExcel = (attendanceRecords, filename = "Attendance_Export") => {
    if (!attendanceRecords || !attendanceRecords.length) {
        alert("No data to export");
        return;
    }

    const formattedData = formatAttendanceData(attendanceRecords);
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Auto-width for columns (approximate)
    const cols = Object.keys(formattedData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet["!cols"] = cols;

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `${filename}_${dateStr}.xlsx`);
};

/* ===================================================================================
   PDF EXPORT
   =================================================================================== */
export const exportEmployeesPDF = (employees, filename = "Employees_Export") => {
    if (!employees || !employees.length) {
        alert("No data to export");
        return;
    }

    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    const dateStr = new Date().toISOString().split("T")[0];

    // Title
    doc.setFontSize(16);
    doc.text("Master Employee List Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${dateStr} | Total Records: ${employees.length}`, 14, 22);

    // Selected columns for PDF
    const tableColumn = [
        "ID", "Code", "Full Name", "Email", "Phone", "Branch", "Dept", "Desig", "Joining", "Salary", "Status"
    ];

    const tableRows = employees.map(emp => [
        emp.id || "-",
        emp.employee_code || emp.employeeCode || emp.emp_code || "-",
        emp.full_name || emp.fullName || emp.name || "-",
        emp.email || emp.Email || "-",
        emp.phone_number || emp.phoneNumber || emp.phone || "-",
        emp.branch_name || emp.branchName || "-",
        emp.department_name || emp.departmentName || "-",
        emp.designation_name || emp.designationName || "-",
        (emp.joining_date || emp.joiningDate) ? new Date(emp.joining_date || emp.joiningDate).toLocaleDateString("en-GB") : "-",
        (emp.salary || emp.baseSalary) ? `INR ${Number(emp.salary || emp.baseSalary).toLocaleString()}` : "-",
        emp.employee_status || emp.status || "-"
    ]);

    autoTable(doc, {
        startY: 28,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [26, 32, 44], textColor: 255, fontStyle: 'bold', fontSize: 7.5 }, 
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' }, 
        columnStyles: {
            0: { cellWidth: 8 },  // ID
            1: { cellWidth: 15 }, // Code
            2: { cellWidth: 32 }, // Name
            3: { cellWidth: 45 }, // Email
            4: { cellWidth: 20 }, // Phone
            5: { cellWidth: 25 }, // Branch
            6: { cellWidth: 20 }, // Dept
            7: { cellWidth: 32 }, // Desig
            8: { cellWidth: 18 }, // Joining
            9: { cellWidth: 20 }, // Salary
            10: { cellWidth: 15 } // Status
        }
    });

    doc.save(`${filename}_${dateStr}.pdf`);
};
