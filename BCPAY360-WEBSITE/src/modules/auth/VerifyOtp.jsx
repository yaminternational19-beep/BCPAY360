import { useState, useEffect, useRef } from "react";
import { MdVerifiedUser, MdOutlineTimer, MdClose, MdErrorOutline } from "react-icons/md";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ResetPassword from "./ResetPassword";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import logo from "../../assets/images/AppLogo2.png";
import { toast } from "react-toastify";
import api from "../../utils/api"; 

const VerifyOtp = ({ onClose, flow = "login", onOtpVerified, isDarkTheme, employeeId, employeeCode }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showReset, setShowReset] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const inputRefs = useRef([]);

  const isOtpFilled = otp.every((d) => d !== "");

  const theme = {
    overlay: isDarkTheme ? "rgba(0, 0, 0, 0.85)" : "rgba(15, 23, 42, 0.7)",
    title: isDarkTheme ? colors.textLight : colors.textMain,
    subtitle: isDarkTheme ? colors.darkMuted : colors.textMuted,
    inputBg: isDarkTheme ? colors.darkHover : colors.surface,
    inputBorder: isDarkTheme ? colors.darkBorder : colors.inputBorder,
    textColor: isDarkTheme ? colors.textLight : "#000000", 
  };

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    if (isError) setIsError(false);
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
    if (e.key === "Enter" && isOtpFilled) handleVerifyOtp();
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").trim().slice(0, 6).split("");
    if (data.length === 6 && data.every(char => !isNaN(char))) {
      setOtp(data);
      setIsError(false);
      inputRefs.current[5].focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (!isOtpFilled) {
      setIsError(true);
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = flow === "forgot" ? "/auth/verify-forgot-otp" : "/auth/verify-otp";
      const response = await api.post(endpoint, {
        employee_id: employeeId,
        otp: otpString
      });

      // 🔥 REMOVED TOAST HERE (So no interruption)

        if (flow === "forgot") {
        toast.success("Verified! Please set new password."); // Keep for forgot flow
        setShowReset(true); 
      } else {
        onOtpVerified?.(response.data); // Instant callback with full data
      }
    } catch (error) {
      setIsError(true);
      toast.error(error.response?.data?.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
  if (timer !== 0 || isLoading) return;

  if (!employeeCode) {
    toast.error("Employee code missing. Please login again.");
    return;
  }

  setIsLoading(true);

  try {
    await api.post("/auth/resend-login-otp", {
      employee_code: employeeCode,
    });

    toast.success("New OTP sent successfully!");

    setTimer(30);
    setOtp(["", "", "", "", "", ""]);
    setIsError(false);
    inputRefs.current[0]?.focus();

  } catch (error) {
    console.error("Resend OTP error:", error.response || error);
    toast.error(error.response?.data?.message || "Failed to resend OTP.");
  } finally {
    setIsLoading(false);
  }
};


  if (showReset) {
    return <ResetPassword isDarkTheme={isDarkTheme} employeeId={employeeId} onClose={onClose} />;
  }

  return (
    <>
      <div className="auth-overlay" style={{ ...styles.overlay, backgroundColor: theme.overlay }}>
        <div style={styles.modalWrapper}>
          <Card isDark={isDarkTheme} style={{ padding: "40px", position: "relative", boxShadow: colors.dropdownShadow }}>
            <MdClose 
              onClick={onClose} 
              style={styles.closeIcon} 
              onMouseEnter={(e) => (e.target.style.color = colors.primary)}
              onMouseLeave={(e) => (e.target.style.color = colors.textMuted)}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px", textAlign: "center" }}>
              <img src={logo} alt="logo" width={80} style={{ marginBottom: "15px", display: "block" }} />
              <div style={{ ...styles.iconBadge, backgroundColor: isError ? `${colors.error}15` : `${colors.primary}15` }}>
                {isError ? <MdErrorOutline size={24} color={colors.error} /> : <MdVerifiedUser size={24} color={colors.primary} />}
              </div>
              <h3 style={{ ...styles.title, color: theme.title }}>
                {flow === "forgot" ? "Reset Verification" : "Login Verification"}
              </h3>
              <p style={{ ...styles.subtitle, color: isError ? colors.error : theme.subtitle }}>
                {isError ? "Incorrect Code. Please try again." : `Enter the 6-digit code sent to your email`}
              </p>
            </div>
            <div style={styles.otpContainer} className={isError ? "shake-animation" : ""} onPaste={handlePaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  maxLength={1}
                  disabled={isLoading}
                  value={d}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  style={{
                    ...styles.otpInput,
                    backgroundColor: theme.inputBg,
                    color: theme.title,
                    borderColor: isError ? colors.error : (d ? colors.primary : theme.inputBorder),
                    boxShadow: isError ? `0 0 0 3px ${colors.error}20` : (d ? `0 0 0 3px ${colors.primary}20` : "none"),
                    opacity: isLoading ? 0.5 : 1
                  }}
                />
              ))}
            </div>
            <Button 
              label={isLoading ? "Verifying..." : "Verify OTP"} 
              fullWidth 
              onClick={handleVerifyOtp} 
              disabled={isLoading || !isOtpFilled} 
              style={{ 
                height: "48px", 
                boxShadow: colors.buttonShadow(colors.primary),
                opacity: (isLoading || !isOtpFilled) ? 0.5 : 1,
                cursor: (isLoading || !isOtpFilled) ? "not-allowed" : "pointer",
                transition: "all 0.3s ease"
              }} 
            />
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              {timer > 0 ? (
                <div style={{ ...styles.timerBox, backgroundColor: isDarkTheme ? colors.darkHover : colors.filterCapsuleBg, cursor: "default" }}>
                  <MdOutlineTimer size={16} color={theme.subtitle} />
                  <span style={{ color: theme.subtitle }}>Resend in <b>{timer}s</b></span>
                </div>
              ) : (
                <p style={{ fontSize: "14px", margin: 0 }}>
                  <span style={{ color: theme.textColor }}>Didn't receive code? </span>
                <span
  onClick={timer === 0 && !isLoading ? handleResendOtp : undefined}
  style={{
    color: timer === 0 ? colors.primary : "#94a3b8",
    fontWeight: "700",
    cursor: timer === 0 ? "pointer" : "not-allowed",
    textDecoration: "underline",
    marginLeft: "4px",
    opacity: isLoading ? 0.6 : 1
  }}
>
  Resend OTP
</span>

                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <style>{`@keyframes modalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } } .shake-animation { animation: shake 0.4s ease-in-out; }`}</style>
    </>
  );
};
const styles = {
  overlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" },
  modalWrapper: { width: "100%", maxWidth: "420px", animation: "modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" },
  closeIcon: { position: "absolute", top: "20px", right: "20px", fontSize: "24px", color: "#94a3b8", cursor: "pointer", transition: colors.smoothTransition },
  iconBadge: { width: "50px", height: "50px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", transition: "all 0.3s" },
  title: { fontSize: "22px", fontWeight: "700", fontFamily: typography.fontFamily, margin: "10px 0 5px" },
  subtitle: { fontSize: "14px", fontFamily: typography.fontFamily, transition: "color 0.3s" },
  otpContainer: { display: "flex", gap: "10px", justifyContent: "center", margin: "30px 0" },
  otpInput: { width: "45px", height: "52px", textAlign: "center", fontSize: "20px", fontWeight: "700", borderRadius: colors.borderRadiusSm, border: "2px solid", outline: "none", transition: "all 0.2s" },
  timerBox: { display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", padding: "6px 16px", borderRadius: colors.pillRadius },
};
export default VerifyOtp;