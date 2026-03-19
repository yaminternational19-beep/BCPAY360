import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";
import AttendanceSummary from "./AttendanceSummary";
import AttendanceFilter from "./AttendanceFilter";
import AttendanceHistory from "./AttendanceHistory";
import typography from "../../styles/typography";
import colors from "../../styles/colors";

const AttendancePage = ({ isDarkTheme }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    half_days: 0
  });

  const getMonthRange = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const fetchAttendance = async (startDate, endDate) => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/my?from=${startDate}&to=${endDate}`);
      const apiData = response.data.data||0;

      const records = Array.isArray(apiData.list) && Array.isArray(apiData.list[0]?.records)
        ? apiData.list[0].records
        : [];

      setAttendanceData(records);
      setStats(apiData.total_days_summary || {
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        half_days: 0
      });
    } catch (error) {
      console.error("Attendance Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log(attendanceData,"Attendace")

  useEffect(() => {
    const { firstDay, lastDay } = getMonthRange();
    fetchAttendance(firstDay, lastDay);
  }, []);

  const handleFilter = ({ startDate, endDate }) => {
    if (!startDate && !endDate) {
      const { firstDay, lastDay } = getMonthRange();
      fetchAttendance(firstDay, lastDay);
      return;
    }
    if (!startDate || !endDate) {
      toast.warning("Select both dates");
      return;
    }
    fetchAttendance(startDate, endDate);
  };

  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "16px", // Compact Padding
      display: "flex",
      flexDirection: "column",
      gap: "16px", // Compact Gap
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      {/* Page Header */}
      <div>
        <h2 style={{
          fontSize: "20px", // Reduced size
          fontWeight: "800",
          color: isDarkTheme ? colors.textLight : colors.textMain,
          fontFamily: typography.fontFamily,
          margin: "0 0 4px 0"
        }}>
          Attendance Tracker
        </h2>
        <p style={{ fontSize: "13px", color: colors.textMuted, margin: 0 }}>
          Monitor your daily logs and work hours.
        </p>
      </div>

      {/* Stats Cards */}
      <AttendanceSummary isDarkTheme={isDarkTheme} stats={stats} />

      {/* Filter Bar */}
      <div style={{ width: "100%" }}>
        <AttendanceFilter onFilter={handleFilter} isDarkTheme={isDarkTheme} />
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>Loading records...</div>
      ) : (
        <AttendanceHistory data={attendanceData} isDarkTheme={isDarkTheme} />
      )}
    </div>
  );
};

export default AttendancePage;