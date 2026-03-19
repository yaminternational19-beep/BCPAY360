import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RoleGate.css";

export default function RoleGate() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  const proceed = () => {
    if (!role) return;

    const existing = JSON.parse(localStorage.getItem("auth_user"));
    if (!existing) {
      navigate("/login", { replace: true });
      return;
    }

    const updatedUser = {
      ...existing,                 // ✅ PRESERVE email, company, etc
      role,
      department: role === "COMPANY_ADMIN" ? null : department,
      verified: false,
    };

    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    navigate("/verify");
  };

  return (
    <div className="role-page">
      <div className="role-card">
        <h2>Select Access Type</h2>

        <div className="role-options">
          <button
            className={`role-btn ${role === "ADMIN" ? "active" : ""}`}
            onClick={() => {
              setRole("ADMIN");
              setDepartment("");
            }}
          >
            Admin
          </button>

          <button
            className={`role-btn ${role === "HR" ? "active" : ""}`}
            onClick={() => setRole("HR")}
          >
            HR
          </button>
        </div>

        {role === "HR" && (
          <>
            <div className="dept-title">Select Department</div>

            <div className="dept-grid">
              {["IT", "Finance", "Sales", "Marketing", "Operations"].map((d) => (
                <button
                  key={d}
                  className={`dept-btn ${department === d ? "active" : ""}`}
                  onClick={() => setDepartment(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="role-hint">
          HR users share the same OTP • Admin uses a different OTP
        </div>

        <button
          className="primary"
          disabled={role === "HR" && !department}
          onClick={proceed}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
