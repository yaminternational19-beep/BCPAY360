import { useState } from "react";
import { MdOutlineDateRange, MdFilterList, MdRestartAlt } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const AttendanceFilter = ({ onFilter, isDarkTheme }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = startDate || endDate;

  const handleApply = () => {
    onFilter({ startDate, endDate });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    onFilter({ startDate: null, endDate: null });
  };

  const theme = {
    surface: isDarkTheme ? colors.darkDropdown : colors.surface,
    inputBg: isDarkTheme ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9", 
    text: isDarkTheme ? colors.textLight : colors.textMain,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      gap: "16px", 
      flexWrap: "wrap",
      backgroundColor: theme.surface, 
      border: `1px solid ${theme.border}`,
      borderRadius: "12px", 
      padding: "16px 20px", 
      boxShadow: isDarkTheme ? "none" : "0 2px 10px rgba(0, 0, 0, 0.03)", 
      fontFamily: typography.fontFamily
    }}>
      
      {/* LEFT SIDE: Label & Divided Inputs */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", flex: 1 }}>
        
        {/* Main Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.primary }}>
          <div style={{ 
            backgroundColor: isDarkTheme ? "rgba(83, 149, 255, 0.15)" : "#eef2ff", 
            padding: "8px", 
            borderRadius: "8px", 
            display: "flex" 
          }}>
            <MdOutlineDateRange size={20} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", color: theme.text, whiteSpace: "nowrap" }}>
            Filter Dates
          </span>
        </div>

        {/* Divided Date Inputs */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", flex: 1 }}>
          
          {/* Start Date Covered Box */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px", 
            backgroundColor: theme.inputBg, 
            padding: "12px 16px",
            borderRadius: "8px", 
            border: `1px solid ${theme.border}`,
            minWidth: "180px", 
            flex: 1, 
            maxWidth: "260px", 
            transition: "border 0.2s"
          }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: theme.muted }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ ...inputStyle, color: startDate ? theme.text : theme.muted }}
            />
          </div>
          
          {/* End Date Covered Box */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px", 
            backgroundColor: theme.inputBg, 
            padding: "12px 16px",
            borderRadius: "8px", 
            border: `1px solid ${theme.border}`,
            minWidth: "180px",
            flex: 1, 
            maxWidth: "260px"
          }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: theme.muted }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ ...inputStyle, color: endDate ? theme.text : theme.muted }}
            />
          </div>

        </div>
      </div>

      {/* RIGHT SIDE: Buttons Wrapper (Fixed Width for smooth animation) */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "12px", 
        width: "220px", // Is width ki wajah se Apply button stretch aur shrink karega
        justifyContent: "flex-end"
      }}>
        
        {/* Reset Button */}
        {isSelected && (
          <button 
            onClick={handleReset}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 16px", 
              borderRadius: "8px", 
              border: `1px solid ${isHovered ? colors.error : theme.border}`, 
              backgroundColor: isHovered ? (isDarkTheme ? "rgba(239, 68, 68, 0.1)" : "#fef2f2") : "transparent", 
              color: isHovered ? colors.error : theme.text, 
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            title="Clear Filters"
          >
            <MdRestartAlt size={18} /> 
            <span>Reset</span>
          </button>
        )}

        {/* Apply Filter Button */}
        <button 
          onClick={handleApply}
          disabled={!isSelected}
          style={{
            flex: 1, // Magic Property: Ye button bachi hui sari width automatically le lega
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            padding: "10px", // Padding slightly adjusted for flex behavior
            borderRadius: "8px", 
            border: "none", 
            fontSize: "13px", 
            fontWeight: "700", 
            backgroundColor: isSelected ? colors.primary : theme.inputBg,
            color: isSelected ? "#fff" : theme.muted,
            cursor: isSelected ? "pointer" : "not-allowed",
            boxShadow: isSelected ? "0 4px 12px rgba(83, 149, 255, 0.2)" : "none",
            transition: "all 0.3s ease", // Smooth stretching animation
            opacity: isSelected ? 1 : 0.8
          }}
        >
          <MdFilterList size={18} /> Apply
        </button>
      </div>
      
    </div>
  );
};

const inputStyle = {
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: "14px",
  fontWeight: "500",
  fontFamily: "inherit",
  cursor: "pointer",
  colorScheme: "light",
  padding: "0",
  width: "100%", 
};

export default AttendanceFilter;