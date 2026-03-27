import React from "react";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { MdEvent, MdAccessTime, MdPublic, MdOutlineEventAvailable } from "react-icons/md";
import { FaCalendarPlus, FaRegCalendarCheck } from "react-icons/fa";

const HolidayStats = ({ isDarkTheme, holidays = [] }) => {
  const theme = {
    bg: isDarkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingHoliday = holidays
    .map(h => ({ ...h, dateObj: new Date(h.date) }))
    .filter(h => h.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)[0];

  const daysRemaining = upcomingHoliday
    ? Math.ceil((upcomingHoliday.dateObj - today) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ 
      display: "flex", 
      gap: "24px", 
      marginBottom: "24px", 
      flexWrap: "wrap", 
      alignItems: "stretch",
      userSelect: "none"
    }}>

      {/* Hero card showing coming event */}
      <div style={{
        flex: "1 1 500px",
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
        borderRadius: "24px",
        padding: "32px",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.45)",
        position: "relative",
        overflow: "hidden",
        minHeight: "180px",
      }}>
        <MdEvent size={200} style={{ position: "absolute", right: -40, bottom: -40, opacity: 0.1 }} />
        
        {upcomingHoliday ? (
          <>
            <div>
              <div style={{ 
                background: "rgba(255,255,255,0.2)", 
                width: "fit-content", 
                padding: "4px 12px", 
                borderRadius: "100px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <MdOutlineEventAvailable size={14} />
                <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
                   UPCOMING HOLIDAY
                </span>
              </div>
              <h2 style={{ 
                fontSize: "32px", 
                fontWeight: "800", 
                margin: "0 0 8px 0", 
                fontFamily: typography.fontFamily,
                letterSpacing: "-1px"
              }}>
                {upcomingHoliday.name}
              </h2>
              <p style={{ fontSize: "16px", fontWeight: "600", opacity: 0.9, margin: 0 }}>
                {upcomingHoliday.day}, {upcomingHoliday.displayDate}
              </p>
            </div>

            <div style={{ 
              marginTop: "20px", 
              fontSize: "13px", 
              fontWeight: "700", 
              opacity: 0.95, 
              display: "flex", 
              alignItems: "center", 
              gap: "8px" 
            }}>
              <MdAccessTime size={18} />
              <span>
                {daysRemaining === 0 ? "TODAY" : `${daysRemaining} days remaining`}
              </span>
            </div>
          </>
        ) : (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center",
            height: "100%",
            textAlign: "center",
            gap: "12px"
          }}>
            <MdEvent size={48} />
            <span style={{ fontSize: "20px", fontWeight: "800" }}>No upcoming holidays found</span>
          </div>
        )}
      </div>

      {/* Stats side-cards (Glassmorphism) */}
      <div style={{ 
        flex: "1 1 300px", 
        display: "flex", 
        flexDirection: "column", 
        gap: "16px" 
      }}>
        
        {/* Total card */}
        <StatCard 
          theme={theme} 
          icon={<MdPublic size={20} color={colors.primary} />} 
          label="Total Holidays" 
          value={holidays.length}
          accent={colors.primary}
        />
        
        {/* Public holidays estimated */}
        <StatCard 
          theme={theme} 
          icon={<FaRegCalendarCheck size={18} color={colors.status.absent.dot} />} 
          label="Confirmed Public" 
          value={holidays.filter(h => h.type.toLowerCase().includes('public')).length}
          accent={colors.status.absent.dot}
        />
      </div>
    </div>
  );
};

const StatCard = ({ theme, icon, label, value, accent }) => (
  <div style={{
    backgroundColor: theme.bg,
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: `1px solid ${theme.border}`,
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
    flex: 1
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "14px",
        background: `${accent}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <span style={{ fontSize: "14px", fontWeight: "700", color: theme.muted }}>
        {label}
      </span>
    </div>
    <span style={{ fontSize: "28px", fontWeight: "800", color: theme.text, letterSpacing: "-1px" }}>
      {value}
    </span>
  </div>
);

export default HolidayStats;