import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaPlus } from "react-icons/fa";

export default function NoBranchState({ moduleName }) {
    const navigate = useNavigate();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            border: "1px dashed #e5e7eb",
            margin: "20px"
        }}>
            <div style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#eff6ff",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                color: "#2563eb",
                fontSize: "24px"
            }}>
                <FaBuilding />
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1f2937", marginBottom: "8px" }}>
                No Branches Found
            </h3>

            <p style={{ color: "#6b7280", maxWidth: "400px", marginBottom: "24px", lineHeight: "1.5" }}>
                Before accessing <strong>{moduleName || "this module"}</strong>, you need to set up your organization structure. Please create at least one branch to continue.
            </p>

            <button
                onClick={() => navigate("/organization/branches")} // Assumed route
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
            >
                <FaPlus size={12} /> Create First Branch
            </button>
        </div>
    );
}
