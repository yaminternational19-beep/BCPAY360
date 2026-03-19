import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../../utils/api";

import TodaysAttendance from "./TodaysAttendance";
import PerformanceChart from "./PerformanceChart";
import AttendanceOverview from "./AttendanceOverview";
import RecentActivities from "./RecentActivities";
import colors from "../../styles/colors";

const Dashboard = ({ isDarkTheme }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(`/home`);
      const dashboardObj = response.data?.data?.[0] || {};
      setDashboardData(dashboardObj);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };
// console.log(dashboardData);

 useEffect(() => {
  fetchDashboardData();

  const shouldShowToast = sessionStorage.getItem("showWelcomeToast");

  if (shouldShowToast === "true") {
    toast.success("Welcome to Dashboard", {
      toastId: "welcome-dashboard",
    });

    sessionStorage.removeItem("showWelcomeToast");
  }
}, []);


  const refreshData = () => {
    fetchDashboardData();
  };

  const performanceArray = useMemo(() => {
    if (!dashboardData?.performance) return [];

    return Object.entries(dashboardData.performance)
      .filter(([_, value]) => value !== null)
      .map(([day, value]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        overtime: value.total_overtime_minutes,
        hours: value.total_hours || 0,
        date: value.date,
      }));
  }, [dashboardData]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: isDarkTheme ? colors.darkBg : colors.background,
        transition: colors.smoothTransition,
        fontSize: 13,
        boxSizing: "border-box",
      }}
    >
      <TodaysAttendance
        isDarkTheme={isDarkTheme}
        data={dashboardData?.today}
        onAttendanceUpdate={refreshData}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        <PerformanceChart isDarkTheme={isDarkTheme} data={performanceArray} />
        <AttendanceOverview
          isDarkTheme={isDarkTheme}
          data={dashboardData?.attendanceOverview}
        />
      </div>

      <div style={{ marginTop: "16px" }}>
        <RecentActivities
          isDarkTheme={isDarkTheme}
          data={dashboardData?.recentActivities}
        />
      </div>
    </div>
  );
};

export default Dashboard;
