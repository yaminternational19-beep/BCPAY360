import React, { useEffect, useState } from "react";
import { FaHourglassHalf, FaCalendarCheck, FaHistory, FaClipboardList, FaSearch, FaRedo } from "react-icons/fa";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportLeavesExcel, exportLeavesPDF } from "../../utils/export/exportLeaves";

/* Leave Policy */
import LeavePolicyForm from "./LeavePolicy/LeavePolicyForm";
import LeavePolicyTable from "./LeavePolicy/LeavePolicyTable";

/* Leave Requests */
import PendingLeaveList from "./LeaveRequests/PendingLeaveList";

/* Leave History */
import LeaveHistoryTable from "./LeaveHistory/LeaveHistoryTable";

import "../../styles/LeaveManagement.css";
import { getDepartments } from "../../api/master.api";
import { useBranch } from "../../hooks/useBranch"; // Import Hook
import NoBranchState from "../../components/NoBranchState";

import useLeaveRequests from "./hooks/useLeaveRequests";
import useLeaveMaster from "./hooks/useLeaveMaster";

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [toast, setToast] = useState(null); 
  const [selectedIds, setSelectedIds] = useState([]);

  // Use Branch Hook
  const { branches: branchList, selectedBranch, changeBranch, isSingleBranch, isLoading: branchLoading } = useBranch();
  
  // SHARED LEAVE MASTER STATE (FOR POLICIES)
  const leaveMaster = useLeaveMaster();
  const { addLeaveType } = leaveMaster;

  // Integrated Leave Hook (FOR REQUESTS)
  const {
    requests,
    history,
    loading: leaveLoading,
    error: leaveError,
    approve,
    reject,
    fetchPending,
    fetchHistory,
    pendingMeta,
    historyMeta
  } = useLeaveRequests();

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    status: "ALL",
    page: 1,
    limit: 10
  });

  // Master Data
  const [departmentList, setDepartmentList] = useState([]);
  const [loadingTab, setLoadingTab] = useState(null);

  useEffect(() => {
    const params = {
      search: filters.search,
      departmentId: filters.departmentId,
      branchId: selectedBranch,
      status: filters.status,
      page: filters.page,
      limit: filters.limit
    };

    if (activeTab === "approvals") {
      fetchPending(params);
    } else if (activeTab === "history") {
      fetchHistory(params);
    }
  }, [fetchPending, fetchHistory, selectedBranch, filters, activeTab]);

  useEffect(() => {
    if (selectedBranch) {
      const fetchDepts = async () => {
        try {
          const res = await getDepartments(selectedBranch);
          setDepartmentList(res?.data || res || []);
        } catch (err) {
          // silenced
        }
      };
      fetchDepts();
    } else {
      setDepartmentList([]);
    }
  }, [selectedBranch]);

  // Derived Stats
  const pendingCount = pendingMeta.total;

  const onLeaveTodayCount = history.filter(h => {
    if (h.status !== 'APPROVED') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = new Date(h.from_date);
    from.setHours(0, 0, 0, 0);

    const to = new Date(h.to_date);
    to.setHours(0, 0, 0, 0);

    const branchMatch = !selectedBranch || String(h.branch_id) === String(selectedBranch);
    return branchMatch && today >= from && today <= to;
  }).length;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id) => {
    const res = await approve(id, currentParams);
    if (res?.success) {
      showToast("Leave request approved successfully!");
    } else {
      showToast(res?.message || "Failed to approve leave request", "error");
    }
  };

  const handleReject = async (id, remarks) => {
    const res = await reject(id, remarks, currentParams);
    if (res?.success) {
      showToast("Leave request rejected successfully!");
    } else {
      showToast(res?.message || "Failed to reject leave request", "error");
    }
  };

  const handleReset = () => {
    setFilters({
      search: "",
      departmentId: "",
      status: "ALL",
      page: 1,
      limit: 10
    });
  };

  const switchTab = (tab) => {
    setLoadingTab(tab);
    setTimeout(() => {
      setActiveTab(tab);
      setSelectedIds([]); // Clear selection when switching tabs
      setLoadingTab(null);
    }, 200);
  };

  const getExportData = () => {
    if (selectedIds.length > 0) {
      if (activeTab === "approvals") return requests.filter(req => selectedIds.includes(req.id));
      if (activeTab === "history") return history.filter(req => selectedIds.includes(req.id));
    }
    return activeTab === "approvals" ? requests : history;
  };

  const handleExportExcel = () => {
    exportLeavesExcel(getExportData(), `Leaves_${selectedBranch || "All"}`);
  };

  const handleExportPDF = () => {
    exportLeavesPDF(getExportData(), `Leaves_${selectedBranch || "All"}`);
  };

  // Combine filters with global selectedBranch for children
  const activeFilters = { ...filters, branchId: selectedBranch };

  const currentParams = {
    search: filters.search,
    departmentId: filters.departmentId,
    branchId: selectedBranch,
    status: filters.status,
    page: filters.page,
    limit: filters.limit
  };

  const handlePolicySave = async (payload) => {
    const res = await addLeaveType(payload);
    if (res?.success) {
      showToast("Leave policy added successfully!");
      setShowPolicyForm(false);
      // Re-fetching policies if we are on the policy tab happens inside LeavePolicyTable's own effect
    } else {
      showToast(res?.message || "Failed to add leave policy", "error");
    }
  };

  return (
    <div className="lm-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`lm-toast ${toast.type}`}>
          <div className="toast-content">
            {toast.type === "success" ? "✓" : "✕"} {toast.message}
          </div>
          <div className="toast-progress"></div>
        </div>
      )}

      {/* ================= PAGE HEADER ================= */}
      <div className="lm-page-header">
        <div className="lm-title-section">
          <h1>Leave Management</h1>
          <p>Review attendance data, process leave requests and manage policies.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {(activeTab === "approvals" || activeTab === "history") && (
            <>
              <button
                className="btn-export-new"
                onClick={handleExportExcel}
                title="Export to Excel"
                style={{
                  backgroundColor: '#10b981', borderColor: '#10b981', color: 'white',
                  padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                }}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="btn-export-new"
                onClick={handleExportPDF}
                title="Export to PDF"
                style={{
                  backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white',
                  padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                }}
              >
                <FileText size={16} /> PDF
              </button>
            </>
          )}
          <button className="btn-primary premium" onClick={() => setShowPolicyForm(true)}>
            + Add Leave Policy
          </button>
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="lm-summary-grid">
        <div className="lm-summary-card" onClick={() => switchTab("approvals")}>
          <div className="lm-icon-box pending">
            <FaHourglassHalf />
          </div>
          <div className="lm-summary-info">
            <span className="lm-summary-label">Pending</span>
            <span className="lm-summary-value">{pendingCount}</span>
          </div>
        </div>

        <div className="lm-summary-card">
          <div className="lm-icon-box approved">
            <FaCalendarCheck />
          </div>
          <div className="lm-summary-info">
            <span className="lm-summary-label">On Leave Today</span>
            <span className="lm-summary-value">{onLeaveTodayCount}</span>
          </div>
        </div>

        <div className="lm-summary-card" onClick={() => switchTab("history")}>
          <div className="lm-icon-box history">
            <FaHistory />
          </div>
          <div className="lm-summary-info">
            <span className="lm-summary-label">History</span>
            <span className="lm-summary-value">View All</span>
          </div>
        </div>

        <div className="lm-summary-card" onClick={() => switchTab("policy")}>
          <div className="lm-icon-box policy">
            <FaClipboardList />
          </div>
          <div className="lm-summary-info">
            <span className="lm-summary-label">Policies</span>
            <span className="lm-summary-value">Active</span>
          </div>
        </div>
      </div>

      {/* ================= TAB SWITCH (NOW ABOVE FILTERS) ================= */}
      <div className="lm-switch">
        <div
          className={`lm-tab ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => switchTab("approvals")}
        >
          <FaHourglassHalf /> Approvals
          {pendingCount > 0 && (
            <span className="tab-badge">{pendingCount}</span>
          )}
        </div>

        <div
          className={`lm-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => switchTab("history")}
        >
          <FaHistory /> History
        </div>

        <div
          className={`lm-tab ${activeTab === "policy" ? "active" : ""}`}
          onClick={() => switchTab("policy")}
        >
          <FaClipboardList /> Leave Types / Policies
        </div>
      </div>

      {/* ================= FILTERS BAR (NOW BELOW TABS) ================= */}
      <div className="lm-filters-bar">
        <div className="lm-search-container" style={{ flex: 1, position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="lm-search-input"
            placeholder="Search by employee name or code..."
            style={{ paddingLeft: '40px' }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>

        {/* Hide Branch Selector if Single Branch Mode */}
        {!isSingleBranch && (
          <select
            className="lm-select"
            value={selectedBranch === null ? "ALL" : selectedBranch}
            onChange={(e) => {
              const val = e.target.value;
              changeBranch(val === "ALL" ? null : Number(val));
              setFilters({ ...filters, page: 1 });
            }}
          >
            {branchList.length > 1 && <option value="ALL">All Branches</option>}
            {branchList.map(b => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        )}

        <select
          className="lm-select"
          value={filters.departmentId}
          onChange={(e) => setFilters({ ...filters, departmentId: e.target.value, page: 1 })}
          disabled={!selectedBranch}
        >
          <option value="">{selectedBranch ? "All Departments" : "Select Branch First"}</option>
          {departmentList.map(d => (
            <option key={d.id} value={d.id}>{d.department_name}</option>
          ))}
        </select>

        <select
          className="lm-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <button className="lm-btn-reset" onClick={handleReset} title="Reset Filters">
          <FaRedo /> Reset
        </button>
      </div>

      {/* ================= PANEL ================= */}
      <section style={{ position: 'relative', marginTop: '16px' }}>
        {loadingTab && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <span>Switching View...</span>
          </div>
        )}

        {/* POLICY */}
        <div className={`lm-section ${activeTab === "policy" ? "active" : ""}`}>
          <LeavePolicyTable filters={activeFilters} leaveMaster={leaveMaster} />
        </div>

        {/* APPROVALS */}
        <div className={`lm-section ${activeTab === "approvals" ? "active" : ""}`}>
          <PendingLeaveList
            requests={requests}
            pagination={pendingMeta}
            onPageChange={(page) => setFilters({ ...filters, page })}
            loading={leaveLoading}
            error={leaveError}
            approve={handleApprove}
            reject={handleReject}
            selectedIds={selectedIds}
            onSelectOne={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            onSelectAll={(ids) => setSelectedIds(ids)}
          />
        </div>

        {/* HISTORY */}
        <div className={`lm-section ${activeTab === "history" ? "active" : ""}`}>
          <LeaveHistoryTable
            history={history}
            pagination={historyMeta}
            onPageChange={(page) => setFilters({ ...filters, page })}
            loading={leaveLoading}
            error={leaveError}
            fetchHistory={fetchHistory}
          />
        </div>
      </section>

      {/* ================= MODAL ================= */}
      {showPolicyForm && (
        <LeavePolicyForm 
          onClose={() => setShowPolicyForm(false)} 
          onSave={handlePolicySave}
        />
      )}
    </div>
  );
}
