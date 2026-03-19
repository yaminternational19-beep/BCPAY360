import React, { useState } from "react";
import "../../../styles/LeaveManagement.css";

export default function RejectLeaveModal({ request, onClose, onSubmit }) {
  const [remarks, setRemarks] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Reject Leave</h3>

        <p>
          Reject leave request for <strong>{request.full_name}</strong>?
        </p>

        <textarea
          placeholder="Rejection remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <div className="modal-actions">
          <button
            className="btn-danger"
            onClick={() => onSubmit(remarks)}
          >
            Reject
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
