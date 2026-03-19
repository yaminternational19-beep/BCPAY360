import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import "../styles/Dashboard.css";
import logo from "../assets/Logo.png";
import {
  FaUsers,
  FaCalendarCheck,
  FaMoneyCheckAlt,
  FaArrowRight,
  FaClipboardList,
  FaUserFriends,
  FaBuilding,
  FaSitemap,
  FaUmbrellaBeach,
  FaFileAlt,
  FaChartPie,
  FaCog
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PERIODS = ["TODAY", "WEEK", "MONTH", "YEAR"];

const Dashboard = () => {
  const [period, setPeriod] = useState("TODAY");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===============================
     LOAD DASHBOARD
  =============================== */
  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await api("/api/dashboard", {
          params: { period },
          signal: controller.signal,
        });

        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.message || "Failed to load dashboard");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [period]);

  /* ===============================
     SAFE DERIVED DATA
  =============================== */
  const branchBreakdown = data?.branch_breakdown ?? [];

  /* ===============================
     CHART DATA
  =============================== */
  const attendanceChart = useMemo(() => {
    if (!branchBreakdown.length) return null;

    return {
      labels: branchBreakdown.map(b => b.branch_name),
      datasets: [
        {
          label: "Active Employees",
          data: branchBreakdown.map(b => b.employees?.active ?? 0),
          backgroundColor: "rgba(99, 102, 241, 0.8)",
          borderRadius: 8,
        },
        {
          label: "Inefficient/Inactive",
          data: branchBreakdown.map(b => b.employees?.inactive ?? 0),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderRadius: 8,
        },
      ],
    };
  }, [branchBreakdown]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 12, weight: "600" } },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  if (loading) return <div className="dash-loading">Updating dashboard overview…</div>;
  if (error) return (
    <div className="dash-error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
    </div>
  );
  if (!data) return null;

  const {
    company,
    logged_in,
    organization_summary,
    overview,
  } = data;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="dashboard">

      {/* HEADER */}
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%"
  }}
>
  {/* LEFT SIDE */}
  <div
    style={{
      display: "flex",
      alignItems: "center"
    }}
  >
    {/* LOGO */}
    <img
      src={logo}
      alt="Company Logo"
      style={{
        width: "52px",
        height: "52px",
        objectFit: "cover",
        borderRadius: "14px",
        background: "#ffffff",
        padding: "6px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        marginRight: "16px"
      }}
    />

    {/* TEXT */}
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 700
        }}
      >
        {company?.name}
      </h2>

      <span
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginTop: "4px"
        }}
      >
        Logged in as <strong>{logged_in?.role}</strong>
      </span>
    </div>
  </div>

  {/* RIGHT SIDE PERIOD TOGGLE */}
  <div
  style={{
    display: "flex",
    background: "#e5e7eb",
    padding: "4px",
    borderRadius: "12px"
  }}
>
  {PERIODS.map((p) => {
    const isActive = period === p;

    return (
      <button
        key={p}
        onClick={() => setPeriod(p)}
        style={{
          padding: "8px 18px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
          transition: "all 0.2s ease",
          background: isActive ? "#2563eb" : "transparent",
          color: isActive ? "#ffffff" : "#374151",
          boxShadow: isActive
            ? "0 4px 10px rgba(37, 99, 235, 0.3)"
            : "none"
        }}
      >
        {p}
      </button>
    );
  })}
