import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { MdEvent, MdAccessTime, MdPublic } from "react-icons/md";

const HolidayStats = ({ isDarkTheme, holidays = [] }) => {

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : colors.border,
  };

  const today = new Date();

  const upcomingHoliday = holidays
    .map(h => ({ ...h, dateObj: new Date(h.date) }))
    .filter(h => h.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)[0];

  const daysRemaining = upcomingHoliday
    ? Math.ceil((upcomingHoliday.dateObj - today) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "stretch" }}>

      {/* HERO CARD - Compact */}
      <div style={{
        flex: "2",
        minWidth: "280px",
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
        borderRadius: "12px",
        padding: "20px",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 8px 20px -5px rgba(0,0,0,0.15)",
        position: "relative",
        overflow: "hidden",
        minHeight: "130px" // Reduced height
      }}>
        <MdEvent size={80} style={{ position: "absolute", right: -10, bottom: -20, opacity: 0.15 }} />

        {upcomingHoliday ? (
          <>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "800", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Coming Up Next
              </span>
              <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "4px 0 2px 0", fontFamily: typography.fontFamily }}>
                {upcomingHoliday.name}
              </h2>
              <p style={{ fontSize: "13px", fontWeight: "500", opacity: 0.9, margin: 0 }}>
                {upcomingHoliday.day}, {upcomingHoliday.date}
              </p>
            </div>

            <div style={{ marginTop: "16px", display: "inline-flex", gap: "6px", alignItems: "center", background: "rgba(255,255,255,0.2)", width: "fit-content", padding: "4px 10px", borderRadius: "8px" }}>
              <MdAccessTime size={14} />
              <span style={{ fontSize: "11px", fontWeight: "700" }}>
                {daysRemaining === 0 ? "Today" : `${daysRemaining} Days Remaining`}
              </span>
            </div>
          </>
        ) : (
          <h2 style={{ fontSize: "18px", fontWeight: "700" }}>No Upcoming Holidays</h2>
        )}
      </div>

      {/* TOTAL HOLIDAYS - Compact */}
      <div style={{
        flex: "1",
        display: "flex",
        minWidth: "200px",
        backgroundColor: theme.bg,
        borderRadius: "12px",
        border: `1px solid ${theme.border}`,
        padding: "20px",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden"
      }}>
        <MdPublic size={60} color={colors.primary} style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.05 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: `${colors.primary}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "4px"
          }}>
            <MdPublic size={18} color={colors.primary} />
          </div>
          <span style={{ fontSize: "11px", fontWeight: "700", color: theme.muted, textTransform: "uppercase" }}>
            Total Holidays
          </span>
        </div>

        <span style={{ fontSize: "32px", fontWeight: "800", color: theme.text, fontFamily: typography.fontFamily, lineHeight: 1 }}>
          {holidays.length}
        </span>
      </div>
    </div>
  );
};

export default HolidayStats;