import React, { useState } from "react";
import "../../../styles/LeaveManagement.css";
import "../../../styles/Attendance.css";
import RejectLeaveModal from "./RejectLeaveModal";

export default function PendingLeaveList({
  requests = [],
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  loading,
  error,
  approve,
  reject,
  selectedIds = [],
  onSelectOne,
  onSelectAll
}) {
  const [rejecting, setRejecting] = useState(null);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  const getStatusClass = (status) => {
    if (!status) return 'pending';
    return status.toLowerCase();
  };

  const showingStart = requests.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0;
  const showingEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  const isAllSelected = requests.length > 0 && requests.every(req => selectedIds.includes(req.id));

  return (
    <div className="attendance-table-container" style={{ position: 'relative', marginTop: '20px' }}>
      {loading && (
        <div className="drawer-table-overlay" style={{ zIndex: 50 }}>Loading...</div>
      )}

      {error && <div className="error-message p-4 text-center text-red-500">{error}</div>}

      <div className="history-table-wrapper" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }}>
        <table className="attendance-table">
          <thead>
            <tr>
              {onSelectAll && (
                <th className="checkbox-cell" style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked ? requests.map(r => r.id) : [])}
                  />
                </th>
              )}
              <th className="col-profile text-center">Profile</th>
              <th className="text-center">Emp Code</th>
              <th className="text-center">Name</th>
              <th className="text-center">Leave Type</th>
              <th className="text-center">Dates</th>
              <th className="text-center">Duration</th>
              <th className="text-center">Department</th>
              <th className="text-center">Applied On</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && requests.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty text-center" style={{ padding: '40px' }}>
                  No leave requests found for this selection.
                </td>
              </tr>
            ) : (
              requests.map(req => {
                const showActions = req.status?.toUpperCase() === "PENDING" || !req.status;
                const isSelected = selectedIds.includes(req.id);
                return (
                  <tr key={req.id} className={isSelected ? 'row-selected' : ''}>
                    {onSelectOne && (
                      <td className="checkbox-cell text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectOne(req.id)}
                        />
                      </td>
                    )}
                    <td className="col-profile text-center">
                      <img
                        src={req.profile_image_url || req.profile_photo_url || req.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
                        alt={req.full_name}
                        className="attendance-avatar-sm"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.full_name || 'U')}&background=F1F5F9&color=64748B&bold=true`;
                        }}
                        style={{ margin: '0 auto', width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </td>
                    <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>
                      {req.emp_id}
                    </td>
                    <td className="text-center">
                      {req.full_name}
                    </td>
                    <td className="text-center">{req.leave_name}</td>
                    <td className="text-center">
                      <small>{formatDate(req.from_date)} - {formatDate(req.to_date)}</small>
                    </td>
                    <td className="text-center">{req.total_days} Day(s)</td>
                    <td className="text-center">{req.department_name || "-"}</td>
                    <td className="text-center">{formatDate(req.applied_at)}</td>
                    <td className="text-center">
                      <span className={`badge ${getStatusClass(req.status)}`} style={{ padding: '4px 10px', fontSize: '11px' }}>
                        {req.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-btns-dark text-center" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {showActions ? (
                          <>
                            <button
                              className="btn-success"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => approve(req.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setRejecting(req)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer" style={{ borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <div className="footer-left">
          Showing {showingStart} – {showingEnd} of {pagination.total} records
        </div>
        <div className="pagination">
          <button disabled={pagination.page <= 1 || loading} onClick={() => onPageChange(1)} title="First Page">{"<<"}</button>
          <button disabled={pagination.page <= 1 || loading} onClick={() => onPageChange(pagination.page - 1)} title="Previous">{"<"}</button>
          <span className="page-info">{pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => onPageChange(pagination.page + 1)} title="Next">{">"}</button>
          <button disabled={pagination.page >= pagination.totalPages || loading} onClick={() => onPageChange(pagination.totalPages)} title="Last Page">{">>"}</button>
        </div>
      </div>

      {rejecting && (
        <RejectLeaveModal
          request={rejecting}
          onClose={() => setRejecting(null)}
          onSubmit={async (remarks) => {
            await reject(rejecting.id, remarks);
            setRejecting(null);
          }}
        />
      )}
    </div>
  );
}
