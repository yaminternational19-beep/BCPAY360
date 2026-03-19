import React from "react";
import { MdClose, MdDescription } from "react-icons/md";
import colors from "../../styles/colors"; // Make sure path is correct

const DocumentPreviewModal = ({ url, type, onClose, isDarkTheme }) => {
  if (!url) return null;

  // Check file extension
  const urlWithoutQuery = url.split('?')[0].toLowerCase();
  const isPDF = urlWithoutQuery.endsWith('.pdf');
  const isImage = !isPDF; 

  const formattedType = type ? type.replace(/_/g, " ").toUpperCase() : "DOCUMENT PREVIEW";

  // 🔥 EXACTLY DOCUMENTS.JSX JAISI THEME
  const theme = {
    cardBg: isDarkTheme ? colors.darkDropdown : "#ffffff",
    text: isDarkTheme ? colors.textLight : "#1e293b",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    previewBg: isDarkTheme ? "rgba(0,0,0,0.2)" : "#f8fafc" // Document ke piche ka halka sa background
  };

  return (
    <div 
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }} 
      onClick={onClose}
    >
      
      <div 
        style={{ width: "100%", maxWidth: "900px", height: "85vh", background: theme.cardBg, borderRadius: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} 
        onClick={(e) => e.stopPropagation()} // Modal pe click karne se close nahi hoga
      >
        
        {/* --- HEADER (Like Documents.jsx Card) --- */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Same soft blue box icon used in Documents.jsx */}
            <div style={{ padding: "8px", background: `${colors.primary}15`, borderRadius: "8px", color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdDescription size={20} />
            </div>
            <span style={{ fontWeight: "700", fontSize: "16px", color: theme.text }}>
              {formattedType}
            </span>
          </div>
          
          <MdClose size={24} color={theme.text} style={{ cursor: "pointer", opacity: 0.6, transition: "0.2s" }} onClick={onClose} />
        </div>

        {/* --- BODY --- */}
        <div style={{ flex: 1, background: theme.previewBg, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          
          {isImage && (
            <img src={url} alt={formattedType} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
          )}
          
          {isPDF && (
            <iframe
              src={`${url}#view=FitH`}
              title="PDF Preview"
              style={{ width: "100%", height: "100%", border: `1px solid ${theme.border}`, borderRadius: "8px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default DocumentPreviewModal;