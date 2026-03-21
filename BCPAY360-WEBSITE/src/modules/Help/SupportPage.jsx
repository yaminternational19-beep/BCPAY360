import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import api, { BASE_ROOT } from "../../utils/api";
import colors from "../../styles/colors";

import FAQs from "./FAQs"; // Ensure the path is correct based on your folder structure
import HelpCenter from "./HelpCenter"; 
import MyTickets from "./MyTickets";
import StaticContent from "./StaticContent"; 

const SupportPage = ({ isDarkTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL parameters se data nikalna
  const searchParams = new URLSearchParams(location.search);
  const activeTab = {
    type: searchParams.get("tab") || "Help Center",
    slug: searchParams.get("slug")
  };

  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(activeTab.type === "Dynamic Content");

  useEffect(() => {
    // Sirf Dynamic content ke liye API call zaroori hai
    if (activeTab.type === "Dynamic Content") {
      const fetchContent = async () => {
        setLoading(true);
        try {
          const userStr = localStorage.getItem("user");
          const userProfileStr = localStorage.getItem("userProfile"); // Backup
          
          const user = userStr ? JSON.parse(userStr) : {};
          const profile = userProfileStr ? JSON.parse(userProfileStr) : {};
          
          const companyId = user.company_id || profile.company_id || user.id || 1;
          
          if (!companyId) return;

          const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

          const response = await fetch(`${BASE_ROOT}/public/content?company_id=${companyId}`, {
            method: "GET",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${token}` 
            }
          });

          const data = await response.json();
          
          if (data.success) {
            setContentData(data.content_arr || []);
          }
        } catch (error) {
          console.error("Failed to fetch support content:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [activeTab.type, activeTab.slug]);

  const theme = {
    bg: isDarkTheme ? colors.darkBg : colors.background,
    cardBg: isDarkTheme ? colors.darkHover : "#ffffff",
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
  };

  // Content render karne ka logic
  const renderContent = () => {
    switch (activeTab.type) {
      case "FAQs": 
        return <FAQs isDarkTheme={isDarkTheme} />;
      case "Help Center": 
        return <HelpCenter isDarkTheme={isDarkTheme} />;
      case "My Tickets": 
        return <MyTickets isDarkTheme={isDarkTheme} />;
      case "Dynamic Content": 
        return <StaticContent data={contentData} slug={activeTab.slug} loading={loading} isDarkTheme={isDarkTheme} />;
      default:
        return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>Content not found.</div>;
    }
  };

  return (
    <div style={{ padding: "24px 16px", minHeight: "calc(100vh - 70px)", background: theme.bg }}>
      
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header Area: Back Button and Title */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
          <button 
            onClick={() => navigate('/profile')} 
            style={{ 
              display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", 
              background: "transparent", border: `1px solid ${theme.border}`, 
              color: theme.text, padding: "8px 16px", borderRadius: "8px", 
              fontWeight: "600", fontSize: "14px", transition: "0.2s"
            }}
          >
            <MdArrowBack size={18} /> Back
          </button>
          
          <h2 style={{ margin: 0, color: theme.text, fontSize: "20px" }}>
            {activeTab.type !== "Dynamic Content" ? activeTab.type : "Company Information"}
          </h2>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          background: theme.cardBg, 
          borderRadius: "16px", 
          border: `1px solid ${theme.border}`, 
          minHeight: "60vh", 
          padding: "24px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default SupportPage;