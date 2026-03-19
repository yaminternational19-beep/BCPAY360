import { useState, useEffect } from "react";
import { Search, Filter, ArrowLeft } from "lucide-react";
import "../../../styles/Attendance.css";
import "../styles/AttendanceFilters.css"; /* LOAD NEW SEPARATE CSS */
import ExportActions from "./ExportActions";
import MonthlyAttendanceForm from "./MonthlyAttendanceForm";
import { getDepartments, getShifts } from "../../../api/master.api";
import { useBranch } from "../../../hooks/useBranch";

const AttendanceHeader = ({
  viewType,          // DAILY | HISTORY
  attendanceMode,    // DAILY | MONTHLY
  onModeChange,

  /* DAILY */
  date,
  onDateChange,

  /* MONTHLY */
  monthRange,
  onMonthChange,

  /* EXPORT */
  onExport,

  /* COMMON */
  onBack,

  /* FILTERS */
  filters,
  onFilterChange,
  isSelectionEmpty = true
}) => {
  const { branches: branchList, selectedBranch, changeBranch, isSingleBranch } = useBranch();
  const [departmentList, setDepartmentList] = useState([]);
  const [shiftList, setShiftList] = useState([]);

  useEffect(() => {
    if (selectedBranch) {
      const fetchData = async () => {
        try {
          const [deptRes, shiftRes] = await Promise.all([
            getDepartments(selectedBranch),
            getShifts(selectedBranch)
          ]);
          setDepartmentList(deptRes?.data || deptRes || []);
          setShiftList(shiftRes?.data || shiftRes || []);
        } catch (error) { /* silenced */ }
      };
      fetchData();
    }
  }, [selectedBranch]);

  const handleReset = () => {
    onFilterChange({
      search: "",
      departmentId: "",
      shiftId: "",
      status: ""
    });
  };

  return (
    <div className="attendance-filters-container">
      {/* 1. FILTER TITLE SECTION (MATCHES EMPLOYEE MODULE) */}
      <div className="filters-title-area">
        <Filter size={16} />
        <span>Attendance Filters</span>
      </div>

      {/* 2. FILTERS GRID (HORIZONTAL SCROLL) */}
      <div className="attendance-filters-grid">
        {/* BACK / HISTORY LOGIC */}
        {viewType === "HISTORY" && (
          <button className="btn-back-inline" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        )}

        {/* DAILY VIEW FILTERS */}
        {viewType === "DAILY" && attendanceMode === "DAILY" && (
          <>
            <div className="filter-item-wrapper search">
              <Search size={14} className="search-ico-fixed" />
              <input
                type="text"
                className="attendance-filter-input with-icon"
                placeholder="Search name / code"
                value={filters.search}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="filter-item-wrapper">
              <input
                type="date"
                className="attendance-filter-input"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
            </div>

            {!isSingleBranch && (
              <div className="filter-item-wrapper">
                <select
                  className="attendance-filter-select"
                  value={selectedBranch === null ? "ALL" : selectedBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    changeBranch(val === "ALL" ? null : Number(val));
                  }}
                >
                  {branchList.length > 1 && <option value="ALL">All Branches</option>}
                  {branchList.map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            )}

            <div className="filter-item-wrapper">
              <select
                className="attendance-filter-select"
                value={filters.departmentId}
                onChange={(e) => onFilterChange({ ...filters, departmentId: e.target.value })}
                disabled={!selectedBranch}
              >
                <option value="">{selectedBranch ? "All Departments" : "Select Branch First"}</option>
                {departmentList.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>

            <div className="filter-item-wrapper">
              <select
                className="attendance-filter-select"
                value={filters.shiftId}
                onChange={(e) => onFilterChange({ ...filters, shiftId: e.target.value })}
                disabled={!selectedBranch}
              >
                <option value="">{selectedBranch ? "All Shifts" : "Select Branch First"}</option>
                {shiftList.map((s) => <option key={s.id} value={s.id}>{s.shift_name}</option>)}
              </select>
            </div>

            <div className="filter-item-wrapper">
              <select
                className="attendance-filter-select"
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="UNMARKED">Unmarked</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <button className="btn-reset" onClick={handleReset} style={{ minHeight: '40px', borderRadius: '12px' }}>
              Reset
            </button>

            <div className="attendance-view-toggle">
              <button
                className={`toggle-button ${attendanceMode === "DAILY" ? "active" : ""}`}
                onClick={() => onModeChange("DAILY")}
              >
                Daily
              </button>
              <button
                className={`toggle-button ${attendanceMode === "MONTHLY" ? "active" : ""}`}
                onClick={() => onModeChange("MONTHLY")}
              >
                Monthly
              </button>
            </div>

            <div className="header-divider" />
            <ExportActions context="DAILY" onExport={onExport} isSelectionEmpty={isSelectionEmpty} />
          </>
        )}

        {/* MONTHLY VIEW FILTERS */}
        {viewType === "DAILY" && attendanceMode === "MONTHLY" && (
          <>
            <div className="filter-item-wrapper search">
              <Search size={14} className="search-ico-fixed" />
              <input
                type="text"
                className="attendance-filter-input with-icon"
                placeholder="Search name / code"
                value={filters.search}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              />
            </div>

            <MonthlyAttendanceForm value={monthRange} onChange={onMonthChange} />

            {!isSingleBranch && (
              <div className="filter-item-wrapper">
                <select
                  className="attendance-filter-select"
                  value={selectedBranch === null ? "ALL" : selectedBranch}
                  onChange={(e) => {
                    const val = e.target.value;
                    changeBranch(val === "ALL" ? null : Number(val));
                  }}
                >
                  {branchList.length > 1 && <option value="ALL">All Branches</option>}
                  {branchList.map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            )}

            <div className="filter-item-wrapper">
              <select
                className="attendance-filter-select"
                value={filters.departmentId}
                onChange={(e) => onFilterChange({ ...filters, departmentId: e.target.value })}
                disabled={!selectedBranch}
              >
                <option value="">{selectedBranch ? "All Departments" : "Select Branch First"}</option>
                {departmentList.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>

            <div className="filter-item-wrapper">
              <select
                className="attendance-filter-select"
                value={filters.shiftId}
                onChange={(e) => onFilterChange({ ...filters, shiftId: e.target.value })}
                disabled={!selectedBranch}
              >
                <option value="">{selectedBranch ? "All Shifts" : "Select Branch First"}</option>
                {shiftList.map((s) => <option key={s.id} value={s.id}>{s.shift_name}</option>)}
              </select>
            </div>

            <button className="btn-reset" onClick={handleReset} style={{ minHeight: '40px', borderRadius: '12px' }}>
              Reset
            </button>

            <div className="attendance-view-toggle">
              <button
                className={`toggle-button ${attendanceMode === "DAILY" ? "active" : ""}`}
                onClick={() => onModeChange("DAILY")}
              >
                Daily
              </button>
              <button
                className={`toggle-button ${attendanceMode === "MONTHLY" ? "active" : ""}`}
                onClick={() => onModeChange("MONTHLY")}
              >
                Monthly
              </button>
            </div>

            <div className="header-divider" />
            <ExportActions context="MONTHLY" onExport={onExport} isSelectionEmpty={isSelectionEmpty} />
          </>
        )}

        {/* HISTORY VIEW FILTERS (DURING BACK) */}
        {viewType === "HISTORY" && (
          <div style={{ marginLeft: 'auto' }}>
            <ExportActions context="HISTORY" onExport={onExport} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHeader;
