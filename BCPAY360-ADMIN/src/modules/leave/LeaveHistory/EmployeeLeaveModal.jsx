import React from "react";
import "../../../styles/LeaveManagement.css";

export default function EmployeeLeaveModal({ employeeId, history, onClose }) {
  const empName = history[0]?.full_name;

  return (
    <div className="lm-modal-backdrop" onClick={onClose}>
      <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lm-modal-header">
          <h3>{empName} — Leave History</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="lm-modal-body">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Leave</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>{h.leave_name}</td>
                  <td>{h.from_date}</td>
                  <td>{h.to_date}</td>
                  <td>{h.total_days}</td>
                  <td>{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
