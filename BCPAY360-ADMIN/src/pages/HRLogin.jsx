import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { API_BASE } from "../utils/apiBase";




export default function HRLogin({ onLogin }) {
  const navigate = useNavigate();

  const [step, setStep] = useState("LOGIN");
  const [loading, setLoading] = useState(false);
  const [tempLoginId, setTempLoginId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  const [companies, setCompanies] = useState([]);

  const [form, setForm] = useState({
    companyId: "",
    emp_id: "",
    password: "",
    otp: "",
  });

  // OTP Resend Cooldown Timer
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  /* ===============================
     LOAD COMPANIES
  ================================ */
  useEffect(() => {
    let ignore = false;
    const loadCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/companies/public`);
        const data = await res.json();
        if (!ignore) setCompanies(data);
      } catch (err) {
        // silenced
        console.error("Failed to load companies", err);
      }
    };
    loadCompanies();
    return () => { ignore = true; };
  }, []);

  /* ===============================
     HR PRE LOGIN
  ================================ */
  // const submitHRLogin = async (e) => {
  //   e.preventDefault();

  //   if (!form.companyId || !normalizedEmpId || !form.password) {
  //     alert("All fields required");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const res = await fetch(`${API_BASE}/api/hr/pre-login`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         emp_id: normalizedEmpId,
  //         password: form.password,
  //       }),
  //     });

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message);

  //     setTempLoginId(data.tempLoginId);
  //     setStep("OTP");
  //   } catch (err) {
  //     alert(err.message || "Login failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const submitHRLogin = async (e) => {
  e.preventDefault();

  if (!form.companyId || !form.emp_id || !form.password) {
    alert("All fields required");
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/hr/pre-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: Number(form.companyId),
        hr_code: form.emp_id,   // FIXED HERE
        password: form.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // ===== SKIP OTP LOGIN =====
   if (data.skipOtp) {
      const authUser = {
        role: "HR",
        verified: true,
        emp_id: form.emp_id,
        company_id: data.hr.company_id,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(authUser));
      localStorage.setItem("hr_permissions", JSON.stringify(data.permissions || []));

      if (onLogin) onLogin(authUser);

      navigate("/dashboard", { replace: true });
      return;
    }

    // ===== NORMAL OTP FLOW =====
    setTempLoginId(data.tempLoginId);
    setOtpResendCooldown(45);
    setStep("OTP");

  } catch (err) {
    alert(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

  /* ===============================
     OTP VERIFY
  ================================ */
  const submitOTP = async (e) => {
    e.preventDefault();

    if (!tempLoginId) {
      alert("Session expired");
      setStep("LOGIN");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/hr/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempLoginId: tempLoginId,
          otp: form.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const authUser = {
        role: "HR",
        verified: true,
        emp_id: data.emp_id,
        company_id: data.company_id,
        branch_id: data.branch_id,
        department_id: data.department_id,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(authUser));
      localStorage.setItem("hr_permissions", JSON.stringify(data.permissions || []));

      if (onLogin) onLogin(authUser);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      alert(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     OTP RESEND
  ================================ */
  const handleResendOTP = async (e) => {
    e.preventDefault();

    if (!tempLoginId || otpResendCooldown > 0) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/hr/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESEND",
          tempLoginId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.tempLoginId) setTempLoginId(data.tempLoginId);
      setForm((prev) => ({ ...prev, otp: "" }));
      setOtpResendCooldown(45);
    } catch (err) {
      alert(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     UI
  ================================ */
  if (step === "LOGIN") {
    return (
      <div className="login-root">
        <div className="bg-orb orb-indigo"></div>
        <div className="bg-orb orb-purple"></div>

        <div className="glass-card">
          <button
            type="button"
            className="btn-ghost back-btn"
            onClick={() => navigate("/login", { replace: true })}
          >
            ← Back
          </button>
          <div className="card-header">
            <h2>HR Login</h2>
            <p>Access your HR dashboard</p>
          </div>

          <form className="form-group" onSubmit={submitHRLogin}>
            <select
              className="input-field animate-fade-in-up stagger-1"
              value={form.companyId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  companyId: e.target.value,
                }))
              }
              required
            >
              <option value="" style={{ background: '#1e293b' }}>Select Company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              className="input-field animate-fade-in-up stagger-2"
              placeholder="Employee ID (e.g. EMP006)"
              value={form.emp_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, emp_id: e.target.value }))
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
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <span
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary animate-fade-in-up stagger-4">
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* OTP */
  return (
    <div className="login-root">
      <div className="bg-orb orb-indigo"></div>
      <div className="bg-orb orb-purple"></div>

      <div className="glass-card">
        <div className="card-header">
          <h2>OTP Verification</h2>
          <p>Enter the code sent to your email</p>
        </div>

        <form className="form-group" onSubmit={submitOTP}>
          <input
            className="input-field animate-fade-in-up stagger-1"
            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
            placeholder="Enter OTP"
            value={form.otp}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, otp: e.target.value }))
            }
            required
            maxLength="6"
          />

          <button type="submit" disabled={loading} className="btn-primary animate-fade-in-up stagger-2">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading || otpResendCooldown > 0}
            className="resend-otp-btn"
            style={{ 
              justifyContent: 'center', 
              marginTop: '10px',
              background: 'none',
              border: 'none',
              color: otpResendCooldown > 0 ? '#64748b' : '#6366f1',
              cursor: otpResendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
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
