import React, { useState } from "react";
import Card from "../../components/common/Card";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { MdCategory, MdDateRange, MdDescription, MdSend } from "react-icons/md";
import api from "../../utils/api";
import { toast } from "react-toastify";

const ApplyLeaveCard = ({ isDarkTheme, leaveTypes, onSuccess }) => {
  const [formData, setFormData] = useState({
    leave_master_id: "",
    from_date: "",
    to_date: "",
    total_days: 0,
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const calculateTotalDays = (from, to) => {
    if (!from || !to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    if (end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "from_date" && prev.to_date && prev.to_date < value) updated.to_date = "";
      if (name === "from_date" || name === "to_date") {
        const from = name === "from_date" ? value : prev.from_date;
        const to = name === "to_date" ? value : prev.to_date;
        updated.total_days = calculateTotalDays(from, to);
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.leave_master_id) return toast.warning("Select leave type");
    if (!formData.from_date || !formData.to_date) return toast.warning("Select dates");
    if (!formData.total_days || formData.total_days <= 0) return toast.warning("Invalid duration");
    if (!formData.reason) return toast.warning("Enter reason");

    const selectedLeave = leaveTypes?.find((type) => String(type.id) === String(formData.leave_master_id));

    setLoading(true);
    try {
      if (selectedLeave) {
        const availableBalance = selectedLeave.remaining || 0;
        if (formData.total_days > availableBalance) {
          toast.info(`Note: Balance exceeded. Extra days will be marked as Unpaid Leave (Loss of Pay).`);
        }
      }

      await api.post("/leave/apply", formData);
      toast.success("Leave Applied Successfully!");
      
      setFormData({ leave_master_id: "", from_date: "", to_date: "", total_days: 0, reason: "" });
      if (onSuccess) onSuccess(); 
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : "#ffffff",
    inputBg: isDarkTheme ? colors.darkHover : "#f8fafc",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    text: isDarkTheme ? colors.textLight : "#0f172a",
    label: isDarkTheme ? colors.darkMuted : "#64748b",
  };

  return (
    <Card style={{ 
      padding: "20px", 
      borderRadius: "12px", 
      background: theme.bg, 
      border: `1px solid ${theme.border}`, 
      height: "100%", 
      display: "flex", 
      flexDirection: "column", 
      width: "100%", 
      boxSizing: "border-box",
      overflow: "hidden" // Prevents child elements from spilling out
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ fontFamily: typography.fontFamily, fontWeight: "700", fontSize: "16px", margin: 0, color: theme.text }}>
          Apply for Leave
        </h3>
        {formData.total_days > 0 && (
          <span style={{ fontSize: "12px", fontWeight: "700", color: colors.primary, background: `${colors.primary}15`, padding: "4px 10px", borderRadius: "12px" }}>
            {formData.total_days} {formData.total_days === 1 ? 'Day' : 'Days'}
          </span>
        )}
      </div>

      {/* Form Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
        
        {/* Leave Type Select */}
        <InputGroup label="Leave Type" icon={<MdCategory size={16} />} theme={theme}>
          <select 
            name="leave_master_id" 
            value={formData.leave_master_id} 
            onChange={handleChange} 
            style={inputStyle(theme)}
          >
            <option value="">Select Type</option>
            {leaveTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.leave_name} (Left: {type.remaining})
              </option>
            ))}
          </select>
        </InputGroup>

        {/* Date Row (Responsive Flex Wrap) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ flex: "1 1 120px", minWidth: 0 }}>
            <InputGroup label="From Date" icon={<MdDateRange size={16} />} theme={theme}>
              <input 
                type="date" 
                name="from_date" 
                min={today} 
                value={formData.from_date} 
                onChange={handleChange} 
                style={inputStyle(theme)} 
              />
            </InputGroup>
          </div>
          <div style={{ flex: "1 1 120px", minWidth: 0 }}>
            <InputGroup label="To Date" icon={<MdDateRange size={16} />} theme={theme}>
              <input 
                type="date" 
                name="to_date" 
                min={formData.from_date || today} 
                value={formData.to_date} 
                onChange={handleChange} 
                style={inputStyle(theme)} 
              />
            </InputGroup>
          </div>
        </div>

        {/* Reason Textarea */}
        <InputGroup label="Reason" icon={<MdDescription size={16} />} theme={theme} alignStart>
          <textarea 
            name="reason" 
            rows="3" 
            value={formData.reason} 
            onChange={handleChange} 
            placeholder="Please provide a brief reason..." 
            style={{ ...inputStyle(theme), resize: "none", padding: "4px 0" }} 
          />
        </InputGroup>
      </div>

      {/* Submit Button */}
      <button 
        onClick={handleSubmit} 
        disabled={loading} 
        style={{ 
          marginTop: "16px", 
          width: "100%", 
          padding: "12px", 
          borderRadius: "8px", 
          border: "none", 
          background: colors.primary, 
          color: "#fff", 
          fontWeight: "700", 
          fontSize: "13px", 
          cursor: loading ? "not-allowed" : "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "8px",
          transition: "background 0.2s ease"
        }}
      >
        {loading ? "Processing..." : <><MdSend size={16} /> Submit Application</>}
      </button>
    </Card>
  );
};

// Extracted Input Group for cleaner JSX
const InputGroup = ({ label, icon, children, theme, alignStart }) => (
  <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
    <label style={{ 
      fontSize: "11px", 
      fontWeight: "700", 
      color: theme.label, 
      marginBottom: "6px", 
      display: "block", 
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {label}
    </label>
    <div style={{ 
      display: "flex", 
      alignItems: alignStart ? "flex-start" : "center", 
      gap: "10px", 
      padding: "10px 12px", 
      background: theme.inputBg, 
      borderRadius: "8px", 
      border: `1px solid ${theme.border}`,
      boxSizing: "border-box",
      width: "100%"
    }}>
      <span style={{ color: colors.primary, display: "flex", marginTop: alignStart ? "2px" : "0" }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  </div>
);

// Common input styles to prevent browser defaults from messing up the layout
const inputStyle = (theme) => ({ 
  width: "100%", 
  border: "none", 
  background: "transparent", 
  outline: "none", 
  fontSize: "13px", 
  color: theme.text, 
  fontFamily: typography.fontFamily,
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
  appearance: "none", // Helps with cross-browser styling for select/date inputs
});

export default ApplyLeaveCard;