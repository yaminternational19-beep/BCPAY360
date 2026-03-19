import React from "react";

const ActionButtons = ({ actions }) => {
    return (
        <div className="form-actions">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    className={`action-btn ${action.type || ""}`}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    title={action.title}
                >
                    {action.icon}
                </button>
            ))}
        </div>
    );
};

export default ActionButtons;
