import React, { useState } from "react";
import Card from "../../components/common/Card";
import { MdOutlinePostAdd, MdCircle } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const LeaveHistory = ({ isDarkTheme, data, loading }) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const applications = data?.map((item, index) => ({
      id: item.id || index,
      type: item.leave_name || item.type || "Leave",
      date: `${new Date(item.from_date).toLocaleDateString()} - ${new Date(item.to_date).toLocaleDateString()}`
        || new Date(item.date).toLocaleDateString() || "-",
      days: item.total_days || 0,
      status: item.status?.toLowerCase() || "pending",
    })) || [];

  const filteredApps = activeFilter === "all" ? applications : applications.filter((app) => app.status === activeFilter);

  const theme = {
    title: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    inactiveBtn: isDarkTheme ? colors.darkHover : "#f1f5f9",
    border: isDarkTheme ? colors.darkBorder : colors.border,
    text: isDarkTheme ? colors.textLight : colors.textMain,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return colors.status.present.text;
      case "pending": return colors.status.late.text;
      case "rejected": return colors.status.absent.text;
      default: return theme.muted;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "approved": return colors.status.present.bg;
      case "pending": return colors.status.late.bg;
      case "rejected": return colors.status.absent.bg;
      default: return "transparent";
    }
  };

  return (
    <Card style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${theme.border}`, background: isDarkTheme ? colors.darkDropdown : colors.surface }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ margin: 0, color: theme.title, fontFamily: typography.fontFamily, fontWeight: "700", fontSize: "16px" }}>
          Leave History
        </h3>

        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "pending", "approved", "rejected"].map((label) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "11px",
                cursor: "pointer",
                border: "none",
                fontFamily: typography.fontFamily,
                background: activeFilter === label ? colors.primary : theme.inactiveBtn,
                color: activeFilter === label ? "#fff" : theme.muted,
                fontWeight: activeFilter === label ? "700" : "600",
                textTransform: "capitalize",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: theme.muted, fontSize: "12px" }}>Loading history...</div>
      ) : filteredApps.length === 0 ? (
        <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <MdOutlinePostAdd size={40} style={{ color: theme.muted, opacity: 0.5, marginBottom: "10px" }} />
          <p style={{ margin: 0, fontSize: 13, color: theme.muted }}>No {activeFilter !== "all" ? activeFilter : ""} applications found</p>
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead style={{ backgroundColor: "#000" }}>
              <tr>
                {["TYPE", "DATES", "DAYS", "STATUS"].map((h, index) => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 16px", fontSize: "11px", color: "#fff", fontWeight: "700", letterSpacing: "0.8px", borderBottom: "none", borderTopLeftRadius: index === 0 ? "8px" : "0", borderTopRightRadius: index === 3 ? "8px" : "0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "10px 12px", fontSize: "13px", color: theme.text, fontWeight: "600" }}>{app.type}</td>
                  <td style={{ padding: "10px 12px", fontSize: "12px", color: theme.text, whiteSpace: "nowrap" }}>{app.date}</td>
                  <td style={{ padding: "10px 12px", fontSize: "12px", color: theme.text }}>{app.days} Days</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: getStatusBg(app.status), color: getStatusColor(app.status), display: "inline-flex", alignItems: "center", gap: "5px", textTransform: "capitalize" }}>
                      <MdCircle size={6} /> {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default LeaveHistory;