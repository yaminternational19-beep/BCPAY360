import React from "react";
import "../module.css";

export const Card = ({ children, className = "", onClick, ...props }) => {
    return (
        <div
            className={`ui-card ${onClick ? "interactive" : ""} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="ui-card-header">
        <div className="ui-card-title-group">
            <h3 className="ui-card-title">{title}</h3>
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="ui-card-action">{action}</div>}
    </div>
);

export const CardBody = ({ children, className = "" }) => (
    <div className={`ui-card-body ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = "" }) => (
    <div className={`ui-card-footer ${className}`}>
        {children}
    </div>
);
