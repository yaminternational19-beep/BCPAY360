import React, { useState } from "react";
import { MdWarning, MdDeleteForever, MdOutlineFeedback, MdOutlineSecurity, MdCheckCircle, MdError } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { toast } from "react-toastify";
import api from "../../utils/api";

const DeleteModal = ({ isDarkTheme, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMatch = confirmText.trim().toUpperCase() === "DELETE";

  const handleConfirmClick = async () => {
    if (!isMatch) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category: "Account Deactivation", 
        reason: reason || "No reason provided by user"
      };

      const res = await api.post("/deactivate", payload);
      toast.success(res.data?.message || "Your account has been deactivated successfully.");
      
      onSuccess?.(); 
      onClose();

      // 🔥 FIX: Image aur Data turant hatane ka logic
      window.dispatchEvent(new CustomEvent("updateNavbarPhoto", { detail: null })); // Navbar ki photo turant gayab
      
      setTimeout(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userProfile");
        sessionStorage.clear();
        window.location.replace("/login"); // Redirect to login
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to deactivate account");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    inputBg: isDarkTheme ? colors.darkHover : "#f9fafb",
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.card, backgroundColor: theme.bg, borderColor: theme.border }}>
        <div style={{ ...styles.iconHeader, backgroundColor: `${colors.status.absent.bg}`, color: colors.status.absent.dot }}>
          <MdWarning size={32} />
        </div>

        <h3 style={{ margin: "16px 0 8px 0", color: theme.text, fontFamily: typography.fontFamily, fontSize: "18px" }}>
          Deactivate Account?
        </h3>
        <p style={{ margin: "0 0 16px 0", color: colors.textMuted, fontSize: "13px", lineHeight: "1.4" }}>
          This action will deactivate your account. To confirm, please type <strong>"DELETE"</strong> below.
        </p>

        <div style={{ textAlign: "left", marginBottom: "12px" }}>
           <label style={{ ...styles.label, color: theme.text }}>Confirmation Check <span style={{color: colors.status.absent.dot}}>*</span></label>
           <div style={{ position: "relative" }} className={shake ? "shake-anim" : ""}>
             <input type="text" placeholder="Type DELETE" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: confirmText && !isMatch ? colors.status.absent.dot : (isMatch ? colors.status.present.dot : theme.border) }} />
             <div style={{ position: "absolute", top: "12px", right: "12px" }}>{isMatch ? <MdCheckCircle size={18} color={colors.status.present.dot} /> : confirmText.length > 0 ? <MdError size={18} color={colors.status.absent.dot} /> : <MdOutlineSecurity size={18} color={colors.textMuted} />}</div>
           </div>
        </div>

        <div style={{ textAlign: "left", marginBottom: "20px" }}>
          <label style={{ ...styles.label, color: theme.text }}>Reason (Optional)</label>
          <div style={{ position: "relative" }}>
            <textarea rows="2" placeholder="Why are you leaving?" value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }} />
            <MdOutlineFeedback size={16} color={colors.textMuted} style={{ position: "absolute", top: "10px", right: "12px", opacity: 0.5 }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexDirection: "column-reverse" }}>
          <button onClick={onClose} style={{ ...styles.btn, background: "transparent", border: `1px solid ${colors.textMuted}`, color: theme.text }}>Cancel</button>
          <button onClick={handleConfirmClick} disabled={loading} style={{ ...styles.btn, background: isMatch ? colors.status.absent.dot : colors.textMuted, color: "#fff", opacity: isMatch ? 1 : 0.5, cursor: isMatch ? "pointer" : "not-allowed", boxShadow: isMatch ? `0 4px 12px ${colors.status.absent.dot}40` : "none" }}>{loading ? "Processing..." : <><MdDeleteForever size={16} /> Yes, Deactivate</>}</button>
        </div>
      </div>
      <style>{` @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); } } .shake-anim input { animation: shake 0.3s ease-in-out; border-color: ${colors.status.absent.dot} !important; } `}</style>
    </div>
  );
};

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" },
  card: { width: "100%", maxWidth: "380px", borderRadius: "16px", padding: "24px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", borderWidth: "1px", borderStyle: "solid" },
  iconHeader: { width: "60px", height: "60px", borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid rgba(255,255,255,0.5)` },
  label: { fontSize: "11px", fontWeight: "700", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "2px solid", fontSize: "13px", fontWeight: "600", outline: "none", boxSizing: "border-box", transition: "all 0.3s" },
  textarea: { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid", fontSize: "13px", fontFamily: typography.fontFamily, resize: "none", outline: "none", boxSizing: "border-box" },
  btn: { width: "100%", padding: "12px", borderRadius: "10px", border: "none", fontWeight: "700", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.3s" }
};

export default DeleteModal;