import React, { useState, useEffect } from "react";
import api from "../../utils/api"; 
import LeaveBalanceCard from "./LeaveBalanceCard";
import ApplyLeaveCard from "./ApplyLeaveCard";
import LeaveHistory from "./LeaveHistory";
import colors from "../../styles/colors";
import { ToastContainer } from "react-toastify";

const Leaves = ({ isDarkTheme }) => {
  const [balanceData, setBalanceData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      // 🔥 Dono API ek sath fetch karein (Faster loading)
      const [typesRes, profileRes, historyRes] = await Promise.all([
        api.get("/leave/types"),
        api.get("/profile"),
        api.get("/leave/history")
      ]);

      const typesData = typesRes.data?.data || [];
      const summaryData = profileRes.data?.employee?.leave_summary || profileRes.data?.leave_summary || [];

      // 🔥 Merge Logic: Backend ke accurate Total, Used, Remaining data ko match karna
      const mergedBalance = typesData.map(type => {
        const summaryItem = summaryData.find(s => 
          s.leave_type?.toLowerCase() === type.leave_name?.toLowerCase()
        );

        return {
          id: type.id,
          leave_name: type.leave_name,
          total: summaryItem ? summaryItem.total : (type.annual_quota || 0),
          used: summaryItem ? summaryItem.used : (type.days_used || 0),
          remaining: summaryItem ? summaryItem.remaining : Math.max(0, (type.annual_quota || 0) - (type.days_used || 0))
        };
      });

      setBalanceData(mergedBalance);
      setHistoryData(historyRes.data?.data || []);
      
    } catch (error) {
      console.error("Leave Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleRefresh = () => {
    // Jab naya leave apply ho toh fresh data fetch karo
    fetchLeaveData();
  };

  const theme = {
    pageBg: isDarkTheme ? colors.darkBg : colors.background,
    transition: colors.smoothTransition,
  };

  return (
    <div style={{ 
      width: "100%", 
      padding: "16px", 
      display: "flex", 
      flexDirection: "column", 
      gap: "16px", 
      boxSizing: "border-box", 
      backgroundColor: theme.pageBg, 
      minHeight: "100vh", 
      transition: theme.transition,
      fontSize: 13
    }}>
      <ToastContainer />
      
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "stretch" }}>
        <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
          <LeaveBalanceCard isDarkTheme={isDarkTheme} data={balanceData} loading={loading} />
        </div>
        <div style={{ flex: "1.5 1 400px", minWidth: "280px" }}>
          <ApplyLeaveCard 
            isDarkTheme={isDarkTheme} 
            leaveTypes={balanceData} 
            onSuccess={handleRefresh} 
          />
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <LeaveHistory isDarkTheme={isDarkTheme} data={historyData} loading={loading} />
      </div>
    </div>
  );
};

export default Leaves;