import React, { useEffect, useState } from "react";
import HolidayStats from "./HolidayStats";
import HolidayTimeline from "./HolidayTimeline";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import api from "../../utils/api";
import { toast, ToastContainer } from "react-toastify";

const Holiday = ({ isDarkTheme }) => {
  const [holidayData, setHolidayData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidayData();
  }, []);

  const fetchHolidayData = async () => {
    try {
      const res = await api.get("/holidays?year=2026");
      if (!res.data.success) throw new Error("API failed");

      const months = res.data.months;
console.log("Fetched Holidays:", months); // Debug log
      const allHolidays = Object.entries(months).flatMap(([month, holidays]) =>
        holidays.map((h, index) => ({
          id: `${month}-${index}`,
          name: h.name,
          date: new Date(h.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          day: new Date(h.date).toLocaleDateString("en-IN", { weekday: "long" }),
          type: h.type || "Public",
        }))
      );

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
  };

  return (
    <div style={{
      padding: "16px", // Compact Padding
      maxWidth: "1000px",
      margin: "0 auto",
      backgroundColor: theme.bg,
      minHeight: "100vh",
      transition: colors.smoothTransition,
      fontSize: 13, // Global compact font
      boxSizing: "border-box"
    }}>
      <ToastContainer />

      <div style={{ marginBottom: "20px" }}>
        <h1 style={{
          fontSize: "20px", // Reduced from 28px
          fontWeight: "800",
          color: theme.title,
          margin: "0 0 4px 0",
          fontFamily: typography.fontFamily,
        }}>
          Holiday Calendar
        </h1>
        <p style={{ margin: 0, color: theme.muted, fontSize: "13px" }}>
          View upcoming public, gazetted, and optional holidays for 2026.
        </p>
      </div>

      <HolidayStats isDarkTheme={isDarkTheme} holidays={holidayData} />

      <div style={{ marginTop: "20px" }}>
        {loading ? (
          <p style={{ color: theme.muted, fontSize: "12px" }}>Loading holidays...</p>
        ) : holidayData.length === 0 ? (
          <p style={{ color: theme.muted, fontSize: "12px" }}>No holidays available for this year.</p>
        ) : (
          <HolidayTimeline holidays={holidayData} isDarkTheme={isDarkTheme} />
        )}
      </div>
    </div>
  );
};

export default Holiday;