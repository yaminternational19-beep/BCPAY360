import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/CodeVerify.css";

export default function CodeVerify({ onVerify }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const [code, setCode] = useState("");

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const expected = user.role === "COMPANY_ADMIN" ? "999999" : "123456";

  const verify = () => {
    if (code !== expected) {
      alert("Invalid OTP");
      return;
    }

    const updated = {
      ...user,
      verified: true,
    };

    localStorage.setItem("auth_user", JSON.stringify(updated));
    onVerify(updated);

    // ✅ ROLE-BASED LANDING
    navigate("/", { replace: true });
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h2>OTP Verification</h2>

        <input
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter OTP"
        />

        <button onClick={verify}>Verify</button>

        <p className="otp-hint">
          Admin OTP: <strong>999999</strong> &nbsp;|&nbsp;
          HR OTP: <strong>123456</strong>
        </p>
      </div>
    </div>
  );
}
