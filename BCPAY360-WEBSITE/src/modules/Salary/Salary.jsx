import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import ExpectedSalaryCard from "./ExpectedSalaryCard";
import SalaryBreakdown from "./SalaryBreakdown";
import SalaryHistory from "./SalaryHistory";
import colors from "../../styles/colors";

const Salary = ({ isDarkTheme }) => {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPayroll = async () => {
    try {
      const response = await api.get("/payroll");
      setPayrollData(response.data || null);
    } catch (error) {
      console.error("Payroll Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const theme = {
    bg: isDarkTheme ? colors.darkBg : colors.background,
  };

  return (
    <div style={{ 
      width: "100%", 
      padding: "16px", // Reduced padding
      backgroundColor: theme.bg, 
      minHeight: "100vh", 
      transition: colors.smoothTransition, 
      boxSizing: "border-box",
      fontSize: 13
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Top Row: Stack on mobile, side-by-side on desktop */}
        <div style={{ 
          display: "flex", 
          gap: "16px", // Reduced gap
          flexWrap: "wrap", 
          marginBottom: "16px", 
          alignItems: "stretch" 
        }}>
          {/* Salary Card */}
          <div style={{ flex: "1 1 340px", minWidth: "300px" }}>
            <ExpectedSalaryCard isDarkTheme={isDarkTheme} data={payrollData} loading={loading} />
          </div>

          {/* Breakdown Chart */}
          <div style={{ flex: "1 1 340px", minWidth: "300px" }}>
            <SalaryBreakdown isDarkTheme={isDarkTheme} data={payrollData} />
          </div>
        </div>

        {/* Bottom Row: History */}
        <div style={{ width: "100%" }}>
          <SalaryHistory isDarkTheme={isDarkTheme} data={payrollData} loading={loading} />
        </div>

      </div>
    </div>
  );
};

export default Salary;