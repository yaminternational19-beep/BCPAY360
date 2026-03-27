import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { FaCalendarAlt, FaStar, FaChevronRight } from "react-icons/fa";

const HolidayTimeline = ({ holidays = [], isDarkTheme }) => {
  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    line: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  const getMonthShort = (dateString = "") => {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.toLocaleString("en-IN", { month: "short" });
    return "Unknown";
  };

  const getDayNum = (dateString = "") => {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d.getDate();
    return "--";
  };

  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = getMonthShort(holiday.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div style={{ position: "relative", paddingLeft: "12px", paddingBottom: "20px" }}>
      {/* Timeline Line */}
      <div style={{ 
        position: "absolute", 
        left: "19px", 
        top: "10px", 
        bottom: "0", 
        width: "2px", 
        backgroundColor: theme.line, 
        zIndex: 0 
      }} />

      {monthOrder.map((month) => {
        const items = groupedHolidays[month];
        if (!items) return null;

        return (
          <div key={month} style={{ marginBottom: "32px", position: "relative", zIndex: 1 }}>
            
            {/* Month Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ 
                  width: "16px", 
                  height: "16px", 
                  borderRadius: "50%", 
                  backgroundColor: colors.primary, 
                  border: `4px solid ${isDarkTheme ? colors.darkBg : colors.background}`, 
                  marginRight: "16px", 
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(37, 99, 235, 0.3)"
              }} />
              <h3 style={{ 
                  fontSize: "13px", 
                  textTransform: "uppercase", 
                  letterSpacing: "1.5px", 
                  color: theme.muted, 
                  margin: 0, 
                  fontWeight: "800",
                  fontFamily: typography.fontFamily 
              }}>
                {month} 2026
              </h3>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "32px" }}>
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
        borderRadius: "16px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateX(6px)";
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 4px 20px -5px ${accent}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateX(0)";
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.01)";
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: accent }} />

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Date Circle */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          width: "48px", 
          height: "48px", 
          backgroundColor: `${accent}15`, 
          borderRadius: "14px", 
          color: accent 
        }}>
          <span style={{ fontSize: "18px", fontWeight: "800", fontFamily: typography.fontFamily, lineHeight: 1 }}>{dayNum}</span>
          <span style={{ fontSize: "9px", fontWeight: "700", opacity: 0.8, textTransform: "uppercase" }}>{holiday.displayDate.split(' ')[1]}</span>
        </div>
        
        {/* Content */}
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: theme.text, fontWeight: "700" }}>{holiday.name}</h4>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
             <span style={{ fontSize: "12px", color: theme.muted, fontWeight: "600" }}>{holiday.day}</span>
             <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: theme.muted, opacity: 0.5 }}></span>
             <span style={{ fontSize: "11px", color: accent, fontWeight: "700", textTransform: "uppercase" }}>{holiday.type}</span>
          </div>
        </div>
      </div>

      {/* Decorative arrow */}
      <FaChevronRight size={12} color={theme.muted} style={{ opacity: 0.3 }} />
    </div>
  );
};

export default HolidayTimeline;