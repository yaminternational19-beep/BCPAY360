import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const HolidayTimeline = ({ holidays = [], isDarkTheme }) => {
  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    line: isDarkTheme ? colors.darkBorder : "#e5e7eb",
  };

  const getMonthShort = (dateString) => {
    const d = new Date(dateString);
    if (!isNaN(d)) return d.toLocaleString("en-IN", { month: "short" });
    return dateString.split(" ")[1] || "Unknown";
  };

  const getDayNum = (dateString) => {
    const d = new Date(dateString);
    if (!isNaN(d)) return d.getDate();
    return dateString.split(" ")[0] || "--";
  };

  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = getMonthShort(holiday.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div style={{ position: "relative", paddingLeft: "8px", paddingBottom: "10px" }}>
      {/* Timeline Line */}
      <div style={{ position: "absolute", left: "15px", top: "10px", bottom: "0", width: "1px", backgroundColor: theme.line, zIndex: 0 }} />

      {monthOrder.map((month) => {
        const items = groupedHolidays[month];
        if (!items) return null;

        return (
          <div key={month} style={{ marginBottom: "24px", position: "relative", zIndex: 1 }}>
            
            {/* Month Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: colors.primary, border: `3px solid ${isDarkTheme ? colors.darkBg : colors.background}`, marginRight: "16px", flexShrink: 0 }} />
              <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: theme.muted, margin: 0, fontWeight: "800" }}>
                {month} 2026
              </h3>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "30px" }}>
              {items.map((h) => (
                <TimelineCard key={h.id} holiday={h} theme={theme} getDayNum={getDayNum} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TimelineCard = ({ holiday, theme, getDayNum }) => {
  const dayNum = getDayNum(holiday.date);

  const getTypeColor = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("public")) return colors.status.absent.dot;
    if (t.includes("gazetted")) return colors.primary;
    if (t.includes("optional")) return colors.status.late.dot;
    return colors.textMuted;
  };

  const accent = getTypeColor(holiday.type);

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: "12px",
        padding: "10px 14px", // Compact Padding
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateX(4px)";
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.borderColor = theme.border;
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", backgroundColor: accent }} />

      <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingLeft: "6px" }}>
        {/* Date Box */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", backgroundColor: `${accent}10`, borderRadius: "8px", color: accent }}>
          <span style={{ fontSize: "16px", fontWeight: "800", fontFamily: typography.fontFamily, lineHeight: 1 }}>{dayNum}</span>
        </div>
        
        {/* Content */}
        <div>
          <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: theme.text, fontWeight: "600" }}>{holiday.name}</h4>
          <span style={{ fontSize: "11px", color: theme.muted, fontWeight: "500" }}>{holiday.day}</span>
        </div>
      </div>

      {/* Type Badge */}
      <span style={{ fontSize: "10px", fontWeight: "700", color: accent, padding: "3px 10px", borderRadius: "10px", backgroundColor: `${accent}10`, border: `1px solid ${accent}20` }}>
        {holiday.type}
      </span>
    </div>
  );
};

export default HolidayTimeline;