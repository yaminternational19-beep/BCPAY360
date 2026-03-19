import { useState } from "react";
import { MdLock, MdBadge, MdArrowBack } from "react-icons/md";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import api from "../../utils/api"; // 🔥 1. Import API (Replaced usersData)
import { toast } from "react-toastify"; 

const ForgotPassword = ({ onClose, onOtpSent, isDarkTheme }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 🔥 Added Loading State

  // 🔥 Theme Engine
  const theme = {
    overlay: isDarkTheme ? colors.darkBg : "rgba(15, 23, 42, 0.7)", 
    title: isDarkTheme ? colors.textLight : colors.textMain,
    description: isDarkTheme ? colors.darkMuted : colors.textMuted,
    backBtn: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  // 🔥 3. VALIDATION & API LOGIC
  const handleSendOtp = async () => {
    // 1. Check if empty
    if (!employeeId.trim()) {
      toast.error("Please enter your Employee ID");
      setError("Employee ID is required");
      return;
    }

    setIsLoading(true);
    setError(""); // Clear previous errors

    try {
      // 🔥 2. Call Real API
      const response = await api.post("/auth/forgot-password", {
        employee_code: employeeId
      });

      // 🔥 3. Handle Success
      // The API might return the internal ID needed for the next step
      const returnedId = response.data?.data?.employee_id || response.data?.employee_id;
      
      toast.success(response.data.message || "OTP sent successfully!");
      
      // Pass the necessary data to the parent to switch to VerifyOtp
      // We pass the returned ID (if available) or the code entered
      onOtpSent(returnedId || employeeId); 

    } catch (err) {
      // 🔥 4. Handle API Error
      console.error("Forgot Password Error:", err);
      const errorMsg = err.response?.data?.message || "User not found or Server Error";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="auth-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: theme.overlay,
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          animation: "modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" 
        }}
      >
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
          {/* Top Decorative Gradient Line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: `linear-gradient(90deg, ${colors.primary}, #6366f1)`
          }} />

          {/* Icon Header */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{
              width: "60px",
              height: "60px",
              backgroundColor: `${colors.primary}15`,
              borderRadius: colors.pillRadius,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "15px"
            }}>
              <MdLock size={28} color={colors.primary} />
            </div>
            
            <h2 style={{
              fontFamily: typography.fontFamily,
              fontSize: "22px",
              fontWeight: "700",
              color: theme.title,
              margin: "0 0 8px 0"
            }}>
              Forgot Password?
            </h2>
            
            <p style={{
              fontSize: "14px",
              color: theme.description,
              lineHeight: "1.5",
              margin: 0,
              padding: "0 10px",
              fontFamily: typography.fontFamily
            }}>
              Don't worry! Enter your ID below and we'll send a code to your registered email.
            </p>
          </div>

          {/* Input Section */}
          <div style={{ marginBottom: "24px" }}>
            <InputField
              label="Employee ID"
              placeholder="e.g. EMP-101"
              icon={MdBadge}
              value={employeeId}
              isDark={isDarkTheme}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setError(""); // Clear error on type
              }}
              error={error} // Pass error state to InputField
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Button
              label={isLoading ? "Sending..." : "Send OTP"} // 🔥 Loading Label
              fullWidth
              onClick={handleSendOtp} 
              disabled={isLoading} // 🔥 Disable while loading
              style={{ 
                height: "48px", 
                fontSize: "15px", 
                fontWeight: "600",
                boxShadow: colors.buttonShadow(colors.primary),
                opacity: isLoading ? 0.7 : 1
              }}
            />

            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: theme.backBtn,
                fontSize: "14px",
                fontWeight: "500",
                padding: "8px",
                transition: colors.smoothTransition
              }}
              onMouseEnter={(e) => (e.target.style.color = colors.primary)}
              onMouseLeave={(e) => (e.target.style.color = theme.backBtn)}
            >
              <MdArrowBack size={18} />
              Back to Login
            </button>
          </div>
        </Card>
      </div>

      <style>
        {`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ForgotPassword;