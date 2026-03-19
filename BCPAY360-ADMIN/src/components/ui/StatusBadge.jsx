import React from "react";

const StatusBadge = ({ type, icon, label }) => {
    const getBadgeClass = () => {
        switch (type?.toLowerCase()) {
            case "success": return "modern-badge success";
            case "warning": return "modern-badge warning";
            case "info": return "modern-badge info";
            case "neutral": return "modern-badge neutral";
            default: return "modern-badge neutral";
        }
    };

    return (
        <span className={getBadgeClass()}>
            {icon && <span className="status-icon">{icon}</span>}
            {label}
        </span>
    );
};

export default StatusBadge;
