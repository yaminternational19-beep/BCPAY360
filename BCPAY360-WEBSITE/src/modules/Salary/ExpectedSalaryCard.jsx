import React from "react";
import Card from "../../components/common/Card";
import {
  MdAccountBalance,
  MdWorkHistory,
  MdTimer,
  MdWarningAmber,
  MdTrendingUp,
  MdPayments,
  MdCalendarToday
} from "react-icons/md";
import typography from "../../styles/typography";

const ExpectedSalaryCard = ({ data, loading }) => {
  // 🔥 Backend array ko target karna
  const historyList = data?.salary_history || [];

  // Sabse latest month ki salary nikalna
  const latestHistory = historyList.length > 0
    ? [...historyList].sort((a, b) =>
        new Date(b.pay_year, b.pay_month - 1) - new Date(a.pay_year, a.pay_month - 1)
      )[0]
    : {};

  const netPay = Number(latestHistory.net_salary) || 0;
  const deductions = Number(latestHistory.total_deductions) || 0;
  const incentives = Number(latestHistory.total_incentives) || 0;
  
  // Math logic for missing fields
  const basic = netPay - incentives + deductions;
  const gross = basic + incentives;

  const bankName = latestHistory.bank_name || "—";
  const paymentStatus = latestHistory.payment_status || "PENDING";
  const creditedOn = latestHistory.credited_on
    ? new Date(latestHistory.credited_on).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
    : "—";

  const getStatusColor = () => {
    if (paymentStatus === "SUCCESS") return "#22c55e";
    if (paymentStatus === "FAILED") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <Card
      style={{
        height: "100%",
        background: `linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)`,
        color: "#ffffff",
        boxShadow: "0 15px 30px -10px rgba(30, 58, 138, 0.4)",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px", 
        borderRadius: "12px"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.9 }}>
          <div style={{ padding: "5px", background: "rgba(255,255,255,0.15)", borderRadius: "6px" }}>
            <MdAccountBalance size={14} />
          </div>
          <div>
            <span style={{ fontSize: "10px", fontWeight: "600", opacity: 0.7 }}>BANK</span>
            <div style={{ fontSize: "12px", fontWeight: "700" }}>{bankName}</div>
          </div>
        </div>

        <div
          style={{
            padding: "3px 8px",
            borderRadius: "12px",
            background: `${getStatusColor()}25`,
            color: getStatusColor(),
            fontSize: "10px",
            fontWeight: "800",
            border: `1px solid ${getStatusColor()}40`
          }}
        >
          {paymentStatus}
        </div>
      </div>

      {/* Net Salary Main */}
      <div style={{ zIndex: 1, marginBottom: 16 }}>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>
          Net Salary
        </span>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            margin: "2px 0 4px 0",
            fontFamily: typography.fontFamily,
            letterSpacing: "-0.5px"
          }}
        >
          {loading ? "..." : netPay.toLocaleString("en-IN")}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", opacity: 0.7, fontSize: "11px" }}>
          <MdCalendarToday size={12} />
          Credited on {creditedOn}
        </div>
      </div>

      {/* Compact Summary Row */}
      <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "10px 12px", zIndex: 1, marginBottom: 12 }}>
        <DetailItem icon={<MdWorkHistory />} label="Incentives" value={incentives} />
        <DetailItem icon={<MdWarningAmber color="#fbbf24" />} label="Gross" value={gross} />
        <DetailItem icon={<MdTimer />} label="Deductions" value={deductions} />
      </div>

      {/* Bottom Row - Compact */}
      <div style={{ zIndex: 1, background: "rgba(0,0,0,0.25)", borderRadius: "10px", display: "grid", gridTemplateColumns: "1fr 1px 1fr" }}>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <MdTrendingUp size={12} color="#4ade80" />
            <span style={{ fontSize: "10px", opacity: 0.7, fontWeight: "700" }}>BASIC</span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: "700" }}>{basic.toLocaleString("en-IN")}</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", margin: "6px 0" }} />

        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <MdPayments size={12} color="#60a5fa" />
            <span style={{ fontSize: "10px", opacity: 0.7, fontWeight: "700" }}>NET</span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: "700" }}>{netPay.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </Card>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "50px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "3px", opacity: 0.6 }}>
      {React.cloneElement(icon, { size: 10 })}
      <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase" }}>{label}</span>
    </div>
    <span style={{ fontSize: "12px", fontWeight: "700" }}>{value}</span>
  </div>
);

export default ExpectedSalaryCard;