</div>
</div>

      {/* KPI ROW */}
      <div className="kpi-row">

        <div className="kpi-card">
          <h4>Total Employees</h4>
          <div className="metric-box">
            <span className="metric-value">
              {overview?.employees?.total ?? 0}
            </span>
          </div>
          <p className="metric-sub">
            Active: {overview?.employees?.active ?? 0} ·
            Inactive: {overview?.employees?.inactive ?? 0}
          </p>
          <Link to="/employees" className="btn-go">
            View Employees <FaArrowRight />
          </Link>
        </div>

        <div className="kpi-card">
          <h4>Attendance</h4>
          <div className="metric-box">
            <span className="metric-value">
              {overview?.attendance?.present ?? 0}
            </span>
          </div>
          <p className="metric-sub">
            Absent: {overview?.attendance?.absent ?? 0} ·
            Unmarked: {overview?.attendance?.unmarked ?? 0}
          </p>
          <Link to="/attendance" className="btn-go">
            Attendance ({overview?.attendance?.present_percentage ?? 0}%) <FaArrowRight />
          </Link>
        </div>

        <div className="kpi-card">
          <h4>Leaves</h4>
          <div className="metric-box">
            <span className="metric-value">
              {overview?.leave?.approval_pending ?? 0}
            </span>
          </div>
          <p className="metric-sub">
            On Leave Today: {overview?.leave?.today ?? 0}
          </p>
          <Link to="/leavemanagement" className="btn-go">
            Pending Approvals <FaArrowRight />
          </Link>
        </div>

        <div className="kpi-card">
          <h4>Salary Payout</h4>
          <div className="metric-box">
            <span className="metric-value">
              {overview?.salary?.total_paid_formatted || "₹ 0"}
            </span>
          </div>
          <p className="metric-sub">
            Paid: {overview?.salary?.employees_paid ?? 0} ·
            Remaining: {overview?.salary?.employees_remaining ?? 0}
          </p>
          <Link to="/payroll" className="btn-go">
            Payroll <FaArrowRight />
          </Link>
        </div>

      </div>

      {/* ORGANIZATION OVERVIEW */}
      <div className="org-overview-row">
        <Link to="/branches" className="org-card">
          <div className="org-icon branch"><FaBuilding /></div>
          <div className="org-info">
            <h4>Total Branches</h4>
            <span className="org-value">{organization_summary?.total_branches ?? 0}</span>
          </div>
        </Link>
        <Link to="/departments" className="org-card">
          <div className="org-icon dept"><FaSitemap /></div>
          <div className="org-info">
            <h4>Departments</h4>
            <span className="org-value">{organization_summary?.total_departments ?? 0}</span>
          </div>
        </Link>
        <Link to="/hr-management" className="org-card hr-card-accent">
          <div className="org-icon hr"><FaUserFriends /></div>
          <div className="org-info">
            <h4>HR Management</h4>
            <span className="org-value">{organization_summary?.total_hrs ?? 0} HRs</span>
          </div>
        </Link>
      </div>

      {/* BRANCH TABLE & CHART ROW */}
      <div className="dashboard-grid-row">
        {/* BRANCH TABLE */}
        <div className="board-card">
          <h3>Branch Breakdown</h3>
          <table className="branch-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {branchBreakdown.map((b) => (
                <tr key={b.branch_id}>
                  <td>{b.branch_name}</td>
                  <td>{b.employees?.total ?? 0} ({b.employees?.active ?? 0} Active)</td>
                  <td>
                    <span className={b.employees?.active > 0 ? "text-success" : "text-danger"}>
                      {b.employees?.active > 0 ? "Operational" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {b.salary?.total_paid_formatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CHART */}
        <div className="analytics-card">
          <div className="chart-header">
            <h3>Workforce Analytics</h3>
            <span>{period}</span>
          </div>
          <div className="chart-container-inner">
            {attendanceChart && (
              <Bar data={attendanceChart} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="dash-quick-access">
        <h3 className="section-title">Quick Access</h3>
        <div className="dash-footer-upgraded">
          <Link to="/employees" className="dash-action-card-mini employees">
            <div className="action-icon-mini"><FaUserFriends /></div>
            <span>Employees</span>
          </Link>
          <Link to="/holidays" className="dash-action-card-mini holidays">
            <div className="action-icon-mini"><FaUmbrellaBeach /></div>
            <span>Holidays</span>
          </Link>
          <Link to="/payroll" className="dash-action-card-mini payroll">
            <div className="action-icon-mini"><FaMoneyCheckAlt /></div>
            <span>Payroll</span>
          </Link>
          <Link to="/reports/employee" className="dash-action-card-mini reports">
            <div className="action-icon-mini"><FaFileAlt /></div>
            <span>Employee Report</span>
          </Link>
          <Link to="/reports/salary" className="dash-action-card-mini salary-reports">
            <div className="action-icon-mini"><FaChartPie /></div>
            <span>Salary Reports</span>
          </Link>
          <Link to="/manage-content" className="dash-action-card-mini settings">
            <div className="action-icon-mini"><FaCog /></div>
            <span>Settings</span>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
