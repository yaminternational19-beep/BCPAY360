import { useState } from "react";
import { MdLock } from "react-icons/md";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { toast } from "react-toastify";
import api from "../../utils/api"; // 🔥 Import API

const ResetPassword = ({ onClose, employeeId, isDarkTheme }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 REAL API CALL
  const handleReset = async () => {
    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        employee_id: employeeId,
        new_password: password
      });

      toast.success("Password Updated! Please Login.");
      onClose(); // Closes modal -> returns to Login Page
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const theme = {
    overlay: isDarkTheme ? colors.darkBg : "rgba(15, 23, 42, 0.7)",
    title: isDarkTheme ? colors.textLight : colors.textMain,
    subtitle: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  return (
    <div className="auth-overlay" style={{ ...styles.overlay, backgroundColor: theme.overlay }}>
      <div style={styles.modalContainer}>
        <Card 
          isDark={isDarkTheme} 
          style={{ 
            padding: "40px", 
            position: "relative", 
            overflow: "hidden",
            boxShadow: colors.dropdownShadow,
            borderRadius: colors.borderRadiusLg
          }}
        >
          
          <div style={{ ...styles.topBar, background: `linear-gradient(90deg, ${colors.primary}, #6366f1)` }} />

          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <div style={{ ...styles.iconCircle, backgroundColor: `${colors.primary}15` }}>
              <MdLock size={28} color={colors.primary} />
            </div>
            <h2 style={{ ...styles.title, color: theme.title }}>Set New Password</h2>
            <p style={{ ...styles.subtitle, color: theme.subtitle }}>
              Choose a strong password you haven't used before.
            </p>
          </div>

          <InputField
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            isDark={isDarkTheme}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ marginTop: "18px" }}>
            <InputField
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              isDark={isDarkTheme}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            label={isLoading ? "Updating..." : "Update Password"}
            fullWidth
            onClick={handleReset}
            disabled={isLoading}
            style={{ 
              marginTop: "30px", 
              height: "48px", 
              fontWeight: "600",
              boxShadow: colors.buttonShadow(colors.primary),
              opacity: isLoading ? 0.7 : 1
            }}
          />

          <button 
            onClick={onClose} 
            style={{ ...styles.cancelBtn, color: theme.subtitle, transition: colors.smoothTransition }}
            onMouseEnter={(e) => e.target.style.color = colors.error}
            onMouseLeave={(e) => e.target.style.color = theme.subtitle}
          >
            Cancel & Exit
          </button>
        </Card>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100
  },
  modalContainer: {
    width: "100%",
    maxWidth: "400px",
    animation: "modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "4px"
  },
  iconCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px"
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    fontFamily: typography.fontFamily,
    margin: "0"
  },
  subtitle: {
    fontSize: "14px",
    marginTop: "8px",
    lineHeight: "1.5"
  },
  cancelBtn: {
    width: "100%",
    background: "none",
    border: "none",
    marginTop: "20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  }
};

export default ResetPassword;