import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

import { API_BASE } from "../utils/apiBase";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [step, setStep] = useState("ROLE"); // ROLE | LOGIN | HR_LOGIN | OTP
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [tempLoginId, setTempLoginId] = useState(null);

  const companiesLoading = companies.length === 0;

  const [showPassword, setShowPassword] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState({
    companyId: "",
    email: "",
    password: "",
    emp_id: "",
    otp: "",
  });

  // Helper to reset form cleanly
  const resetFormState = () => {
    setForm({
      companyId: "",
      email: "",
      password: "",
      emp_id: "",
      otp: "",
    });
    setShowPassword(false);
    setTempLoginId(null);
    setOtpResendCooldown(0);
    setUserEmail("");
  };

  // OTP Resend Cooldown Timer
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  /* =============================
     FETCH COMPANIES (COMPANY ADMIN)
  ============================= */
  useEffect(() => {
    let ignore = false;

    const loadCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/companies/public`);
        const data = await res.json();
        if (!ignore) setCompanies(data);
      } catch (e) {
        // silenced
      }
    };

    loadCompanies();

    return () => { ignore = true };
  }, []);


  /* =============================
     ROLE SELECT
  ============================= */
  const selectRole = (r) => {
    if (r === "SUPER_ADMIN") {
      navigate("/super-admin/login", { replace: true });
      return;
    }

    setRole(r);
    resetFormState();

    if (r === "HR") {
      navigate("/hr/login", { replace: true });
      return;
    }

    setStep("LOGIN");
  };

  /* =============================
     BACK TO ROLE SELECTION
  ============================= */
  const handleBackToRole = () => {
    setRole(null);
    setStep("ROLE");
    resetFormState();
  };

  /* =============================
     COMPANY ADMIN LOGIN
  ============================= */
  const submitAdminLogin = async (e) => {
    e.preventDefault();

    if (!form.companyId || !form.email || !form.password) {
      alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/company-admins/pre-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: Number(form.companyId),
          email: form.email,
          password: form.password,
        }),

      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setTempLoginId(data.tempLoginId);
      setUserEmail(form.email);
      setOtpResendCooldown(45);
      setStep("OTP");
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  /* =============================
     HR LOGIN
  ============================= */
  const submitHRLogin = async (e) => {
    e.preventDefault();

    if (!form.emp_id || !form.password) {
      alert("Emp ID and Password required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/hr/pre-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: form.emp_id,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setTempLoginId(data.tempLoginId);
      setUserEmail(data.email || "your registered email");
      setOtpResendCooldown(45);
      setStep("OTP");
    } catch (err) {
      alert(err.message || "HR login failed");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     OTP SUBMIT
  ============================= */
  const submitOTP = async (e) => {
    e.preventDefault();

    if (!tempLoginId) {
      alert("Session expired");
      setStep(role === "HR" ? "HR_LOGIN" : "LOGIN");
      return;
    }

    try {
      setLoading(true);

      const url =
        role === "HR"
          ? `${API_BASE}/api/hr/verify-otp`
          : `${API_BASE}/api/company-admins/verify-otp`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempLoginId,
          otp: form.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const user =
        role === "HR"
          ? {
            role: "HR",
            verified: true,
            emp_id: data.emp_id,
            department: data.department,
            company_id: data.company_id,
          }
          : {
            role: "COMPANY_ADMIN",
            verified: true,
            company_id: data.company_id,
          };

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      localStorage.setItem("auth_user", JSON.stringify(user));
      onLogin(user);

      navigate(
        role === "HR" ? "/" : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      alert(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     OTP RESEND
  ============================= */
  const handleResendOTP = async (e) => {
    e.preventDefault();

    if (!tempLoginId || otpResendCooldown > 0) {
      return;
    }

    try {
      setLoading(true);

      const url =
        role === "HR"
          ? `${API_BASE}/api/hr/verify-otp`
          : `${API_BASE}/api/company-admins/verify-otp`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESEND",
          tempLoginId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.tempLoginId) {
        setTempLoginId(data.tempLoginId);
      }

      setForm({ ...form, otp: "" });
      setOtpResendCooldown(45);
    } catch (err) {
      alert(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     UI - ROLE SELECTION
  ============================= */


  if (step === "ROLE") {
    return (
      <div className="login-root">
        <div className="bg-orb orb-indigo"></div>
        <div className="bg-orb orb-purple"></div>

        <div className="glass-card">
          <div className="card-header">
            <h2>Welcome</h2>
            <p>Select your role to continue</p>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn-primary animate-fade-in-up stagger-1"
              onClick={() => selectRole("SUPER_ADMIN")}
            >
              Super Admin
            </button>
            <button
              type="button"
              className="btn-primary animate-fade-in-up stagger-2"
              onClick={() => selectRole("COMPANY_ADMIN")}
            >
              Company Admin
            </button>
            <button
              type="button"
              className="btn-primary animate-fade-in-up stagger-3"
              onClick={() => selectRole("HR")}
            >
              HR
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =============================
     UI - COMPANY ADMIN LOGIN
  ============================= */
  if (step === "LOGIN") {
    const isAdminFormValid = form.companyId && form.email && form.password;

    return (
      <div className="login-root">
        <div className="bg-orb orb-indigo"></div>
        <div className="bg-orb orb-purple"></div>

        <div className="glass-card">
          <button
            type="button"
            className="btn-ghost back-btn"
            onClick={handleBackToRole}
          >
            ← Back
          </button>

          <div className="card-header">
            <h2>Admin Login</h2>
            <p>Manage your company</p>
          </div>

          <form className="form-group" onSubmit={submitAdminLogin}>
            <select
              className="input-field animate-fade-in-up stagger-1"
              disabled={companiesLoading}
              value={form.companyId}
              onChange={(e) =>
                setForm({ ...form, companyId: e.target.value })
              }
              required
            >
              <option value="" style={{ background: '#1e293b' }}>
                {companiesLoading ? "Loading companies..." : "Select Company"}
              </option>

              {companies.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              className="input-field animate-fade-in-up stagger-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />

            <div className="password-wrapper animate-fade-in-up stagger-3">
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              <span
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !isAdminFormValid}
              className="btn-primary login-submit-btn-override animate-fade-in-up stagger-4"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =============================
     UI - HR LOGIN (FALLBACK/IN-PAGE)
  ============================= */
  if (step === "HR_LOGIN") {
    const isHRFormValid = form.emp_id && form.password;

    return (
      <div className="login-root">
        <div className="bg-orb orb-indigo"></div>
        <div className="bg-orb orb-purple"></div>

        <div className="glass-card">
          <button
            type="button"
            className="btn-ghost back-btn"
            onClick={handleBackToRole}
          >
            ← Change Role
          </button>

          <div className="card-header">
            <h2>HR Login</h2>
            <p>Access your dashboard</p>
          </div>

          <form className="form-group" onSubmit={submitHRLogin}>
            <input
              className="input-field animate-fade-in-up stagger-1"
              placeholder="Emp ID"
              value={form.emp_id}
              onChange={(e) =>
                setForm({ ...form, emp_id: e.target.value })
              }
              required
            />

            <div className="password-wrapper animate-fade-in-up stagger-2">
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              <span
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !isHRFormValid}
              className="btn-primary animate-fade-in-up stagger-3"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =============================
     UI - OTP VERIFICATION
  ============================= */
  if (step === "OTP") {
    const isOTPFormValid = form.otp.length >= 4;
    const canResend = otpResendCooldown === 0 && !loading;

    return (
      <div className="login-root">
        <div className="bg-orb orb-indigo"></div>
        <div className="bg-orb orb-purple"></div>

        <div className="glass-card">
          <div className="card-header">
            <h2>OTP Verification</h2>
            <p>Code sent to <strong>{userEmail}</strong></p>
          </div>

          <form className="form-group" onSubmit={submitOTP}>
            <input
              className="input-field animate-fade-in-up stagger-1"
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
              placeholder="Enter OTP"
              maxLength="6"
              value={form.otp}
              onChange={(e) =>
                setForm({ ...form, otp: e.target.value })
              }
              required
            />

            <button
              type="submit"
              disabled={loading || !isOTPFormValid}
              className="btn-primary animate-fade-in-up stagger-2"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading || !canResend}
              className="resend-otp-btn"
              style={{ justifyContent: 'center', marginTop: '10px' }}
            >
              {otpResendCooldown > 0
                ? `Resend OTP (${otpResendCooldown}s)`
                : "Resend OTP"}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
