import React from "react";
import { FaSpinner } from "react-icons/fa";
import "../module.css";

export const Button = ({
    children,
    variant = "primary",  // primary, secondary, danger, ghost, outline
    size = "medium",      // small, medium, large
    isLoading = false,
    startIcon,
    endIcon,
    disabled,
    className = "",
    style = {},
    ...props
}) => {
    // Injecting smaller sizes via inline styles as requested
    const sizeStyles = {
        small: { padding: "4px 10px", fontSize: "11px" },
        medium: { padding: "8px 16px", fontSize: "13px" },
        large: { padding: "10px 20px", fontSize: "15px" }
    };

    const combinedStyle = {
        ...sizeStyles[size],
        ...style
    };

    return (
        <button
            className={`ui-btn btn-${variant} btn-${size} ${className}`}
            disabled={disabled || isLoading}
            style={combinedStyle}
            {...props}
        >
            {isLoading && <FaSpinner className="spinner-icon" />}
            {!isLoading && startIcon && <span className="btn-icon-start">{startIcon}</span>}
            {children}
            {!isLoading && endIcon && <span className="btn-icon-end">{endIcon}</span>}
        </button>
    );
};
