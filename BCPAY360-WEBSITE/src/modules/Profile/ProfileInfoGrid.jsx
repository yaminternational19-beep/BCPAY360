import React, { useState, useEffect } from "react"; // Added useState and useEffect for screen resize checking
import colors from "../../styles/colors";

const ProfileInfoGrid = ({
  title,
  items,
  isEditing,
  onUpdate,
  isDarkTheme,
  isLocked
}) => {
  // Add screen width detection so it looks good on mobile too
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const theme = {
    text: isDarkTheme ? "#f1f5f9" : "#1e293b",
    muted: isDarkTheme ? "#94a3b8" : "#64748b",
    border: isDarkTheme ? "#334155" : "#e2e8f0",
    cardBg: isDarkTheme ? "#0f172a" : "#ffffff",
    itemBg: isDarkTheme ? "#1e293b" : "#f8fafc",
    inputBg: isDarkTheme ? "#0f172a" : "#ffffff",
  };

  return (
    <div
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        padding: "20px", 
        borderRadius: "16px",
        marginTop: "16px",
        boxShadow: isDarkTheme ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.03)", 
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", gap: "8px" }}>
        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: theme.text, letterSpacing: "0.2px" }}>
          {title}
        </h2>
        {isLocked && (
          <span style={{ fontSize: "10px", fontWeight: "600", color: colors.status?.absent?.dot || "#ef4444", backgroundColor: isDarkTheme ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
            LOCKED
          </span>
        )}
      </div>

      <div 
        style={{ 
          display: "grid", 
          // 🔥 YAHAN CHANGE KIYA HAI: Fixed 2 columns on desktop, 1 on mobile
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
          gap: "16px", 
          width: "100%" 
        }}
      >
        {items.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderRadius: "12px", background: theme.itemBg, border: `1px solid ${theme.border}`, minHeight: "60px", width: "100%", boxSizing: "border-box", transition: "all 0.2s ease" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: isDarkTheme ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)", color: colors.primary || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: "10px", color: theme.muted, marginBottom: "4px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {item.label}
              </div>
              {isEditing && !isLocked ? (
                <input
                  style={{ width: "100%", border: `1px solid ${theme.border}`, background: theme.inputBg, borderRadius: "6px", padding: "6px 8px", outline: "none", color: theme.text, fontWeight: "600", fontSize: "13px", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  value={item.value}
                  onChange={(e) => onUpdate(item.key, e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = colors.primary || "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
              ) : (
                <div style={{ fontWeight: "600", fontSize: "14px", color: theme.text, wordBreak: "break-word", whiteSpace: "normal", lineHeight: "1.4" }}>
                  {item.value || "—"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileInfoGrid;