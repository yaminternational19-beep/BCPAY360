import React from "react";
import { FaDownload } from "react-icons/fa";

const PageHeader = ({ title, subtitle, actions }) => {
    return (
        <header className="page-header">
            <div className="header-left">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>

            <div className="header-actions">
                {actions}
            </div>
        </header>
    );
};

export default PageHeader;
