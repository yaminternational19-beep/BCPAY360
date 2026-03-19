import { useEffect, useState, useCallback, useMemo } from "react";
import "../styles/EmployeePanel.css";
import EmployeeListComponent from "../components/EmployeeList";
import EmployeeForm from "../components/EmployeeForm";
import { useToast } from "../../../context/ToastContext";
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployeeById,
  activateEmployeeById,
  deleteEmployeeById,
} from "../../../api/employees.api";

import {
  getDepartments,
  getDesignations,
  getShifts,
  getEmployeeTypes
} from "../../../api/master.api";
import { Search, Download, Filter, RotateCcw, FileSpreadsheet, FileText, ChevronDown, Users, UserCheck, UserX } from "lucide-react";
// ... (imports remain same)
import { useBranch } from "../../../hooks/useBranch"; // Import Hook
import NoBranchState from "../../../components/NoBranchState"; // Import Empty State
import { exportEmployeesExcel, exportEmployeesPDF } from "../../../utils/export/exportEmployees"; // Export Utils


const EmployeeListPage = () => {
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const isCompanyAdmin = user?.role === "COMPANY_ADMIN";

  // Use Branch Hook
  const { branches, selectedBranch, changeBranch, isSingleBranch, canProceed, isLoading: branchLoading } = useBranch();

  // Data State
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set());

  // Filter States
  const [search, setSearch] = useState("");

  // Removed local branchId state - use selectedBranch from context directly

  const [deptId, setDeptId] = useState("");
  const [desigId, setDesigId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("employee_code");

  // Selection State (Restored for production level)
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Master Data Options
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);

  // Form State
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  /* ===================================================================================
     CASCADING LOGIC & RESET
     =================================================================================== */
  // Branch -> Depts, Shifts, Types
  useEffect(() => {
    if (!selectedBranch) {
      setDepartments([]);
      setShifts([]);
      setEmployeeTypes([]);
      setDeptId("");
      setDesigId("");
      setShiftId("");
      setTypeId("");
      return;
    }
    // Explicitly reset children when branch changes
    setDeptId("");
    setDesigId("");
    setShiftId("");
    setTypeId("");

    Promise.all([
      getDepartments(selectedBranch),
      getShifts(selectedBranch),
      getEmployeeTypes(selectedBranch)
    ]).then(([depts, shfts, types]) => {
      setDepartments(Array.isArray(depts) ? depts : []);
      setShifts(Array.isArray(shfts) ? shfts : []);
      setEmployeeTypes(Array.isArray(types) ? types : []);
    }).catch(err => toast.error("Cascade Error: " + err.message));
  }, [selectedBranch]);

  // Dept -> Designations
  useEffect(() => {
    if (!deptId || !selectedBranch) {
      setDesignations([]);
      setDesigId("");
      return;
    }
    // Explicitly reset designation when department changes
    setDesigId("");

    getDesignations(selectedBranch, deptId)
      .then(res => setDesignations(Array.isArray(res) ? res : []))
      .catch(err => toast.error("Designations Error: " + err.message));
  }, [deptId, selectedBranch]);

  /* ===================================================================================
     DATA FETCHING & PAGINATION SYNC
     =================================================================================== */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const params = {
        limit: pageSize,
        offset,
        branch_id: selectedBranch || undefined, // Use global selectedBranch
        department_id: deptId || undefined,
        designation_id: desigId || undefined,
        shift_id: shiftId || undefined,
        employee_type_id: typeId || undefined,
        search: search || undefined,
        status: status || undefined,
        sort_by: sortBy,
      };

      const res = await listEmployees(params);

      if (res && res.rows) {
        setEmployees(res.rows);
        setTotal(res.total || 0);
      } else if (Array.isArray(res)) {
        setEmployees(res);
        setTotal(res.length);
      } else {
        setEmployees([]);
        setTotal(0);
      }
    } catch (err) {
      toast.error("API Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, selectedBranch, deptId, desigId, shiftId, typeId, search, status, sortBy, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mandatory: Reset page AND selection when filters or search change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [selectedBranch, deptId, desigId, shiftId, typeId, search, status, sortBy]);

  // Mandatory: Clear selection when page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);



  /* ===================================================================================
     ACTION HANDLERS
     =================================================================================== */
  const handleClearFilters = () => {
    setSearch("");
    setDeptId("");
    setDesigId("");
    setShiftId("");
    setTypeId("");
    setStatus("");
    setSortBy("employee_code");
    setPage(1);
    setSelectedIds([]);
  };

  const getExportData = () => {
    // If items are selected, export ONLY selected
    if (selectedIds.length > 0) {
      return employees.filter(emp => selectedIds.includes(emp.id));
    }
    // If nothing selected, export ALL (current view)
    return employees;
  };

  const handleExportExcel = () => {
    if (selectedIds.length === 0) return toast.error("Please select employees to export");
    exportEmployeesExcel(getExportData(), `Employees_Branch_${selectedBranch || "All"}`);
  };

  const handleExportPDF = () => {
    if (selectedIds.length === 0) return toast.error("Please select employees to export");
    exportEmployeesPDF(getExportData(), `Employees_Branch_${selectedBranch || "All"}`);
  };

  const handleSave = async (payload) => {
    try {
      if (selected) {
        const id = selected.employee?.id || selected.id;
        await updateEmployeeById(id, payload);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(payload);
        toast.success("Employee created successfully");
      }
      setShowForm(false);
      setSelected(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save employee");
      throw err;
    }
  };

  const handleEdit = async (id) => {
    try {
      const fullEmp = await getEmployeeById(id);
      if (!fullEmp) return;
      setSelected(fullEmp);
      setShowForm(true);
    } catch (err) {
      toast.error("Failed to load details: " + err.message);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm("Activate employee account?")) return;
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      await activateEmployeeById(id);
      toast.success("Employee account activated");
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate employee account?")) return;
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      await deleteEmployeeById(id);
      toast.success("Employee account deactivated");
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete employee permanently? This action is irreversible.")) return;
    setTogglingIds(prev => new Set(prev).add(id));
    try {
      await deleteEmployeeById(id, true);
      toast.success("Employee permanently deleted");
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const stats = useMemo(() => ({
    total: total,
    active: status === "" ? employees.filter(e => String(e.employee_status).toUpperCase() === "ACTIVE").length : (status === "ACTIVE" ? total : 0),
    inactive: status === "" ? employees.filter(e => String(e.employee_status).toUpperCase() !== "ACTIVE").length : (status === "INACTIVE" ? total : 0)
  }), [employees, total, status]);

  if (branchLoading) return <div className="p-4">Loading branch data...</div>;
  if (!canProceed) return <NoBranchState moduleName="Employees" />;

  return (
    <div className="employee-panel">
      {/* HEADER SECTION */}
      <div className="employee-header">
        <div className="header-title-area">
          <h2>Employee Management</h2>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>
            Manage your workforce across all branches and departments
          </p>
        </div>
        <button className="btn-add-employee" onClick={() => { setSelected(null); setShowForm(true); }}>
          + Add New Employee
        </button>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid-premium">
        <div className="stat-card-premium total">
          <div className="stat-icon-wrapper">
            <Users />
          </div>
          <div className="stat-content-premium">
            <span className="stat-label-premium">Total Employees</span>
            <span className="stat-value-premium">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card-premium active">
          <div className="stat-icon-wrapper">
            <UserCheck />
          </div>
          <div className="stat-content-premium">
            <span className="stat-label-premium">Active Workforce</span>
            <span className="stat-value-premium">{stats.active}</span>
          </div>
        </div>

        <div className="stat-card-premium inactive">
          <div className="stat-icon-wrapper">
            <UserX />
          </div>
          <div className="stat-content-premium">
            <span className="stat-label-premium">Inactive / On Hold</span>
            <span className="stat-value-premium">{stats.inactive}</span>
          </div>
        </div>
      </div>

      <div className="employee-body">

        {/* BACKEND-DRIVEN FILTERS */}
        <div className="backend-filters-container">
          <div className="filters-header">
            <Filter size={16} />
            <span>Employee Filters</span>
          </div>

          <div className="filters-grid-new">
            <div className="filter-input-group">
              <Search size={14} className="search-ico" />
              <input
                type="text"
                placeholder="Search Emp Code / Name / Email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {!isSingleBranch && (
              <select
                value={selectedBranch === null ? "ALL" : selectedBranch}
                onChange={e => {
                  const val = e.target.value;
                  changeBranch(val === "ALL" ? null : Number(val));
                }}
              >
                {branches.length > 1 && (
                  <option value="ALL">All Branches</option>
                )}
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            )}

            <select value={deptId} onChange={e => setDeptId(e.target.value)} disabled={!selectedBranch}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
            </select>

            <select value={desigId} onChange={e => setDesigId(e.target.value)} disabled={!deptId}>
              <option value="">All Designations</option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.designation_name}</option>)}
            </select>

            <select value={shiftId} onChange={e => setShiftId(e.target.value)} disabled={!selectedBranch}>
              <option value="">All Shifts</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.shift_name}</option>)}
            </select>

            <select value={typeId} onChange={e => setTypeId(e.target.value)} disabled={!selectedBranch}>
              <option value="">All Employee Types</option>
              {employeeTypes.map(t => <option key={t.id} value={t.id}>{t.employee_type_name}</option>)}
            </select>

            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="employee_code">Sort: Code</option>
              <option value="name">Sort: Name</option>
              <option value="salary">Sort: Salary</option>
            </select>

            <div className="filter-actions-new">
              <button className="btn-reset" onClick={handleClearFilters} title="Reset All Filters">
                <RotateCcw size={14} /> Clear
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-export-new"
                  onClick={handleExportExcel}
                  title="Export to Excel"
                  style={{
                    backgroundColor: '#10b981', // Green for Excel
                    borderColor: '#10b981',
                    color: 'white'
                  }}
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>

                <button
                  className="btn-export-new"
                  onClick={handleExportPDF}
                  title="Export to PDF"
                  style={{
                    backgroundColor: '#ef4444', // Red for PDF
                    borderColor: '#ef4444',
                    color: 'white'
                  }}
                >
                  <FileText size={14} /> PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <EmployeeListComponent
          employees={employees}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          togglingIds={togglingIds}
          loading={loading}
          selectedIds={selectedIds}
          onSelectOne={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onSelectAll={(ids) => setSelectedIds(ids)}
          onEdit={handleEdit}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <EmployeeForm
          initial={selected}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setSelected(null); }}
        />
      )}
    </div>
  );
};

export default EmployeeListPage;
