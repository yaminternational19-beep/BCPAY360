import { useState, useEffect } from "react";
import { MdEmail, MdLock } from "react-icons/md";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import ForgotPassword from "./ForgotPassword";
import VerifyOtp from "./VerifyOtp";
import colors from "../../styles/colors";
import logo from "../../assets/images/AppLogo2.png";
import image from "../../assets/images/welcome image.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./auth.css";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const Login = () => {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showOtp, setShowOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotFlow, setForgotFlow] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("showWelcomeToast");

    // Get OneSignal Player ID from localStorage (set in App.jsx)
    const storedPlayerId = localStorage.getItem("onesignal_player_id");

    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
      console.log("Player ID from storage:", storedPlayerId);
    } else {
      console.log("Player ID not found yet");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!employeeId) newErrors.employeeId = "Employee ID is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const finalPlayerId = playerId || generateUUID();
      console.log("Player ID used in login:", finalPlayerId);

      const response = await api.post("/auth/login", {
        employee_code: employeeId,
        password,
        device_type: "web",
        player_id: finalPlayerId,
      });

      const { status, data, token, user, message } = response.data;

      if (token) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user || {}));
        sessionStorage.setItem("showWelcomeToast", "true");

        navigate("/dashboard");
      } else if (status === "otp_sent" || message?.includes("OTP")) {
        setTempData({
          employee_id: data?.employee_id || response.data.employee_id,
          employee_code: employeeId,
        });

        setForgotFlow(false);
        setShowOtp(true);

        toast.info("OTP sent to your email.");
      } else {
        toast.error(message || "Invalid credentials provided.");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Wrong Password or Employee ID";

      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`input::-ms-reveal, input::-ms-clear { display: none; }`}</style>

      <div className="login-wrapper">
        <div className="login-card">
          {/* LEFT SIDE */}
<div className="login-left">           <img src={image} alt="Login Illustration" className="login-image" />

            <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
              Employee Portal
            </h1>

            <p style={{ fontSize: "14px", opacity: 0.8 }}>
              Manage your work efficiently and securely
            </p>
          </div>

          {/* RIGHT SIDE */}
         <div className="login-right">
<div className="login-form">              <div className="login-header">
                <img
                  src={logo}
                  alt="logo"
                  width={100}
                  style={{ marginBottom: "10px" }}
                />

             <h2 className="login-title">Welcome Back</h2>

               <p className="login-subtitle">Enter your Login Details</p>
              </div>

              <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
                <InputField
                  label="Employee ID"
                  icon={MdEmail}
                  placeholder="Enter your ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  error={errors.employeeId}
                />

                <InputField
                  label="Password"
                  type="password"
                  icon={MdLock}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />

              <div className="forgot-wrapper">
                  <span
                    onClick={() => {
                      setForgotFlow(true);
                      setShowForgot(true);
                    }}
                    className="forgot-link"
                  >
                    Forgot password?
                  </span>
                </div>

                <div
                  onMouseEnter={() => setIsBtnHovered(true)}
                  onMouseLeave={() => setIsBtnHovered(false)}
                >
                  <Button
                    label={isLoading ? "Signing In..." : "Login"}
                    fullWidth
                    type="submit"
                    disabled={isLoading}
                    style={{
                      backgroundColor: isBtnHovered ? "#333333" : "#000000",
                      color: "#ffffff",
                      border: "1px solid #000000",
                      transition: "all 0.3s ease",
                      fontWeight: "600",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showForgot && (
        <ForgotPassword
          onClose={() => setShowForgot(false)}
          onOtpSent={(id) => {
            if (id) setTempData({ employee_id: id });

            setShowForgot(false);
            setShowOtp(true);
          }}
        />
      )}

      {showOtp && (
        <VerifyOtp
          flow={forgotFlow ? "forgot" : "login"}
          employeeId={tempData?.employee_id}
          employeeCode={tempData?.employee_code || employeeId}
          onClose={() => setShowOtp(false)}
          onOtpVerified={(token) => {
            if (token) {
              localStorage.setItem("authToken", token);
              sessionStorage.setItem("showWelcomeToast", "true");

              setShowOtp(false);
              navigate("/dashboard");
            }
          }}
        />
      )}
    </>
  );
};

/* styles unchanged */


/* ---------------- STYLES ---------------- */

const pageWrapper = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Inter', sans-serif",
  backgroundColor: "#ffffff", 
};

const cardStyle = {
  display: "flex",
  flexDirection: "row", 
  width: "85%",
  maxWidth: "1000px", 
  minHeight: "550px",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)", 
  overflow: "hidden", 
};

const leftSection = {
  flex: 1,
  background: "linear-gradient(135deg, #2b5876 0%, #4e4376 100%)", 
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  color: "#ffffff",
  textAlign: "center",
};

const imageStyle = {
  width: "80%",
  maxWidth: "350px",
  height: "auto",
  marginBottom: "30px",
};

const rightSection = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  padding: "40px",
};

const formContainer = {
  width: "100%",
  maxWidth: "360px", 
};

const headerSection = {
  textAlign: "center",
  marginBottom: "20px",
};

const titleStyle = {
  margin: 0,
  fontSize: "26px",
  fontWeight: "800",
  color: "#1a1a1a",
};

const subtitleStyle = {
  color: "#6c757d",
  fontSize: "14px",
  marginTop: "6px",
  fontWeight: "500",
};

const forgotPasswordWrapper = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "4px",
  marginBottom: "20px",
};

const forgotLinkStyle = {
  cursor: "pointer",
  color: "#2b5876", 
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
};

export default Login;