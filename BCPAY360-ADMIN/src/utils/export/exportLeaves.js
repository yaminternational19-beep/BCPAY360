import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportLeavesExcel = (data, filename = "Leave_Requests") => {
    const exportData = data.map(req => ({
        "Emp Code": req.emp_id,
        "Employee Name": req.full_name,
        "Department": req.department_name || "-",
        "Leave Type": req.leave_name,
        "Dates": `${new Date(req.from_date).toLocaleDateString("en-GB")} - ${new Date(req.to_date).toLocaleDateString("en-GB")}`,
        "Duration": `${req.total_days} Day(s)`,
        "Applied On": new Date(req.applied_at).toLocaleDateString("en-GB"),
        "Reason": req.reason || "-",
        "Status": req.status || "PENDING"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");
    XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportLeavesPDF = (data, filename = "Leave_Requests") => {
    const doc = new jsPDF("landscape");

    doc.text("Leave Requests Report", 14, 15);

    const tableColumn = ["Emp Code", "Employee Name", "Department", "Leave Type", "Dates", "Duration", "Applied On", "Reason", "Status"];
    const tableRows = data.map(req => [
        req.emp_id,
        req.full_name,
        req.department_name || "-",
        req.leave_name,
        `${new Date(req.from_date).toLocaleDateString("en-GB")} - ${new Date(req.to_date).toLocaleDateString("en-GB")}`,
        `${req.total_days} Day(s)`,
        new Date(req.applied_at).toLocaleDateString("en-GB"),
        req.reason || "-",
        req.status || "PENDING"
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`${filename}.pdf`);
};
