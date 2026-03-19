import React from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import "../styles/EmployeeList.css";

/* ===================================================================================
   PAGINATION UI
   =================================================================================== */
const PaginationUI = ({ page, total, pageSize, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(1)} title="First Page">{"<<"}</button>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} title="Previous">{"<"}</button>
      <span className="page-info">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} title="Next">{">"}</button>
      <button disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} title="Last Page">{">>"}</button>
    </div>
  );
};

const EmployeeListComponent = ({
  employees = [],
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  togglingIds = new Set(),
  loading = false,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}) => {

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? employees.filter(e => selectedIds.includes(e.id))
      : employees;

    if (!dataToExport.length) return; // Silent return or better feedback

    const exportData = dataToExport.map(e => ({
      "Emp Code": e.employee_code,
      "Name": e.full_name,
      "Email": e.email || "",
      "Phone": e.phone_number || e.phone || "",
      "Branch": e.branch_name || "",
      "Department": e.department_name || "",
      "Designation": e.designation_name || "",
      "Shift": e.shift_name || "",
      "Joining Date": e.joining_date,
      "Salary": e.salary,
      "Status": e.employee_status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isAllSelected = employees.length > 0 && employees.every(e => selectedIds.includes(e.id));

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      onSelectAll(employees.map(e => e.id));
    } else {
      onSelectAll([]);
    }
  };

  if (loading && !employees.length) {
    return <div className="no-data-msg">Loading records...</div>;
  }

  return (
    <div className="employee-list-container">
      <div className="table-responsive">
        <table className="employee-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>PHOTO</th>
              <th>EMP CODE</th>
              <th>NAME</th>
              <th>PHONE</th>
              <th>EMAIL</th>
              <th>BRANCH</th>
              <th>DEPT</th>
              <th>DESIG</th>
              <th>SHIFT</th>
              <th>JOINING</th>
              <th>SALARY</th>
              <th>STATUS</th>
              <th className="actions-header">ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {employees.length > 0 ? (
              employees.map(emp => {
                const isActive = String(emp.employee_status || '').toUpperCase() === "ACTIVE";
                const isSelected = selectedIds.includes(emp.id);

                return (
                  <tr key={emp.id} className={`${!isActive ? "row-inactive" : ""} ${isSelected ? "row-selected" : ""}`}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOne(emp.id)}
                      />
                    </td>
                    <td>
                      <div className="avatar-wrapper-32">
                        {emp.profile_photo_url ? (
                          <img
                            src={emp.profile_photo_url}
                            alt={emp.full_name}
                            className="avatar-img-32"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="avatar-fallback-32" style={{ display: emp.profile_photo_url ? 'none' : 'flex' }}>
                          👤
                        </div>
                      </div>
                    </td>
                    <td className="emp-code"><strong>{emp.employee_code}</strong></td>
                    <td>{emp.full_name}</td>
                    <td>{emp.phone_number || emp.phone || "-"}</td>
                    <td className="email-text">{emp.email || "-"}</td>
                    <td>{emp.branch_name || "-"}</td>
                    <td>{emp.department_name || "-"}</td>
                    <td>{emp.designation_name || "-"}</td>
                    <td className="shift-cell">
                      <span className={`shift-badge ${emp.shift_name?.toLowerCase()}`}>
                        {emp.shift_name || "-"}
                      </span>
                    </td>
                    <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB') : "-"}</td>
                    <td className="salary">₹{Number(emp.salary || 0).toLocaleString()}</td>
                    <td>
                      <span className={`status-pill ${isActive ? "pill-active" : "pill-inactive"}`}>
                        {emp.employee_status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-btns-dark">
                        <Link to={`/employees/${emp.id}`} className="dark-icon-btn view" title="View Profile">
                          <Eye size={16} />
                        </Link>
                        <button onClick={() => onEdit(emp.id)} className="dark-icon-btn edit" title="Edit" disabled={togglingIds.has(emp.id)}>
                          <Pencil size={16} />
                        </button>
                        {isActive ? (
                          <button onClick={() => onDeactivate(emp.id)} className="dark-icon-btn deactivate" title="Deactivate" disabled={togglingIds.has(emp.id)}>
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button onClick={() => onActivate(emp.id)} className="dark-icon-btn activate" title="Activate" disabled={togglingIds.has(emp.id)}>
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => onDelete(emp.id)} className="dark-icon-btn delete" title="Delete" disabled={togglingIds.has(emp.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="14" className="empty-row">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="footer-left">
          Showing {employees.length > 0 ? (page - 1) * pageSize + 1 : 0} –{" "}
          {Math.min(page * pageSize, total)} of {total}
        </div>
        <PaginationUI page={page} total={total} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    </div>
  );
};

export default EmployeeListComponent;
