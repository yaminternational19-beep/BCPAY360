import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { MdOutlineTimer, MdLogin, MdLogout } from "react-icons/md";

const AttendanceHistory = ({ data, isDarkTheme }) => {
  const records = Array.isArray(data) ? data : [];

  const buildDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const dateOnly = new Date(dateStr).toISOString().split("T")[0];
    return new Date(`${dateOnly}T${timeStr}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--:--";
    return timeStr.length === 8 ? timeStr : `${timeStr}:00`;
  };

  const getDuration = (date, start, end) => {
    const startDT = buildDateTime(date, start);
    const endDT = buildDateTime(date, end);
    if (!startDT || !endDT) return "00h 00m";
    const diff = endDT - startDT;
    if (diff <= 0) return "00h 00m";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  };

  const getStatusTheme = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("present")) return colors.status.present;
    if (s.includes("late")) return colors.status.late;
    if (s.includes("half")) return colors.status.halfDay;
    if (s.includes("absent")) return colors.status.absent;
    return colors.status.default;
  };

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    // Header specific colors
    headerBg: "#000000",
    headerText: "#ffffff"
  };

  return (
    <div style={{
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      backgroundColor: theme.bg,
      overflow: "hidden"
    }}>
      <div style={{ 
        padding: "12px 16px", 
        borderBottom: `1px solid ${theme.border}`, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.text, fontFamily: typography.fontFamily }}>
          Detailed Logs
        </h4>
        <span style={{ fontSize: "11px", color: colors.textMuted }}>{records.length} Records</span>
      </div>

      {records.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>No attendance records found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ backgroundColor: theme.headerBg }}>
                {["Date", "Check In", "Check Out", "Status", "Duration"].map((h, i) => (
                  <th key={i} style={{
                    padding: "14px 16px", textAlign: "left", fontSize: "10px", 
                    textTransform: "uppercase", color: theme.headerText, fontWeight: "700", 
                    letterSpacing: "0.8px"
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {h === "Check In" ? <><MdLogin size={12} color={theme.headerText}/> Check In</> : 
                       h === "Check Out" ? <><MdLogout size={12} color={theme.headerText}/> Check Out</> : 
                       h === "Duration" ? <><MdOutlineTimer size={12} color={theme.headerText}/> Duration</> : h}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((item, idx) => {
                const statusTheme = getStatusTheme(item.status);
                return (
                  <tr key={idx} style={{ 
                    borderBottom: idx !== records.length - 1 ? `1px solid ${theme.border}` : "none",
                    backgroundColor: idx % 2 === 0 ? "transparent" : (isDarkTheme ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)")
                  }}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.text }}>{formatDate(item.attendance_date)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.text, fontFamily: "monospace" }}>{formatTime(item.check_in_time)}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: theme.text, fontFamily: "monospace" }}>{formatTime(item.check_out_time)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ 
                        display: "inline-flex", alignItems: "center", gap: "5px", 
                        padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700",
                        backgroundColor: statusTheme.bg, color: statusTheme.text 
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusTheme.dot }} />
                        {item.status || "Unknown"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: colors.primary }}>
                      {item.formatted_worked_time || getDuration(item.attendance_date, item.check_in_time, item.check_out_time)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;