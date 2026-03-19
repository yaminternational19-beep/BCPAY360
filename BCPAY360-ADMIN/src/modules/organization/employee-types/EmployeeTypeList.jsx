import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaPlus } from "react-icons/fa";
import { useToast } from "../../../context/ToastContext";
import "../../../styles/EmployeeTypes.css";
import { useBranch } from "../../../hooks/useBranch";
import {
  getEmployeeTypes,
  createEmployeeType,
  updateEmployeeType,
  deleteEmployeeType as apiDeleteEmployeeType,
} from "../../../api/master.api";

export default function EmployeeTypeList({ user }) {
  const isAdmin = user?.role === "COMPANY_ADMIN";
  const isHR = user?.role === "HR";

  const canCreate = isAdmin || isHR;
  const canEdit = isAdmin || isHR;
  const canDelete = isAdmin;

  // Use centralized branch state
  const {
    branches,
    selectedBranch,
    changeBranch,
    branchStatus,
    isLoading: branchLoading
  } = useBranch();

  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [newType, setNewType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();


  const loadEmployeeTypes = async (branchId) => {
    // If you want to support "All Branches" view for Employee Types, 
    // update this logic. Currently mirroring Shift.jsx pattern which allows null.
    try {
      const data = await getEmployeeTypes(branchId);
      setEmployeeTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load employee types: " + error.message);
      setEmployeeTypes([]);
    }
  };

  useEffect(() => {
    loadEmployeeTypes(selectedBranch);
  }, [selectedBranch]);


  const handleCreateEmployeeType = async () => {
    if (!canCreate || !selectedBranch) return;

    if (!newType.trim()) {
      return toast.error("Please enter the employee type name then click on the add button");
    }

    setLoading(true);
    try {
      await createEmployeeType({
        type_name: newType.trim(),
        branch_id: Number(selectedBranch),
      });
      setNewType("");
      toast.success("Employee type created successfully");
      loadEmployeeTypes(selectedBranch);
    } catch (error) {
      toast.error("Failed to create employee type: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployeeType = async (id) => {
    if (!canEdit || !editingName.trim()) return;

    setLoading(true);
    try {
      await updateEmployeeType(id, { type_name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      toast.success("Employee type updated");
      loadEmployeeTypes(selectedBranch);
    } catch (error) {
      toast.error("Failed to update employee type: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployeeType = async (id) => {
    if (!canDelete) return;
    if (!confirm("Delete this employee type?")) return;

    try {
      await apiDeleteEmployeeType(id);
      toast.success("Employee type deleted");
      loadEmployeeTypes(selectedBranch);
    } catch (error) {
      toast.error("Failed to delete employee type: " + error.message);
    }
  };


  // 1. Handle LOADING state
  if (branchStatus === "LOADING") {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // 2. Handle NO_BRANCH state
  if (branchStatus === "NO_BRANCH") {
    return (
      <div className="et-container">
        <div className="no-data-msg" style={{ marginTop: '50px' }}>
          <h3>No Branches Found</h3>
          <p>Please create a branch to manage employee types.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="et-container">
      <div className="et-layout-wrapper">
        <div className="et-main-panel">
          <div className="et-panel-header">
            <div className="header-info">
              <h3>Employee Types</h3>
              <span>Total: {employeeTypes.length}</span>
            </div>

            <div className="header-actions-row">
              <div className="branch-nav-inline">
                <select
                  value={selectedBranch === null ? "ALL" : selectedBranch}
                  onChange={(e) => {
                    const value = e.target.value;
                    changeBranch(value === "ALL" ? null : Number(value));
                  }}
                  className="et-branch-dropdown"
                >
                  {branches.length > 1 && (
                    <option value="ALL">All Branches</option>
                  )}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </div>


              {selectedBranch && canCreate && (
                <div className="add-et-row">
                  <input
                    placeholder="New Employee Type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateEmployeeType()}
                  />
                  <button
                    onClick={handleCreateEmployeeType}
                    disabled={loading}
                    className="btn-add-et"
                  >
                    <FaPlus /> Add Type
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="et-list-scroll">
            {employeeTypes.length === 0 ? (
              <div className="no-data-msg">No employee types found.</div>
            ) : (
              <div className="et-grid-modern">
                {employeeTypes.map((type) => (
                  <div key={type.id} className="et-card-item">
                    {editingId === type.id ? (
                      <div className="et-edit-row">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyPress={(e) => e.key === "Enter" && handleUpdateEmployeeType(type.id)}
                        />
                        <div className="edit-controls">
                          <button onClick={() => handleUpdateEmployeeType(type.id)} className="btn-tick"><FaCheck /></button>
                          <button onClick={() => setEditingId(null)} className="btn-cross"><FaTimes /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="et-info">
                          <span className="t-name">{type.type_name || type.name}</span>
                          <span className={`status-pill ${type.is_active ? "active" : "inactive"}`}>
                            {type.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="et-actions-btns">
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingId(type.id);
                                setEditingName(type.type_name || type.name);
                              }}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-trash"
                              onClick={() => handleDeleteEmployeeType(type.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </>
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

