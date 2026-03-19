import React, { useEffect, useState } from "react";
import "../../../styles/DepartmentDesignation.css";
import { useBranch } from "../../../hooks/useBranch";
import {
    FaEdit,
    FaTrash,
    FaCheck,
    FaTimes,
    FaPlus,
} from "react-icons/fa";
import { useToast } from "../../../context/ToastContext";
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment as apiDeleteDepartment,
    getDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation as apiDeleteDesignation,
    toggleDesignationStatus,
} from "../../../api/master.api";

export default function DepartmentDesignation({ user }) {
    const isAdmin = user?.role === "COMPANY_ADMIN";
    const isHR = user?.role === "HR";

    // PERMISSIONS
    const canCreateDepartment = isAdmin;
    const canEditDepartment = isAdmin;
    const canDeleteDepartment = isAdmin;

    const canCreateDesignation = isAdmin || isHR;
    const canEditDesignation = isAdmin || isHR;
    const canDeleteDesignation = isAdmin || isHR;

    // USE GLOBAL BRANCH CONTEXT
    const {
        branches,
        selectedBranch,
        changeBranch,
        branchStatus,
        isLoading: branchLoading
    } = useBranch();

    // STATE
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [selectedDept, setSelectedDept] = useState(null);

    const [newDept, setNewDept] = useState("");
    const [newDesignation, setNewDesignation] = useState("");
    const [newDesignationCode, setNewDesignationCode] = useState("");

    const [editingDeptId, setEditingDeptId] = useState(null);
    const [editingDeptName, setEditingDeptName] = useState("");

    const [editingDesigId, setEditingDesigId] = useState(null);
    const [editingDesigName, setEditingDesigName] = useState("");
    const [editingDesigCode, setEditingDesigCode] = useState("");

    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // LOADERS
    const loadDepartments = async (branchId) => {
        setDepartments([]);
        setSelectedDept(null);
        setDesignations([]);

        if (!branchId) return;

        try {
            const data = await getDepartments(branchId);
            setDepartments(data || []);
        } catch (error) {
            toast.error("Failed to load departments: " + error.message);
        }
    };

    const loadDesignations = async (dept, branchId) => {
        setSelectedDept(dept);
        setDesignations([]);

        if (!dept || !branchId) return;

        try {
            const data = await getDesignations(branchId, dept.id);
            setDesignations(data || []);
        } catch (error) {
            toast.error("Failed to load designations: " + error.message);
        }
    };

    useEffect(() => {
        loadDepartments(selectedBranch);
    }, [selectedBranch]);

    // DEPARTMENT ACTIONS
    const handleCreateDepartment = async () => {
        if (!canCreateDepartment || !selectedBranch) return;

        if (!newDept.trim()) {
            return toast.error("Please enter the department name then click on the add button");
        }

        setLoading(true);
        try {
            await createDepartment({
                department_name: newDept.trim(),
                branch_id: Number(selectedBranch),
            });
            setNewDept("");
            toast.success("Department added successfully");
            loadDepartments(selectedBranch);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDepartment = async (id) => {
        if (!canEditDepartment || !editingDeptName.trim()) return;

        setLoading(true);
        try {
            await updateDepartment(id, { department_name: editingDeptName });
            setEditingDeptId(null);
            toast.success("Department updated");
            loadDepartments(selectedBranch);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDepartment = async (dept) => {
        if (!canDeleteDepartment) return;
        if (!confirm(`Delete ${dept.department_name}?`)) return;

        try {
            await apiDeleteDepartment(dept.id);
            toast.success("Department removed");
            loadDepartments(selectedBranch);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // DESIGNATION ACTIONS
    const handleCreateDesignation = async () => {
        if (!canCreateDesignation || !selectedDept || !selectedBranch) return;

        if (!newDesignation.trim()) {
            return toast.error("Please enter the designation name then click on the add button");
        }
        if (!newDesignationCode.trim()) {
            return toast.error("Please enter the designation code then click on the add button");
        }

        setLoading(true);
        try {
            await createDesignation({
                designation_name: newDesignation.trim(),
                designation_code: newDesignationCode.trim(),
                department_id: selectedDept.id,
                branch_id: Number(selectedBranch),
            });
            setNewDesignation("");
            setNewDesignationCode("");
            toast.success("Role added successfully");
            loadDesignations(selectedDept, selectedBranch);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDesignation = async (id) => {
        if (!canEditDesignation || !editingDesigName.trim() || !editingDesigCode.trim()) return;

        setLoading(true);
        try {
            await updateDesignation(id, {
                designation_name: editingDesigName,
                designation_code: editingDesigCode,
            });
            setEditingDesigId(null);
            toast.success("Role updated");
            loadDesignations(selectedDept, selectedBranch);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDesignation = async (desig) => {
        if (!canDeleteDesignation) return;
        if (!confirm(`Delete ${desig.designation_name}?`)) return;

        try {
            await apiDeleteDesignation(desig.id);
            toast.success("Role removed");
            loadDesignations(selectedDept, selectedBranch);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleToggleStatus = async (desig) => {
        try {
            await toggleDesignationStatus(desig.id);
            loadDesignations(selectedDept, selectedBranch);
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 1. Handle LOADING state
    if (branchStatus === "LOADING") {
        return <div className="p-4 text-center">Loading...</div>;
    }

    // 2. Handle NO_BRANCH state
    if (branchStatus === "NO_BRANCH") {
        return (
            <div className="dd-container">
                <div className="dd-empty-state" style={{ marginTop: '50px' }}>
                    <div className="empty-box">
                        <h3>No Branches Found</h3>
                        <p>Please create a branch to manage departments.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dd-container">
            <div className="dd-header-main">
                <div className="header-left">
                    <h1>Departments & Designations</h1>
                    <p>Manage organizational hierarchy and roles</p>
                </div>
                <div className="branch-nav">
                    <select
                        value={selectedBranch === null ? "ALL" : selectedBranch}
                        onChange={(e) => {
                            const value = e.target.value;
                            changeBranch(value === "ALL" ? null : Number(value));
                        }}
                        className="branch-dropdown"
                    >
                        {branches.length > 1 && (
                            <option value="ALL">All Branches</option>
                        )}
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.branch_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedBranch ? (
                <div className="dd-empty-state">
                    <div className="empty-box">
                        <FaPlus className="empty-icon" />
                        <h3>All Branches Selected</h3>
                        <p>Please select a specific branch to manage its departments.</p>
                    </div>
                </div>
            ) : (
                <div className="dd-layout-wrapper">
                    {/* MASTER PANEL - DEPARTMENTS */}
                    <div className="dd-master-panel">
                        <div className="detail-header">
                            <div className="header-info">
                                <h3>Departments</h3>
                                <span>Total: {departments.length}</span>
                            </div>
                            <div className="header-actions-row">
                                {canCreateDepartment && (
                                    <div className="add-desig-row">
                                        <input
                                            placeholder="New Dept"
                                            value={newDept}
                                            onChange={(e) => setNewDept(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && handleCreateDepartment()}
                                            className="input-name"
                                            style={{ width: '140px' }}
                                        />
                                        <button
                                            onClick={handleCreateDepartment}
                                            disabled={loading}
                                            className="btn-add-desig"
                                        >
                                            <FaPlus /> Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="panel-list-scroll">
                            {departments.length === 0 ? (
                                <div className="no-data-msg">No departments available</div>
                            ) : (
                                <div className="dept-list-modern">
                                    {departments.map((d) => (
                                        <div
                                            key={d.id}
                                            className={`dept-card-item ${selectedDept?.id === d.id ? "active" : ""}`}
                                            onClick={() => loadDesignations(d, selectedBranch)}
                                        >
                                            {editingDeptId === d.id ? (
                                                <div className="inline-edit-dept">
                                                    <input
                                                        value={editingDeptName}
                                                        onChange={(e) => setEditingDeptName(e.target.value)}
                                                        autoFocus
                                                        onKeyPress={(e) => e.key === "Enter" && handleUpdateDepartment(d.id)}
                                                    />
                                                    <div className="inline-actions">
                                                        <button onClick={() => handleUpdateDepartment(d.id)} className="btn-tick"><FaCheck /></button>
                                                        <button onClick={() => setEditingDeptId(null)} className="btn-cross"><FaTimes /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="dept-info">
                                                        <span className="d-name">{d.department_name}</span>
                                                    </div>
                                                    <div className="dept-actions">
                                                        {canEditDepartment && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingDeptId(d.id);
                                                                    setEditingDeptName(d.department_name);
                                                                }}
                                                                title="Edit"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                        )}
                                                        {canDeleteDepartment && (
                                                            <button
                                                                className="btn-trash"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteDepartment(d);
                                                                }}
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

                    {/* DETAIL PANEL - DESIGNATIONS */}
                    <div className="dd-detail-panel">
                        {!selectedDept ? (
                            <div className="detail-placeholder">
                                <p>Select a department from the left to manage designations.</p>
                            </div>
                        ) : (
                            <div className="detail-content-area">
                                <div className="detail-header">
                                    <div className="header-info">
                                        <h3>{selectedDept.department_name}</h3>
                                        <span>Total Designations: {designations.length}</span>
                                    </div>
                                    {canCreateDesignation && (
                                        <div className="add-desig-row">
                                            <input
                                                placeholder="Designation Name"
                                                value={newDesignation}
                                                onChange={(e) => setNewDesignation(e.target.value)}
                                                className="input-name"
                                            />
                                            <input
                                                placeholder="Code"
                                                value={newDesignationCode}
                                                onChange={(e) => setNewDesignationCode(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && handleCreateDesignation()}
                                                className="input-code"
                                            />
                                            <button
                                                onClick={handleCreateDesignation}
                                                disabled={loading}
                                                className="btn-add-desig"
                                            >
                                                <FaPlus /> Add Role
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="desig-grid-container">
                                    {designations.length === 0 ? (
                                        <div className="no-data-msg">No designations found for this department.</div>
                                    ) : (
                                        <div className="desig-list-modern">
                                            {designations.map((d) => (
                                                <div key={d.id} className={`desig-card-item ${!d.is_active ? "inactive" : ""}`}>
                                                    {editingDesigId === d.id ? (
                                                        <div className="desig-edit-row">
                                                            <input
                                                                value={editingDesigName}
                                                                onChange={(e) => setEditingDesigName(e.target.value)}
                                                                placeholder="Name"
                                                            />
                                                            <input
                                                                value={editingDesigCode}
                                                                onChange={(e) => setEditingDesigCode(e.target.value)}
                                                                placeholder="Code"
                                                                onKeyPress={(e) => e.key === "Enter" && handleUpdateDesignation(d.id)}
                                                            />
                                                            <div className="edit-controls">
                                                                <button onClick={() => handleUpdateDesignation(d.id)} className="btn-save-sm"><FaCheck /></button>
                                                                <button onClick={() => setEditingDesigId(null)} className="btn-cancel-sm"><FaTimes /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="desig-info">
                                                                <span className="d-name">{d.designation_name}</span>
                                                                <span className="d-code">{d.designation_code}</span>
                                                            </div>
                                                            <div className="desig-actions">
                                                                {canEditDesignation && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingDesigId(d.id);
                                                                            setEditingDesigName(d.designation_name);
                                                                            setEditingDesigCode(d.designation_code || "");
                                                                        }}
                                                                        title="Edit"
                                                                    >
                                                                        <FaEdit />
                                                                    </button>
                                                                )}
                                                                {canDeleteDesignation && (
                                                                    <button
                                                                        className="btn-trash"
                                                                        onClick={() => handleDeleteDesignation(d)}
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
