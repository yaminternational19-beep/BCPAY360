import React, { useState } from "react";
import "../../../styles/LeaveManagement.css";
import "../../../styles/Attendance.css";
import useLeaveMaster from "../hooks/useLeaveMaster";
import LeavePolicyForm from "./LeavePolicyForm";

export default function LeavePolicyTable({ filters, leaveMaster }) {
  const {
    leaveTypes,
    loading,
    addLeaveType,
    editLeaveType,
    removeLeaveType,
    toggleStatus
  } = leaveMaster || {};

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  /* ================= SAVE ================= */
  const handleSave = async (payload) => {
    if (editData) {
      await editLeaveType(editData.id, payload);
    } else {
      await addLeaveType(payload);
    }
    setShowForm(false);
    setEditData(null);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this leave type? This cannot be undone.")) return;
    await removeLeaveType(id);
  };

  // Local Filtering
  const filteredPolicies = leaveTypes.filter(l => {
    const matchesSearch = !filters.search ||
      l.leave_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      l.leave_code.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div className="loading-overlay">
          Loading leave policies...
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="attendance-table-container" style={{ position: 'relative', marginTop: '20px' }}>
        <div className="history-table-wrapper" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }}>
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '50px' }}>Sl No</th>
                <th className="text-center">Code</th>
                <th className="text-center">Name</th>
                <th className="text-center">Quota</th>
                <th className="text-center">Paid</th>
                <th className="text-center">Carry Forward</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPolicies.length === 0 && (
                <tr>
                  <td colSpan="8" className="table-empty text-center" style={{ padding: '40px' }}>
                    No leave types matched your criteria
                  </td>
                </tr>
              )}

              {filteredPolicies.map((l, index) => (
                <tr key={l.id}>
                  <td className="text-center font-medium">{index + 1}</td>
                  <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>{l.leave_code}</td>
                  <td className="text-center">{l.leave_name}</td>
                  <td className="text-center"><span className="days-badge">{l.annual_quota} Days</span></td>
                  <td className="text-center">
                    <span className={`badge ${l.is_paid ? 'approved' : 'rejected'}`} style={{ padding: '4px 10px', fontSize: '11px' }}>
                      {l.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="text-center">
                    {l.allow_carry_forward
                      ? `Yes (${l.max_carry_forward} Days)`
                      : "No"}
                  </td>
                  <td className="text-center">
                    <label className="switch" style={{ margin: '0 auto' }}>
                      <input
                        type="checkbox"
                        checked={l.is_active === 1}
                        onChange={() =>
                          toggleStatus(l.id, l.is_active ? 0 : 1)
                        }
                      />
                      <span className="slider" />
                    </label>
                  </td>
                  <td className="actions-cell">
                    <div className="action-btns-dark text-center" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditData(l);
                          setShowForm(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px', border: 'none', backgroundColor: '#e0f2fe', color: '#0284c7', width: 'auto', minWidth: 'auto' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger table-action"
                        onClick={() => handleDelete(l.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', width: 'auto', minWidth: 'auto' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer" style={{ borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <div className="footer-left">
            Showing {filteredPolicies.length ? 1 : 0} – {filteredPolicies.length} of {filteredPolicies.length} records
          </div>
          <div className="pagination">
            <button disabled={true} title="First Page">{"<<"}</button>
            <button disabled={true} title="Previous">{"<"}</button>
            <span className="page-info">1 / 1</span>
            <button disabled={true} title="Next">{">"}</button>
            <button disabled={true} title="Last Page">{">>"}</button>
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {showForm && (
        <LeavePolicyForm
          initialData={editData}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
