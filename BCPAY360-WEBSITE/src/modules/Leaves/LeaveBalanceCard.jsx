import React from "react";
import Card from "../../components/common/Card";
import { MdEventAvailable } from "react-icons/md";
import colors from "../../styles/colors";

const LeaveBalanceCard = ({ isDarkTheme, data, loading }) => {
  const theme = {
    cardBg: isDarkTheme ? colors.darkDropdown : colors.surface,
    title: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    accentBg: isDarkTheme ? colors.darkHover : "#f1f5f9",
    trackBg: isDarkTheme ? colors.darkBorder : "#e2e8f0",
  };

  // Map backend merged data
  const leaveTypes = data?.map(item => ({
    label: item.leave_name || "Leave",
    total: item.total || 0,
    used: item.used || 0, 
    remaining: item.remaining || 0,
    color: item.leave_name?.includes("Casual") ? "#3B82F6" : item.leave_name?.includes("Sick") ? "#EF4444" : "#10B981"
  })) || [];

  const totalUsed = leaveTypes.reduce((acc, curr) => acc + curr.used, 0);
  const totalAvailable = leaveTypes.reduce((acc, curr) => acc + curr.remaining, 0);

  return (
    <Card style={{ 
      backgroundColor: theme.cardBg, color: theme.title, height: "100%", position: "relative", 
      overflow: "hidden", border: `1px solid ${theme.border}`, display: "flex", 
      flexDirection: "column", justifyContent: "space-between", padding: "20px", borderRadius: "12px"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: colors.primary }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <p style={{ color: theme.muted, fontSize: 11, fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Overall Available Balance</p>
          <h1 style={{ fontSize: 32, fontWeight: "800", margin: "4px 0", color: theme.title, lineHeight: 1 }}>
            {loading ? "-" : totalAvailable} <span style={{ fontSize: "14px", fontWeight: "600", color: theme.muted }}>Days</span>
          </h1>
          <div style={{ display: "inline-block", marginTop: "6px", padding: "3px 8px", borderRadius: "4px", background: theme.accentBg, fontSize: "10px", fontWeight: "700", color: theme.muted }}>
            YEAR {new Date().getFullYear()}
          </div>
        </div>
        <div style={{ background: `${colors.primary}15`, padding: 8, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MdEventAvailable size={24} color={colors.primary} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "center" }}>
        {leaveTypes.length === 0 && !loading && <p style={{ fontSize: "12px", color: theme.muted }}>No leave types found.</p>}
        {leaveTypes.map((leave, index) => (
          <LeaveProgressRow key={index} data={leave} theme={theme} />
        ))}
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: "20px", paddingTop: "16px", borderTop: `1px dashed ${theme.border}` }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: theme.muted, fontWeight: "700", margin: 0, textTransform: "uppercase" }}>Total Used</p>
          <p style={{ fontWeight: "700", margin: "2px 0 0 0", fontSize: 16, color: colors.status.absent.dot }}>{totalUsed}</p>
        </div>
        <div style={{ width: "1px", background: theme.border }}></div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: theme.muted, fontWeight: "700", margin: 0, textTransform: "uppercase" }}>Total Left</p>
          <p style={{ fontWeight: "700", margin: "2px 0 0 0", fontSize: 16, color: colors.primary }}>{totalAvailable}</p>
        </div>
      </div>
    </Card>
  );
};

const LeaveProgressRow = ({ data, theme }) => {
  const percentage = data.total > 0 ? (data.remaining / data.total) * 100 : 0; 
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "flex-end", flexWrap: "wrap", gap: "4px" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: theme.title }}>{data.label}</span>
        <div style={{ fontSize: "11px", fontWeight: "600", color: theme.muted, display: "flex", gap: "6px", alignItems: "center" }}>
          <span>Total: {data.total}</span><span>|</span>
          <span>Used: <strong style={{ color: "#EF4444" }}>{data.used}</strong></span><span>|</span>
          <span>Left: <strong style={{ color: data.remaining === 0 ? "#EF4444" : data.color }}>{data.remaining}</strong></span>
        </div>
      </div>
      <div style={{ width: "100%", height: "6px", background: theme.trackBg, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: data.color, borderRadius: "10px", transition: "width 0.5s ease-out" }} />
      </div>
    </div>
  );
};

export default LeaveBalanceCard;