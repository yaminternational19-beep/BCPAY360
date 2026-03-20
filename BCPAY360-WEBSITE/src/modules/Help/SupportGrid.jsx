import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdInfoOutline } from "react-icons/md";
import colors from "../../styles/colors";
import { BASE_ROOT } from "../../utils/api";

const SupportGrid = ({ isDarkTheme, companyId: propCompanyId }) => {
  const navigate = useNavigate();
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : {};
        
        // 🔥 Use prop first, then state
        const companyId = propCompanyId || user.company_id || user.companyId || user.id;

        if (!companyId) return;

        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

        const url = `${BASE_ROOT}/public/content?company_id=${companyId}`;
        console.log("SupportGrid: Fetching from URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        console.log("SupportGrid: API Response Data:", data);
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
  }, [propCompanyId]);

  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    cardBg: isDarkTheme ? colors.darkHover : "#ffffff",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
  };

  // 🔥 Extract Title from HTML/Text Content
  const extractTitle = (htmlContent) => {
    if (!htmlContent) return "Information";
    
    // Check if it's HTML (like <h2>Title</h2>)
    const match = htmlContent.match(/<h[1-6]>(.*?)<\/h[1-6]>/i);
    if (match && match[1]) return match[1];

    // Fallback: Get first line of plain text
    const firstLine = htmlContent.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 50) return firstLine;

    return "Information";
  };

  // 🔥 Get Slug from URL
  const extractSlug = (url) => {
    if (!url) return null;
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('slug');
  };

  // 🔥 Navigate to the new full Support Page instead of opening a modal
  const handleSupportClick = (type, slug = null) => {
    let url = `/support?tab=${encodeURIComponent(type)}`;
    if (slug) {
      url += `&slug=${encodeURIComponent(slug)}`;
    }
    navigate(url);
  };

  const supportBox = (title, desc, color, icon, type, slug = null) => (
    <div key={title} onClick={() => handleSupportClick(type, slug)} 
      style={{ padding: 12, borderRadius: 12, background: theme.cardBg, display: "flex", gap: 10, cursor: "pointer", border: `1px solid ${theme.border}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontWeight: 600, fontSize: "13px", color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 11, color: theme.muted, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</div>
      </div>
    </div>
  );

  // 🔥 Separate dynamic contents (content_type === 1)
  const dynamicPages = contentData.filter(item => item.content_type === 1);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: theme.text }}>Support & Information</div>
      <div style={supportGridStyle}>
        {/* Static Modules */}
        {supportBox("Help Center", "Raise a new request", "#4f46e5", "❓", "Help Center")}
        {supportBox("FAQs", "Frequently asked questions", "#ec4899", "💬", "FAQs")}
        
        {/* 🔥 Dynamic Modules from API */}
        {loading ? (
          <div style={{ fontSize: 12, color: theme.muted, padding: "10px 0" }}>Loading...</div>
        ) : (
          dynamicPages.map((page, index) => {
            const title = extractTitle(page.content);
            const slug = extractSlug(page.content_url);
            const colorList = ["#0ea5e9", "#16a34a", "#f59e0b", "#eab308", "#14b8a6", "#f43f5e"];
            const color = colorList[index % colorList.length];

            return supportBox(title, "Company Information", color, <MdInfoOutline />, "Dynamic Content", slug);
          })
        )}
      </div>
    </div>
  );
};

/* --- STYLES --- */
const supportGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 };

export default SupportGrid;