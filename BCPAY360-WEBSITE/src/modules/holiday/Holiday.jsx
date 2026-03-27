import React, { useEffect, useState } from "react";
import HolidayStats from "./HolidayStats";
import HolidayTimeline from "./HolidayTimeline";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import api from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";
import { FaCalendarAlt, FaCalendarCheck } from "react-icons/fa";

const Holiday = ({ isDarkTheme }) => {
  const [holidayData, setHolidayData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidayData();
  }, []);

  const fetchHolidayData = async () => {
    try {
      // Use logical current year
      const year = new Date().getFullYear();
      const res = await api.get(`/holidays?year=${year}`);
      
      if (!res.data.success) throw new Error("API failed");

      const months = res.data.months;
      
      // Map data consistently between frontend and backend
      const allHolidays = Object.entries(months).flatMap(([monthKey, monthHolidays]) =>
        monthHolidays.map((h, index) => ({
          id: `${monthKey}-${index}`,
          name: h.reason_text || "Holiday",
          date: h.date, // YYYY-MM-DD
          type: h.reason_type || "Public",
          day: new Date(h.date).toLocaleDateString("en-IN", { weekday: "long" }),
          displayDate: new Date(h.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })
        }))
      );

      // Sort by date ASC
      allHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));

      setHolidayData(allHolidays);
    } catch (err) {
      console.error("Holiday Fetch Error", err);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDarkTheme ? colors.darkBg : colors.background,
    title: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    surface: isDarkTheme ? colors.darkDropdown : colors.surface,
  };

  return (
    <div style={{
      padding: "24px",
      maxWidth: "1100px",
      margin: "0 auto",
      backgroundColor: theme.bg,
      minHeight: "calc(100vh - 80px)",
      transition: "background-color 0.3s ease",
      fontFamily: typography.fontFamily,
      display: "flex",
      flexDirection: "column",
      gap: "24px"
    }}>
      <ToastContainer hideProgressBar autoClose={2000} />

      {/* Header Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        paddingBottom: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "10px", 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
            }}>
              <FaCalendarAlt size={18} />
            </div>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "800",
              color: theme.title,
              margin: 0,
              letterSpacing: "-0.5px"
            }}>
              Holiday Calendar
            </h1>
          </div>
          <p style={{ margin: 0, color: theme.muted, fontSize: "14px", fontWeight: "500" }}>
            Viewing list of public and gazetted holidays for {new Date().getFullYear()}.
          </p>
        </div>
      </div>

      <HolidayStats isDarkTheme={isDarkTheme} holidays={holidayData} />

      <div style={{ 
        backgroundColor: theme.surface,
        borderRadius: "20px",
        padding: "24px",
        border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        boxShadow: isDarkTheme ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <FaCalendarCheck color={colors.primary} />
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: theme.title, margin: 0 }}>Timeline</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: theme.muted }}>
             <p style={{ fontSize: "14px" }}>Loading upcoming events...</p>
          </div>
        ) : holidayData.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            background: isDarkTheme ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            borderRadius: "16px",
            border: `1px dashed ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
            <FaCalendarAlt size={40} color={theme.muted} style={{ opacity: 0.3, marginBottom: "16px" }} />
            <p style={{ color: theme.muted, fontSize: "15px", fontWeight: "500" }}>No holidays announced yet for this year.</p>
          </div>
        ) : (
          <HolidayTimeline holidays={holidayData} isDarkTheme={isDarkTheme} />
        )}
      </div>
    </div>
  );
};

export default Holiday;