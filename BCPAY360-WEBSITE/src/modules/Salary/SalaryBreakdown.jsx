import React from "react";
import Card from "../../components/common/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const SalaryBreakdown = ({ isDarkTheme, data }) => {
  const historyList = data?.salary_history || [];
  const latestHistory = historyList.length > 0
    ? [...historyList].sort((a, b) => new Date(b.pay_year, b.pay_month - 1) - new Date(a.pay_year, a.pay_month - 1))[0]
    : {};

  const netSalary = Number(latestHistory.net_salary) || 0;
  const allowances = Number(latestHistory.total_incentives) || 0;
  const deductions = Number(latestHistory.total_deductions) || 0;
  const basic = netSalary - allowances + deductions; // Calculated basic

  const chartData = [
    { name: "Basic Pay", value: basic, color: colors.status.present.dot },
    { name: "Allowances", value: allowances, color: colors.primary },
    { name: "Deductions", value: deductions, color: colors.status.absent.dot },
  ].filter(item => item.value > 0);

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    rowBg: isDarkTheme ? colors.darkHover : "#f8fafc",
    divider: isDarkTheme ? colors.darkBorder : "#e5e7eb",
  };

  return (
    <Card style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "16px", 
      background: theme.bg,
      color: theme.text,
      boxShadow: isDarkTheme ? "none" : colors.softShadow,
      border: isDarkTheme ? `1px solid ${colors.darkBorder}` : "1px solid #e5e7eb",
      borderRadius: "12px"
    }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          backgroundColor: `${colors.primary}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: colors.primary
        }}>
          <MdAccountBalanceWallet size={16} />
        </div>
        <h3 style={{ margin: 0, fontSize: "14px", fontFamily: typography.fontFamily, fontWeight: "700" }}>
          Salary Structure
        </h3>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: "160px", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={70}
              paddingAngle={5}
              cornerRadius={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip theme={theme} />} />
          </PieChart>
        </ResponsiveContainer>

        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none"
        }}>
          <span style={{ fontSize: "10px", color: theme.muted, display: "block" }}>Net</span>
          <span style={{ fontSize: "14px", fontWeight: "800", color: theme.text }}>
            AED {netSalary.toLocaleString("en-IN", { notation: "compact" })}
          </span>
        </div>
      </div>

      {/* Breakdown List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <BreakdownRow label="Basic Pay" value={`AED ${basic.toLocaleString("en-IN")}`} icon={<MdTrendingUp />} color={colors.status.present.dot} theme={theme} />
        <BreakdownRow label="Allowances" value={`AED ${allowances.toLocaleString("en-IN")}`} icon={<MdTrendingUp />} color={colors.primary} theme={theme} />
        <BreakdownRow label="Deductions" value={`- AED ${deductions.toLocaleString("en-IN")}`} icon={<MdTrendingDown />} color={colors.status.absent.dot} theme={theme} isNegative />
      </div>

      {/* Net Footer */}
      <div style={{
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: `1px dashed ${theme.divider}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: theme.muted }}>
          Net Salary
        </span>
        <span style={{
          fontSize: "16px",
          fontWeight: "800",
          color: colors.status.present.dot,
          fontFamily: typography.fontFamily
        }}>
          AED {netSalary.toLocaleString("en-IN")}
        </span>
      </div>
    </Card>
  );
};

const BreakdownRow = ({ label, value, color, theme, isNegative }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "8px",
    backgroundColor: theme.rowBg,
    fontSize: "12px"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color }} />
      <span style={{ fontWeight: "600", color: theme.text }}>{label}</span>
    </div>
    <div style={{ fontWeight: "700", color: isNegative ? color : theme.text }}>
      {value}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.divider}`,
        padding: "6px 10px",
        borderRadius: "6px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        fontSize: "11px"
      }}>
        <span style={{ color: data.color, fontWeight: "bold" }}>{data.name}:</span>
        <span style={{ marginLeft: "4px", fontWeight: "600", color: theme.text }}>
          AED {data.value.toLocaleString("en-IN")}
        </span>
      </div>
    );
  }
  return null;
};

export default SalaryBreakdown;