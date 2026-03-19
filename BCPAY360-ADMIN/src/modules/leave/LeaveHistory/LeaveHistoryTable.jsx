import React, { useState } from "react";
import "../../../styles/LeaveManagement.css";
import "../../../styles/Attendance.css";
import EmployeeLeaveModal from "./EmployeeLeaveModal";

export default function LeaveHistoryTable({
  history = [],
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  loading,
  error,
}) {
  const [selectedEmp, setSelectedEmp] = useState(null);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      {loading && (
        <div className="lm-loading-overlay">
          <div className="spinner"></div>
          <span>Syncing History...</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && history.length === 0 && (
        <div className="lm-empty-state">
          <p>No leave history available for the selected filters.</p>
        </div>
      )}

      <div className="attendance-table-container" style={{ position: 'relative', marginTop: '20px' }}>
        <div className="history-table-wrapper" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }}>
          <table className={`attendance-table ${loading ? 'opacity-40' : ''}`}>
            <thead>
              <tr>
                <th className="text-center" style={{ width: '50px' }}>Sl No</th>
                <th className="col-profile text-center">Profile</th>
                <th className="text-center">Emp Code</th>
                <th className="text-center">Name</th>
                <th className="text-center">Leave Type</th>
                <th className="text-center">Dates</th>
                <th className="text-center">Duration</th>
                <th className="text-center">Status</th>
                <th className="text-center">Applied On</th>
              </tr>
            </thead>

            <tbody>
              {history.map((row, index) => {
                const slNo = ((pagination.page - 1) * pagination.limit) + index + 1;
                return (
                  <tr
                    key={row.id}
                    className="clickable"
                    onClick={() => setSelectedEmp(row)}
                    title="Click to view details"
                  >
                    <td className="text-center font-medium">{slNo}</td>
                    <td className="col-profile text-center">
                      <img
                        src={row.profile_image_url || row.profile_photo_url || row.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
                        alt={row.full_name}
                        className="attendance-avatar-sm"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.full_name || 'U')}&background=F1F5F9&color=64748B&bold=true`;
                        }}
                        style={{ margin: '0 auto', width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </td>
                    <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>
                      {row.emp_id}
                    </td>
                    <td className="text-center">{row.full_name}</td>
                    <td className="text-center">{row.leave_name}</td>
                    <td className="text-center">
                      <small>{formatDate(row.from_date)} - {formatDate(row.to_date)}</small>
                    </td>
                    <td className="text-center">{row.total_days} Day(s)</td>
                    <td className="text-center">
                      <span className={`badge ${row.status?.toLowerCase() || 'pending'}`} style={{ padding: '4px 10px', fontSize: '11px' }}>
                        {row.status}
                      </span>
                    </td>
                    <td className="text-center">{formatDate(row.applied_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-footer" style={{ borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <div className="footer-left">
            Showing {history.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} – {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </div>
          <div className="pagination">
            <button disabled={pagination.page <= 1 || loading} onClick={() => onPageChange(1)} title="First Page">{"<<"}</button>
            <button disabled={pagination.page <= 1 || loading} onClick={() => onPageChange(pagination.page - 1)} title="Previous">{"<"}</button>
            <span className="page-info">{pagination.page} / {pagination.totalPages}</span>
            <button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => onPageChange(pagination.page + 1)} title="Next">{">"}</button>
            <button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => onPageChange(pagination.totalPages)} title="Last Page">{">>"}</button>
          </div>
        </div>
      </div>

      {selectedEmp && (
        <EmployeeLeaveModal
          employeeId={selectedEmp.employee_id}
          history={[selectedEmp]} // Show details for this specific one
          onClose={() => setSelectedEmp(null)}
        />
      )}
    </div>
  );
}
