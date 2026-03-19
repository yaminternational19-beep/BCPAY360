import React from "react";
import { FaSpinner } from "react-icons/fa";
import "../module.css";

export const Loader = ({ text = "Loading...", size = "medium" }) => {
    return (
        <div className={`ui-loader loader-${size}`}>
            <FaSpinner className="spinner-icon" />
            {text && <span className="loader-text">{text}</span>}
        </div>
    );
};
