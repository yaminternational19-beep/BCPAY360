import React from "react";
import "../module.css";

export const Badge = ({ children, variant = "neutral", className = "" }) => {
    // variants: neutral, success, warning, error, info, primary
    return (
        <span className={`ui-badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
};
