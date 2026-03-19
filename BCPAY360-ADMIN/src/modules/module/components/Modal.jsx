import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "../module.css";

export const Modal = ({ isOpen, onClose, title, children, size = "medium", footer }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="ui-modal-overlay" onClick={onClose}>
            <div
                className={`ui-modal-content size-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ui-modal-header">
                    <h3>{title}</h3>
                    <button className="ui-close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="ui-modal-body">
                    {children}
                </div>
                {footer && <div className="ui-modal-footer">{footer}</div>}
            </div>
        </div>
    );
};
