import React, { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
// import { makeEmployees } from "../utils/mockData"; // REMOVED
import "../styles/Accounts.css";

const Accounts = () => {
  const user = JSON.parse(localStorage.getItem("auth_user"));

  const [employees] = useState(() => []);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);

  const unauthorized =
    !user || !user.verified || !["ADMIN", "HR"].includes(user.role);

  const visibleEmployees = useMemo(() => {
    if (!user) return [];
    if (user.role === "COMPANY_ADMIN") return employees;
    return employees.filter(e => e.department === user.department);
  }, [employees, user]);

  const rows = useMemo(() => {
    return visibleEmployees.flatMap(emp =>
      [...emp.reports.salary, ...emp.reports.pf, ...emp.reports.esi].map(r => ({
        emp,
        report: r
      }))
    );
  }, [visibleEmployees]);

  const filtered = rows.filter(({ emp }) => {
    const q = query.toLowerCase();
    return emp.id.toLowerCase().includes(q) || emp.name.toLowerCase().includes(q);
  });

  if (unauthorized) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="accounts-page">
      <h2>Accounts – Approval Queue</h2>

      <input
        className="accounts-search"
        placeholder="Search EMP ID or Name"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <table className="accounts-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Report</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ emp, report }, i) => (
            <tr key={i}>
              <td>{emp.name} ({emp.id})</td>
              <td>{report.title}</td>
              <td>{report.approvalStatus}</td>
              <td>
                <button
                  className="btn btn-preview"
                  onClick={() => setPreview({ emp, report })}
                >
                  Preview
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <h3>Preview – {preview.report.title}</h3>

            <div className="preview-grid">
              <div><b>Name:</b> {preview.emp.name}</div>
              <div><b>EMP ID:</b> {preview.emp.id}</div>
              <div><b>Department:</b> {preview.emp.department}</div>
              <div><b>Salary:</b> ₹{preview.emp.salary}</div>
              <div><b>PAN:</b> {preview.emp.pan}</div>
              <div><b>Aadhaar:</b> {preview.emp.aadhaar}</div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-approve">Approve</button>
              <button className="btn btn-reject">Reject</button>
              <button className="btn btn-close" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
