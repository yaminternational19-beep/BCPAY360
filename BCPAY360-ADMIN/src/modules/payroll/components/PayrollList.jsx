import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPayrollEmployees,
  generatePayrollBatch,
  getDepartments
} from "../../../api/master.api.js";
import PageHeader from "../../../components/ui/PageHeader";
import SummaryCards from "../../../components/ui/SummaryCards";
import FiltersBar from "../../../components/ui/FiltersBar";
import DataTable from "../../../components/ui/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";
import { FaUsers, FaCheckCircle, FaHourglassHalf, FaExclamationCircle, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import "./payroll.css";
import "../../../styles/shared/modern-ui.css";
import "../../../styles/Attendance.css";
import { useBranch } from "../../../hooks/useBranch";

const ITEMS_PER_PAGE = 10;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayrollList = () => {
  const navigate = useNavigate();
  const { branches: branchList, selectedBranch, changeBranch, isSingleBranch } = useBranch();
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();
  const [payMonth, setPayMonth] = useState(currentDate.getMonth() + 1);
  const [payYear, setPayYear] = useState(currentDate.getFullYear());

  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, not_generated: 0 });
  const [employees, setEmployees] = useState([]);
  const [batch, setBatch] = useState(null);
  const [selected, setSelected] = useState([]);
  const [payrollData, setPayrollData] = useState({});

  // Master Data
  const [departmentList, setDepartmentList] = useState([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Auto-fetch when month/year changes ───────────────────────────────────
  const loadEmployees = async (month = payMonth, year = payYear) => {
    setLoading(true);
    setSelected([]);
    try {
      const res = await getPayrollEmployees({ month, year });
      setSummary(res.summary);
      setBatch(res.batch || null);
      const normalized = res.employees || [];
      setEmployees(normalized);
      const initialData = {};
      normalized.forEach(e => {
        initialData[e.employee_id] = {
          incentive: Number(e.incentive || 0),
          bonus: Number(e.bonus || 0),
          other_deductions: Number(e.other_deductions || 0),
          pf_applicable: e.pf_applicable ?? 0
        };
      });
      setPayrollData(initialData);
    } catch (err) {
      alert("Failed to load employees: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments when branch changes
  useEffect(() => {
    if (selectedBranch) {
      (async () => {
        try {
          const depts = await getDepartments(selectedBranch);
          setDepartmentList(depts || []);
        } catch {
          setDepartmentList([]);
        }
      })();
    } else {
      setDepartmentList([]);
    }
    setFilterDepartmentId("");
  }, [selectedBranch]);

  // Auto-fetch on month/year change
  useEffect(() => {
    loadEmployees(payMonth, payYear);
  }, [payMonth, payYear]);

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch =
        e.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = !selectedBranch || String(e.branch_id) === String(selectedBranch);
      const matchesDept = !filterDepartmentId || String(e.department_id) === String(filterDepartmentId);
      return matchesSearch && matchesBranch && matchesDept;
    });
  }, [employees, searchQuery, selectedBranch, filterDepartmentId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBranch, filterDepartmentId, payMonth, payYear]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ─── Clear all filters ────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterDepartmentId("");
    setPayMonth(currentDate.getMonth() + 1);
    setPayYear(currentDate.getFullYear());
    setCurrentPage(1);
  };

  // ─── Summary cards ────────────────────────────────────────────────────────
  const summaryCards = useMemo(() => [
    { label: "Total Employees", value: summary.total, icon: <FaUsers />, color: "blue" },
    { label: "Pending Pay", value: summary.pending, icon: <FaHourglassHalf />, color: "orange" },
    { label: "Not Generated", value: summary.not_generated, icon: <FaExclamationCircle />, color: "orange" },
    { label: "Period", value: `${MONTHS[payMonth - 1]} ${payYear}`, icon: <FaCalendarAlt />, color: "blue" }
  ], [summary, payMonth, payYear]);

  const isLocked = batch && batch.status !== "DRAFT";

  // ─── Selection helpers ────────────────────────────────────────────────────
  const toggleAll = (checked) => {
    if (!checked || isLocked) { setSelected([]); return; }
    setSelected(filteredEmployees.filter(e => e.payment_status !== "SUCCESS").map(e => e.employee_id));
  };

  const toggleOne = (id) => {
    const emp = employees.find(e => e.employee_id === id);
    if (isLocked || emp?.payment_status === "SUCCESS") return;
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const updateEditable = (id, key, value) => {
    setPayrollData(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: key === "pf_applicable" ? value : (Number(value) || 0) }
    }));
  };

  // ─── Generate payroll ─────────────────────────────────────────────────────
  const generatePay = async () => {
    if (!selected.length || isLocked) return;
    const payload = {
      pay_month: payMonth,
      pay_year: payYear,
      employees: employees
        .filter(e => selected.includes(e.employee_id))
        .map(e => {
          const data = payrollData[e.employee_id] || {};
          return {
            employee_id: e.employee_id,
            base_salary: Number(e.base_salary),
            incentive: data.incentive || 0,
            bonus: data.bonus || 0,
            other_deductions: data.other_deductions || 0,
            pf_applicable: data.pf_applicable || 0
          };
        })
    };
    try {
      await generatePayrollBatch(payload);
      navigate(`/payroll/confirm?month=${payMonth}&year=${payYear}`);
    } catch (err) {
      alert("Failed to generate payroll: " + err.message);
    }
  };

  // (Old columns array removed)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container fade-in">
      <PageHeader
        title="Payroll Processing"
        subtitle="Review attendance data, apply incentives/deductions and generate monthly disbursements."
      />

      <SummaryCards cards={summaryCards} />

      {/* ── FILTERS BAR (Month, Year, Branch, Dept, Search, Actions) ── */}
      <FiltersBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by code or name..."
      >
        {/* Month Selector */}
        <select
          value={payMonth}
          onChange={e => setPayMonth(Number(e.target.value))}
          className="filter-select-modern"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>

        {/* Year Selector */}
        <select
          value={payYear}
          onChange={e => setPayYear(Number(e.target.value))}
          className="filter-select-modern"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Branch Selector (hidden if single-branch) */}
        {!isSingleBranch && (
          <select
            value={selectedBranch === null ? "ALL" : selectedBranch}
            onChange={e => {
              const val = e.target.value;
              changeBranch(val === "ALL" ? null : Number(val));
            }}
            className="filter-select-modern"
          >
            {branchList.length > 1 && <option value="ALL">All Branches</option>}
            {branchList.map(b => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        )}

        {/* Department Selector */}
        <select
          value={filterDepartmentId}
          onChange={e => setFilterDepartmentId(e.target.value)}
          className="filter-select-modern"
          disabled={!selectedBranch}
        >
          <option value="">{selectedBranch ? "All Departments" : "Select Branch First"}</option>
          {departmentList.map(d => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </select>

        {/* Clear Filters */}
        <button onClick={handleClearFilters} className="btn-export">
          Clear Filters
        </button>

        {/* Confirm / Send Salary */}
        <button
          className="btn-confirm-salary"
          onClick={() => navigate(`/payroll/confirm?month=${payMonth}&year=${payYear}`)}
        >
          <FaCheckCircle /> Confirm / Send Salary
        </button>
      </FiltersBar>

      {/* ── TABLE ── */}
      {/* ── TABLE ── */}
      <div className="attendance-table-container" style={{ position: 'relative', marginTop: '20px' }}>
        {loading && (
          <div className="drawer-table-overlay" style={{ zIndex: 50 }}>Loading...</div>
        )}

        <div className="history-table-wrapper" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }}>
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="checkbox-cell" style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    onChange={e => toggleAll(e.target.checked)}
                    checked={(() => {
                      const selectable = filteredEmployees.filter(e => e.payment_status !== "SUCCESS");
                      return selectable.length > 0 && selected.length === selectable.length && !isLocked;
                    })()}
                  />
                </th>
                <th className="col-profile text-center">Profile</th>
                <th className="text-center">Emp Code</th>
                <th className="text-center">Name</th>
                <th className="text-center">Dept</th>
                <th className="text-center">UAN</th>
                <th className="text-center">Base Salary</th>
                <th className="text-center">Working</th>
                <th className="text-center">Present</th>
                <th className="text-center">OT (hrs)</th>
                <th className="text-center">Incentive</th>
                <th className="text-center">Bonus</th>
                <th className="text-center">Deductions</th>
                <th className="text-center">PF?</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="15" className="table-empty text-center" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FaMoneyBillWave size={24} color="#94a3b8" />
                      <div>No employees found</div>
                      <small style={{ color: '#94a3b8' }}>Try adjusting your search or filters to find specific records.</small>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((e, index) => {
                  const isSuccess = e.payment_status === "SUCCESS";
                  const isSelected = selected.includes(e.employee_id);
                  return (
                    <tr key={e.employee_id} className={isSelected ? 'row-selected' : ''}>
                      <td className="checkbox-cell text-center">
                        <input
                          type="checkbox"
                          disabled={isLocked || isSuccess}
                          checked={isSelected}
                          onChange={() => toggleOne(e.employee_id)}
                        />
                      </td>
                      <td className="col-profile text-center">
                        <img
                          src={e.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
                          alt={e.full_name}
                          className="attendance-avatar-sm"
                          style={{ margin: '0 auto' }}
                          onError={(err) => {
                            err.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name || 'U')}&background=EFF6FF&color=3B82F6&bold=true`;
                          }}
                        />
                      </td>
                      <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>
                        {e.employee_code}
                      </td>
                      <td className="text-center">{e.full_name}</td>
                      <td className="text-center">{e.department_name}</td>
                      <td className="text-center" style={{ color: '#64748b' }}>{e.uan_number || "-"}</td>
                      <td className="text-center font-semibold">₹{Number(e.base_salary).toLocaleString()}</td>
                      <td className="text-center">{e.working_days}</td>
                      <td className="text-center">{e.present_days}</td>
                      <td className="text-center">{e.ot_hours}</td>
                      <td className="text-center">
                        <input type="number"
                          style={{ width: '80px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}
                          disabled={isLocked || isSuccess}
                          value={payrollData[e.employee_id]?.incentive || 0}
                          onChange={ev => updateEditable(e.employee_id, "incentive", ev.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input type="number"
                          style={{ width: '80px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}
                          disabled={isLocked || isSuccess}
                          value={payrollData[e.employee_id]?.bonus || 0}
                          onChange={ev => updateEditable(e.employee_id, "bonus", ev.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input type="number"
                          style={{ width: '80px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}
                          disabled={isLocked || isSuccess}
                          value={payrollData[e.employee_id]?.other_deductions || 0}
                          onChange={ev => updateEditable(e.employee_id, "other_deductions", ev.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input type="checkbox"
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          disabled={isLocked || isSuccess}
                          checked={payrollData[e.employee_id]?.pf_applicable === 1}
                          onChange={ev => updateEditable(e.employee_id, "pf_applicable", ev.target.checked ? 1 : 0)}
                        />
                      </td>
                      <td className="text-center">
                        <StatusBadge
                          type={isSuccess ? "success" : e.payment_status === "PENDING" ? "warning" : "neutral"}
                          label={e.payment_status || "NOT_GENERATED"}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div className="table-footer" style={{ borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <div className="footer-left">
            Showing {filteredEmployees.length ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredEmployees.length) : 0} – {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} employees
          </div>
          <div className="pagination">
            <button disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage(1)} title="First Page">{"<<"}</button>
            <button disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} title="Previous">{"<"}</button>
            <span className="page-info">{currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage >= (totalPages || 1) || loading} onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))} title="Next">{">"}</button>
            <button disabled={currentPage >= (totalPages || 1) || loading} onClick={() => setCurrentPage(totalPages || 1)} title="Last Page">{">>"}</button>
          </div>
        </div>
      </div>

      {/* ── GENERATE FOOTER ── */}
      {selected.length > 0 && (
        <div className="payroll-footer-action slide-up">
          <div className="footer-info">
            <span><strong>{selected.length}</strong> employees selected for processing</span>
          </div>
          <button
            className="btn-primary btn-large"
            onClick={generatePay}
            disabled={isLocked}
            style={{ width: 'auto', flex: 'none', padding: '10px 24px' }}
          >
            {isLocked ? "Payroll Locked" : "Generate Payroll Batch (Draft)"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PayrollList;