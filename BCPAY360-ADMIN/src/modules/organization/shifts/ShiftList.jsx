import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaClock, FaSearch } from "react-icons/fa";
import "../../../styles/Shifts.css";

export default function ShiftList({
  branches,
  selectedBranch,
  branchStatus,
  changeBranch,
  shifts,
  onAdd,
  onEdit,
  onDelete,
  user
}) {
  const isAdmin = user?.role === "COMPANY_ADMIN";
  const isHR = user?.role === "HR";

  const canCreate = isAdmin;
  const canEdit = isAdmin || isHR;
  const canDelete = isAdmin;

  const [searchTerm, setSearchTerm] = useState("");

  const formatTime = (time) => {
    if (!time) return "—";
    if (time.includes(":")) {
      const [h, m] = time.split(":");
      return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    }
    return time;
  };

  const filteredShifts = shifts.filter(s =>
    (s.shift_name || s.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. Handle LOADING state
  if (branchStatus === "LOADING") {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // 1. Handle NO_BRANCH state (Critical blocker)
  if (branchStatus === "NO_BRANCH") {
    return (
      <div className="sm-page-container">
        <div className="sm-empty-state">
          <div className="sm-empty-box">
            <h3>No Branches Found</h3>
            <p>Please create a branch to manage shifts.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm-page-container">
      <div className="sm-layout-wrapper">
        <div className="sm-main-panel">

          {/* Unified Header */}
          <div className="sm-panel-header">
            <div className="sm-header-info">
              <h3>Shift Management</h3>
              <span>Total: {filteredShifts.length}</span>
            </div>

            <div className="sm-header-actions">
              <div className="sm-branch-nav">
                {/* 4. FIX the <select> */}
                <select
                  value={selectedBranch === null ? "ALL" : selectedBranch}
                  onChange={(e) => {
                    const value = e.target.value;
                    changeBranch(value === "ALL" ? null : Number(value));
                  }}
                  className="sm-branch-dropdown"
                >
                  {branches.length > 1 && (
                    <option value="ALL">All Branches</option>
                  )}

                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-bar-et">
                <FaSearch className="search-icon" />
                <input
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {canCreate && selectedBranch && (
                <button onClick={onAdd} className="sm-btn-add">
                  <FaPlus /> Add Shift
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="sm-list-scroll">
            {filteredShifts.length === 0 ? (
              <div className="no-data-msg">No shifts found.</div>
            ) : (
              <div className="sm-grid">
                {filteredShifts.map((shift) => (
                  <div key={shift.id} className="sm-card-item">
                    <div className="sm-card-header">
                      <div className="sm-card-name">{shift.shift_name || shift.name}</div>
                      <span className={`sm-status-badge ${shift.is_active ? "active" : "inactive"}`}>
                        {shift.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="sm-card-time">
                      <FaClock size={12} />
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </div>

                    <div className="sm-card-desc">
                      {shift.description || "No description provided."}
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="sm-card-actions">
                        {canEdit && (
                          <button onClick={() => onEdit(shift)} title="Edit Shift">
                            <FaEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="sm-btn-trash"
                            onClick={() => onDelete(shift.id)}
                            title="Delete Shift"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

