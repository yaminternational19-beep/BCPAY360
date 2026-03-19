import React, { useState, useEffect } from "react";
import { MdLockReset, MdCheckCircle, MdOutlineVpnKey, MdLockOutline, MdError, MdVisibility, MdVisibilityOff } from "react-icons/md"; 
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { toast } from "react-toastify";
import api from "../../utils/api";

const PasswordModal = ({ isDarkTheme, onClose }) => {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [strength, setStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  const toggleVisibility = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  useEffect(() => {
    const len = passwords.new.length;
    if (len === 0) setStrength(0);
    else if (len < 6) setStrength(1); 
    else if (len < 10) setStrength(2); 
    else setStrength(3); 
  }, [passwords.new]);

  const handleSubmit = async () => {
    setError("");
    if (!passwords.current || !passwords.new || !passwords.confirm) return setError("All fields are required.");
    if (passwords.new.length < 6) return setError("Min 6 characters.");
    if (passwords.current === passwords.new) return setError("New password cannot be same as old.");
    if (passwords.new !== passwords.confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      // Backend expects old_password and new_password based on your Postman
      const payload = {
        old_password: passwords.current,
        new_password: passwords.new
      };

      const res = await api.post("/auth/change-password", payload);
      
      toast.success(res.data.message || "Password updated successfully!"); 
      onClose(); 
    } catch (err) {
      console.error("❌ Password Update Error:", err);
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    inputBg: isDarkTheme ? colors.darkHover : "#f9fafb",
    border: isDarkTheme ? colors.darkBorder : colors.border,
    icon: isDarkTheme ? "#94a3b8" : "#64748b" 
  };

  const getStrengthColor = () => {
    if (strength === 1) return colors.status.absent.dot; 
    if (strength === 2) return colors.status.late.dot;   
    if (strength === 3) return colors.status.present.dot; 
    return colors.border;
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.card, backgroundColor: theme.bg, borderColor: theme.border }}>
        <div style={{ ...styles.iconHeader, backgroundColor: `${colors.primary}15`, color: colors.primary }}>
          <MdLockReset size={28} />
        </div>
        <h3 style={{ margin: "12px 0 8px 0", color: theme.text, fontFamily: typography.fontFamily, fontSize: "18px" }}>Change Password</h3>
        
        <div style={styles.inputGroup}>
          
          <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
            <MdLockOutline color={theme.icon} size={18} />
            <input 
              type={showPasswords.current ? "text" : "password"} 
              placeholder="Current Password" 
              style={{ ...styles.input, color: theme.text }} 
              value={passwords.current} 
              onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
            />
            <div onClick={() => toggleVisibility('current')} style={styles.eyeIcon}>
              {showPasswords.current ? <MdVisibility color={theme.icon} size={18} /> : <MdVisibilityOff color={theme.icon} size={18} />}
            </div>
          </div>

          <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
            <MdOutlineVpnKey color={theme.icon} size={18} />
            <input 
              type={showPasswords.new ? "text" : "password"} 
              placeholder="New Password" 
              style={{ ...styles.input, color: theme.text }} 
              value={passwords.new} 
              onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
            />
            <div onClick={() => toggleVisibility('new')} style={styles.eyeIcon}>
              {showPasswords.new ? <MdVisibility color={theme.icon} size={18} /> : <MdVisibilityOff color={theme.icon} size={18} />}
            </div>
          </div>

          {passwords.new && (
            <div style={{ display: "flex", gap: "4px", marginTop: "-8px", paddingLeft: "4px" }}>
              {[1, 2, 3].map((step) => ( <div key={step} style={{ height: "3px", flex: 1, borderRadius: "2px", backgroundColor: step <= strength ? getStrengthColor() : theme.border }} /> ))}
            </div>
          )}

          <div style={{ ...styles.inputWrapper, backgroundColor: theme.inputBg, borderColor: theme.border }}>
            <MdCheckCircle color={theme.icon} size={18} />
            <input 
              type={showPasswords.confirm ? "text" : "password"} 
              placeholder="Confirm Password" 
              style={{ ...styles.input, color: theme.text }} 
              value={passwords.confirm} 
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
            />
            <div onClick={() => toggleVisibility('confirm')} style={styles.eyeIcon}>
              {showPasswords.confirm ? <MdVisibility color={theme.icon} size={18} /> : <MdVisibilityOff color={theme.icon} size={18} />}
            </div>
          </div>
        </div>

        {error && <div style={{ marginTop: "12px", padding: "8px", borderRadius: "8px", backgroundColor: `${colors.status.absent.bg}`, color: colors.status.absent.text, fontSize: "11px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}><MdError size={14} /> {error}</div>}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexDirection: "column-reverse" }}>
          <button onClick={onClose} style={{ ...styles.btn, background: "transparent", border: `1px solid ${theme.border}`, color: colors.textMuted }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btn, background: loading ? theme.border : colors.status.present.dot, color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Updating..." : "Update Password"}</button>
        </div>
      </div>

      <style>{` input::-ms-reveal, input::-ms-clear { display: none; } `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" },
  card: { width: "100%", maxWidth: "360px", borderRadius: "20px", padding: "24px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", borderWidth: "1px", borderStyle: "solid" },
  iconHeader: { width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" },
  inputWrapper: { display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", height: "46px", borderRadius: "10px", borderWidth: "1px", borderStyle: "solid", overflow: "hidden" },
  input: { border: "none", background: "transparent", outline: "none", flex: 1, width: "100%", height: "100%", fontSize: "13px", fontWeight: "600" },
  eyeIcon: { cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minWidth: "36px" },
  btn: { flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "13px", transition: "0.2s", width: "100%" }
};

export default PasswordModal;