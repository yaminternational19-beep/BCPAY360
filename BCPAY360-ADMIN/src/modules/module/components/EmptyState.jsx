import React from "react";
import { FaInbox } from "react-icons/fa";
import "../module.css";

export const EmptyState = ({
    title = "No Data Found",
    description = "There are no items to display at the moment.",
    action,
    icon
}) => {
    return (
        <div className="ui-empty-state">
            <div className="ui-empty-icon">
                {icon || <FaInbox />}
            </div>
            <h3 className="ui-empty-title">{title}</h3>
            <p className="ui-empty-desc">{description}</p>
            {action && <div className="ui-empty-action">{action}</div>}
        </div>
    );
};
