import React, { useState } from "react";
import { MdPerson, MdEmail, MdPhone, MdHome, MdLocationCity, MdSave, MdClose } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import api from "../../utils/api";
import { toast } from "react-toastify";

const EditProfileModal = ({ employee, isDarkTheme, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ ...employee });
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create FormData specifically for backend logic
      const submitData = new FormData();
      
      // Map frontend state to backend expected keys
      submitData.append("full_name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("address", formData.address);
      submitData.append("permanent_address", formData.permanentAddress);

      // Make API Call
      await api.put("/edit-profile", submitData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success("Profile Updated Successfully!");
      onSuccess(); // Parent me naya data fetch karne ke liye
      onClose();   // 🔥 NAYA: Modal ko apne aap close karne ke liye
      
    } catch (error) {
      console.error("❌ Update Error:", error);
      const serverMessage = error.response?.data?.message || "Failed to update profile.";
      toast.error(serverMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    inputBg: isDarkTheme ? colors.darkHover : "#f9fafb",
    border: isDarkTheme ? colors.darkBorder : colors.border,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.card, backgroundColor: theme.bg }}>
        
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: "18px", color: theme.text, fontFamily: typography.fontFamily }}>
            Edit Profile
          </h2>
          <button onClick={onClose} style={{ ...styles.closeBtn, color: theme.muted }}>
            <MdClose size={20} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.fieldGroup}>
            <label style={{ ...styles.label, color: theme.muted }}>Full Name</label>
            <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
              <MdPerson color={colors.primary} size={16} />
              <input 
                style={{ ...styles.input, color: theme.text }} 
                value={formData.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={{ ...styles.label, color: theme.muted }}>Email Address</label>
            <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
              <MdEmail color={colors.primary} size={16} />
              <input 
                style={{ ...styles.input, color: theme.text }} 
                value={formData.email} 
                onChange={(e) => handleChange("email", e.target.value)} 
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={{ ...styles.label, color: theme.muted }}>Phone Number</label>
            <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
              <MdPhone color={colors.primary} size={16} />
              <input 
                style={{ ...styles.input, color: theme.text }} 
                value={formData.phone} 
                onChange={(e) => handleChange("phone", e.target.value)} 
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={{ ...styles.label, color: theme.muted }}>Current Address</label>
            <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border, alignItems: "flex-start" }}>
              <MdHome color={colors.primary} style={{ marginTop: "3px" }} size={16} />
              <textarea 
                rows="2" 
                style={{ ...styles.textarea, color: theme.text }} 
                value={formData.address} 
                onChange={(e) => handleChange("address", e.target.value)} 
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={{ ...styles.label, color: theme.muted }}>Permanent Address</label>
            <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border, alignItems: "flex-start" }}>
              <MdLocationCity color={colors.primary} style={{ marginTop: "3px" }} size={16} />
              <textarea 
                rows="2" 
                style={{ ...styles.textarea, color: theme.text }} 
                value={formData.permanentAddress} 
                onChange={(e) => handleChange("permanentAddress", e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div style={{ ...styles.footer, borderTop: `1px solid ${theme.border}` }}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }}>
            <MdSave size={16} /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" },
  card: { width: "100%", maxWidth: "480px", borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  header: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "4px" },
  body: { padding: "0 20px 20px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase" },
  inputWrapper: { display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", border: "1px solid" },
  input: { border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "13px", fontWeight: "600" },
  textarea: { border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "13px", fontWeight: "600", fontFamily: "inherit", resize: "none" },
  footer: { padding: "16px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" },
  cancelBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "transparent", color: colors.textMuted, fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  saveBtn: { padding: "8px 18px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: colors.buttonShadow(colors.primary), fontSize: "13px" }
};

export default EditProfileModal;