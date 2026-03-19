import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { MdCheckCircle, MdCancel, MdWatchLater, MdHistory } from "react-icons/md";

const AttendanceSummary = ({ isDarkTheme, stats }) => {
  const summaryData = [
    { label: "Present", value: stats?.present_days || 0, color: colors.success, icon: <MdCheckCircle /> },
    { label: "Absent", value: stats?.absent_days || 0, color: colors.error, icon: <MdCancel /> },
    { label: "Half Day", value: stats?.half_days || 0, color: "#f59e0b", icon: <MdHistory /> }, 
    { label: "Late", value: stats?.late_days || 0, color: colors.primary, icon: <MdWatchLater /> },
  ];

  const theme = {
    cardBg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    border: isDarkTheme ? colors.darkBorder : colors.border,
  };

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", // Responsive compact grid
      gap: "12px" 
    }}>
      {summaryData.map((item) => (
        <div 
          key={item.label} 
          style={{ 
            backgroundColor: theme.cardBg, 
            borderColor: theme.border,
            borderRadius: "12px", 
            padding: "16px", // Reduced padding
            position: "relative", 
            overflow: "hidden", 
            border: "1px solid", 
            boxShadow: isDarkTheme ? "none" : "0 4px 10px rgba(0,0,0,0.02)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", backgroundColor: item.color }} />
          
          <div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              {item.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", fontFamily: typography.fontFamily, color: theme.text, lineHeight: 1 }}>
              {item.value} <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: "500" }}>Days</span>
            </div>
          </div>

          <div style={{ 
            width: "36px", height: "36px", // Smaller icon box
            borderRadius: "8px", 
            backgroundColor: `${item.color}15`, 
            color: item.color,
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}>
            {React.cloneElement(item.icon, { size: 18 })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttendanceSummary;