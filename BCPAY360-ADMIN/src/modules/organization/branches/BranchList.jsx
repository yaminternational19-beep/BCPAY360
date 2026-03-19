import React, { useEffect, useState } from "react";
import "../../../styles/Branch.css";
import BranchForm from "./BranchForm";
import {
  createBranch,
  updateBranch,
  toggleBranchStatus,
  deleteBranch,
} from "../../../api/master.api";
import { useBranch } from "../../../hooks/useBranch";
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaBan } from "react-icons/fa";

export default function BranchList({ user }) {
  const isAdmin = user?.role === "COMPANY_ADMIN";

  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  // USE GLOBAL BRANCH CONTEXT
  const {
    branches,
    refreshBranches,
    isLoading,
    branchStatus
  } = useBranch();

  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // No local loadBranches needed check context

  const handleSave = async (payload) => {
    try {
      if (selected) {
        await updateBranch(selected.id, payload);
        setShowForm(false);
        setSelected(null);
        await refreshBranches();
      } else {
        await createBranch(payload);
        setShowForm(false);
        await refreshBranches();
      }
    } catch (error) {
      alert(error.message || "Failed to save branch. Please try again.");
    }
  };

  const handleEdit = (branch) => {
    setSelected(branch);
    setShowForm(true);
  };

  const handleToggleStatus = async (id) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return;

    const newStatus = !branch.is_active;
    if (!confirm(`${newStatus ? "Activate" : "Deactivate"} branch "${branch.branch_name}"?`)) return;

    try {
      await toggleBranchStatus(id);
      await refreshBranches();
    } catch (error) {
      alert("Failed to update branch status.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      await deleteBranch(id);
      await refreshBranches();
    } catch (error) {
      alert("Failed to delete branch.");
    }
  };

  return (
    <div className="branch-container">
      <div className="branch-layout-wrapper">
        <div className="branch-main-panel">

          {/* Header */}
          <div className="branch-panel-header">
            <div className="header-info">
              <h3>Branches</h3>
              <span>Total: {branches.length}</span>
            </div>

            <div className="header-actions-row">
              {canCreate && (
                <button
                  className="btn-add-branch"
                  onClick={() => {
                    setSelected(null);
                    setShowForm(true);
                  }}
                >
                  <FaPlus /> Add Branch
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="branch-list-scroll">
            {isLoading ? (
              <div className="no-data-msg">Loading branches...</div>
            ) : branches.length === 0 ? (
              <div className="branch-empty-state">
                <div className="empty-box">
                  <h3>No Branches Found</h3>
                  <p>Create your first branch to get started.</p>
                </div>
              </div>
            ) : (
              <div className="branch-grid">
                {branches.map((branch) => (
                  <div key={branch.id} className="branch-card-item">
                    <div className="branch-header">
                      <div>
                        <div className="branch-name">{branch.branch_name || branch.name}</div>
                        {branch.branch_code && (
                          <div className="branch-code">{branch.branch_code}</div>
                        )}
                      </div>
                      <span className={`status-badge ${branch.is_active ? "active" : "inactive"}`}>
                        {branch.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="branch-details">
                      {branch.location && (
                        <div className="branch-location">
                          <FaMapMarkerAlt size={12} />
                          {branch.location}
                        </div>
                      )}

                      {branch.address && (
                        <div className="branch-detail-row">
                          {branch.address}
                        </div>
                      )}

                      {(branch.phone || branch.email) && (
                        <div className="branch-detail-row">
                          {branch.phone && <span>📞 {branch.phone}</span>}
                          {branch.email && <span>✉️ {branch.email}</span>}
                        </div>
                      )}
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="branch-actions">
                        {canEdit && (
                          <>
                            <button onClick={() => handleEdit(branch)} title="Edit Branch">
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(branch.id)}
                              title={branch.is_active ? "Deactivate" : "Activate"}
                            >
                              <FaBan />
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            className="btn-trash"
                            onClick={() => handleDelete(branch.id)}
                            title="Delete Branch"
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

      {showForm && (
        <BranchForm
          initial={selected}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
