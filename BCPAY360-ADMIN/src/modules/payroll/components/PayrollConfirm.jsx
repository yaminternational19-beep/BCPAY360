import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getPayrollBatch,
  confirmPayrollBatch
} from "../../../api/master.api";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/DataTable";
import { FaArrowLeft, FaSync, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";
import "./payroll.css";
import "../../../styles/shared/modern-ui.css";
import "../../../styles/Attendance.css";

const PayrollConfirm = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [payMonth, setPayMonth] = useState(
    Number(searchParams.get("month")) || new Date().getMonth() + 1
  );
  const payYear = Number(searchParams.get("year")) || new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadBatch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPayrollBatch({
        pay_month: payMonth,
        pay_year: payYear
      });

      setBatch(data.batch);
      setEmployees(data.employees || []);
      setSelected((data.employees || []).map(e => e.employee_id));

    } catch (err) {
      setError("Failed to load payroll batch: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [payMonth, payYear]);

  useEffect(() => {
    setSearchParams({ month: payMonth, year: payYear }, { replace: true });
    loadBatch();
  }, [payMonth, payYear, loadBatch]);

  const toggleAll = (checked) => {
    setSelected(checked ? employees.map(e => e.employee_id) : []);
  };

  const toggleOne = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Pagination derived values
  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = employees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Columns array removed

  const handleConfirm = async () => {
    if (confirming || employees.length === 0) return;

    setConfirming(true);
    setError("");

    try {
      await confirmPayrollBatch({
        payMonth,
        payYear,
        employeeIds: selected,
        action: "CONFIRM"
      });

      alert("Salary processed successfully");
      await loadBatch();

    } catch (err) {
      setError(err.message || "Payroll confirmation failed");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <PageHeader
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate(-1)} className="btn-action view">
              <FaArrowLeft />
            </button>
            <span>Confirm Payroll</span>
          </div>
        }
        subtitle="Send salary for the selected month."
        actions={
          <div className="payroll-selectors">
            <select
              value={payMonth}
              onChange={(e) => setPayMonth(Number(e.target.value))}
              className="filter-select-modern"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <button className="btn-primary" onClick={loadBatch} disabled={loading}>
              <FaSync /> Refresh
            </button>
          </div>
        }
      />

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
                    checked={selected.length === employees.length && employees.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="col-profile text-center">Profile</th>
                <th className="text-center">Emp Code</th>
                <th className="text-center">Name</th>
                <th className="text-center">Bank Name</th>
                <th className="text-center">Account No</th>
                <th className="text-center">IFSC</th>
                <th className="text-center">Base Salary</th>
                <th className="text-center">Incentive</th>
                <th className="text-center">PF Amount</th>
                <th className="text-center">Deductions</th>
                <th className="text-center">Gross</th>
                <th className="text-center">Net Salary</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="14" className="table-empty text-center" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FaMoneyBillWave size={24} color="#94a3b8" />
                      <div>No employees in this batch</div>
                      <small style={{ color: '#94a3b8' }}>Try selecting a different month.</small>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((e, index) => {
                  const isSelected = selected.includes(e.employee_id);
                  return (
                    <tr key={e.employee_id} className={isSelected ? 'row-selected' : ''}>
                      <td className="checkbox-cell text-center">
                        <input
                          type="checkbox"
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
                      <td className="text-center">{e.bank_name || "-"}</td>
                      <td className="text-center" style={{ color: '#64748b' }}>{e.account_number || "-"}</td>
                      <td className="text-center" style={{ color: '#64748b' }}>{e.ifsc_code || "-"}</td>
                      <td className="text-center font-semibold">₹{Number(e.base_salary).toLocaleString()}</td>
                      <td className="text-center">₹{Number(e.incentive).toLocaleString()}</td>
                      <td className="text-center text-red-500">₹{Number(e.pf_amount || 0).toLocaleString()}</td>
                      <td className="text-center text-red-500">₹{Number(e.other_deductions).toLocaleString()}</td>
                      <td className="text-center font-semibold" style={{ color: '#3b82f6' }}>₹{Number(e.gross_salary || 0).toLocaleString()}</td>
                      <td className="text-center font-bold" style={{ color: '#059669', fontSize: '14px' }}>₹{Number(e.net_salary).toLocaleString()}</td>
                      <td className="text-center">
                        <span className={`status-badge ${e.payment_status.toLowerCase()}`}>
                          {e.payment_status}
                        </span>
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
            Showing {employees.length ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, employees.length) : 0} – {Math.min(currentPage * ITEMS_PER_PAGE, employees.length)} of {employees.length} employees
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

      <div className="payroll-footer-action slide-up" style={{ justifyContent: 'flex-end' }}>

        <button
          className="btn-primary btn-large"
          onClick={handleConfirm}
          disabled={confirming || selected.length === 0}
          style={{ width: 'auto', flex: 'none', padding: '10px 24px' }}
        >
          {confirming ? "Processing..." : `Send Salary (${selected.length})`}
        </button>
      </div>
    </div>
  );
};

export default PayrollConfirm;
