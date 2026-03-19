import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SuperAdmin.css";
import { API_BASE } from "../utils/apiBase";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [login, setLogin] = useState({
    email: "",
    password: "",
    otp: "",
  });

  const handleBack = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const sendOtp = async () => {
    if (!login.email || !login.password) {
      alert("Email and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/super-admin/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: login.email,
          password: login.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOtpSent(true);
    } catch (err) {
      alert(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();

    if (!login.email || !login.otp) {
      alert("Email and OTP required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/super-admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: login.email,
          otp: login.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      navigate("/super-admin/dashboard", { replace: true });
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="bg-orb orb-indigo"></div>
      <div className="bg-orb orb-purple"></div>

      <div className="glass-card">
        <button type="button" className="btn-ghost back-btn" onClick={handleBack}>
          ← Back
        </button>

        <div className="card-header">
          <h1>Super Admin</h1>
          <p>Secure system access</p>
        </div>

        <form className="form-group" onSubmit={submitLogin}>
          <input
            className="input-field animate-fade-in-up stagger-1"
            placeholder="Email address"
            value={login.email}
            onChange={(e) => setLogin({ ...login, email: e.target.value })}
            required
          />

          <div className="password-wrapper animate-fade-in-up stagger-2">
            <input
              className="input-field"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={login.password}
              onChange={(e) =>
                setLogin({ ...login, password: e.target.value })
              }
              disabled={otpSent}
              required
            />
            <span
              className="eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {otpSent && (
            <input
              className="input-field animate-fade-in-up"
              placeholder="Enter OTP"
              value={login.otp}
              onChange={(e) => setLogin({ ...login, otp: e.target.value })}
              required
            />
          )}

          {!otpSent ? (
            <button
              type="button"
              className="btn-primary animate-fade-in-up stagger-3"
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="btn-primary animate-fade-in-up stagger-3"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Login"}
              </button>

              <button
                type="button"
                className="resend-otp-btn"
                onClick={sendOtp}
                style={{ marginTop: '10px', justifyContent: 'center' }}
              >
                Resend OTP
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
