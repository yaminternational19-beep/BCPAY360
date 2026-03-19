import React, { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
// import { makeEmployees } from "../utils/mockData"; // REMOVED
import "../styles/Softwarereports.css";

const Softwarereports = () => {
  const user = JSON.parse(localStorage.getItem("auth_user"));

  const [employees] = useState(() => []);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(null);

  const unauthorized =
    !user || !user.verified || !["COMPANY_ADMIN", "HR"].includes(user.role);

  const visibleEmployees = useMemo(() => {
    if (!user) return [];
    if (user.role === "COMPANY_ADMIN") return employees;
    return employees.filter(e => e.department === user.department);
  }, [employees, user]);

  const rows = useMemo(() => {
    return visibleEmployees.flatMap(emp =>
      [...emp.reports.attendance, ...emp.reports.leave, ...emp.reports.personnel]
        .map(r => ({ emp, report: r }))
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
    <div className="software-page">
      <h2>Software Reports – Approval Queue</h2>

      <input
        className="software-search"
        placeholder="Search EMP ID or Name"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {filtered.map(({ emp, report }, i) => (
        <div key={i} className="report-card">
          <strong>{report.title}</strong>
          <p>{emp.name} ({emp.id})</p>
          <button
            className="btn-preview"
            onClick={() => setPreview({ emp, report })}
          >
            Preview
          </button>
        </div>
      ))}

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
              <div><b>Joining:</b> {preview.emp.joiningDate}</div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-approve">Approve</button>
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

export default Softwarereports;
