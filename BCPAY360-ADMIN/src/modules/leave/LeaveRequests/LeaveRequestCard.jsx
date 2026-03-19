import React from "react";
import "../../../styles/LeaveManagement.css";

export default function LeaveRequestCard({ request, onApprove, onReject, showActions = true }) {
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  return (
    <div className="req-card">
      <div className="req-info">
        <div className="req-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={request.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
              alt={request.full_name}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.full_name || 'U')}&background=F1F5F9&color=64748B&bold=true`;
              }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{request.full_name}</h3>
              <span className="emp-id" style={{ fontSize: '12px', color: '#64748b' }}>{request.emp_id}</span>
            </div>
          </div>
          {request.status && (
            <span className={`badge ${request.status.toLowerCase()}`}>
              {request.status}
            </span>
          )}
        </div>

        <div className="req-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Leave Type</span>
            <span className="meta-value">{request.leave_name}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Duration</span>
            <span className="meta-value">{request.total_days} Day(s)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Dates</span>
            <span className="meta-value">{formatDate(request.from_date)} - {formatDate(request.to_date)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Department</span>
            <span className="meta-value">{request.department_name || "—"}</span>
          </div>
          {request.shift_name && (
            <div className="meta-item">
              <span className="meta-label">Shift</span>
              <span className="meta-value">{request.shift_name}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">Applied On</span>
            <span className="meta-value">{formatDate(request.applied_at)}</span>
          </div>
        </div>

        {request.reason && (
          <div className="reason-box">
            <strong>Reason:</strong> {request.reason}
          </div>
        )}
      </div>

      {showActions && (
        <div className="req-actions">
          <button
            className="btn-success"
            onClick={onApprove}
            title="Approve leave request"
          >
            Approve
          </button>

          <button
            className="btn-danger"
            onClick={onReject}
            title="Reject leave request"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

