import React, { useEffect, useState } from "react";
import "../styles/Holidays.css";

/**
 * ENUM-SAFE reason types
 * label -> UI
 * value -> DB ENUM
 */
const REASON_TYPES = [
    { label: "National Holiday", value: "NATIONAL" },
    { label: "Weekend Off", value: "WEEKEND" },
    { label: "Festival", value: "FESTIVAL" },
    { label: "Bundh / Strike", value: "BUNDH" },
    { label: "Special Occasion", value: "SPECIAL" },
    { label: "Other", value: "OTHER" },
];

const HolidayModal = ({
    isOpen,
    onClose,
    date,
    holidayData,
    onSave,
    onRemove,
    isBulk,
    bulkLabel,
    isLoading = false,
}) => {
    const [reasonType, setReasonType] = useState("");
    const [reasonText, setReasonText] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        if (holidayData) {
            setReasonType(holidayData.reasonType || "");
            setReasonText(holidayData.reasonText || "");
        } else {
            setReasonType("");
            setReasonText("");
        }
    }, [isOpen, holidayData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!reasonType || !reasonText.trim()) return;
        onSave({ reasonType, reasonText: reasonText.trim() });
    };

    const title = isBulk
        ? `Apply to ${bulkLabel}`
        : holidayData
            ? "Edit Holiday"
            : "Mark Holiday";

    return (
        <div className="holiday-modal-overlay">
            <div className="holiday-modal-content">
                <h3>{title}</h3>

                {!isBulk && <p><strong>Date:</strong> {date}</p>}
                {isBulk && <p className="bulk-info">This will apply to all selected dates.</p>}

                <div className="modal-body">
                    <div className="form-group">
                        <label>Reason Type *</label>
                        <select
                            value={reasonType}
                            onChange={(e) => setReasonType(e.target.value)}
                            className="modal-select"
                        >
                            <option value="">Select Reason</option>
                            {REASON_TYPES.map(r => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Reason Description *</label>
                        <input
                            type="text"
                            value={reasonText}
                            onChange={(e) => setReasonText(e.target.value)}
                            placeholder="Eg: Republic Day"
                            className="modal-input"
                        />
                    </div>
                </div>

                <div className="modal-actions">
                    <div className="action-row">
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={!reasonType || !reasonText.trim() || isLoading}
                        >
                            {isBulk ? "Apply" : holidayData ? "Update" : "Save"}
                        </button>

                        {holidayData && !isBulk && (
                            <button
                                className="btn-danger"
                                onClick={onRemove}
                                disabled={isLoading}
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
