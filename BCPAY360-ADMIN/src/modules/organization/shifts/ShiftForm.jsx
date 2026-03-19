import React, { useState, useEffect, useRef } from "react";
import { FaClock, FaHourglassHalf, FaSave, FaBan } from "react-icons/fa";
import { useToast } from "../../../context/ToastContext";
import "../../../styles/Shifts.css";

const CustomTimePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // value is expected in "HH:mm" (24h)
  const [h24, m] = (value || "09:00").split(":");
  const hour24 = parseInt(h24);
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTimeChange = (newHour12, newMinute, newAmpm) => {
    let finalH24 = parseInt(newHour12);
    if (newAmpm === "PM" && finalH24 < 12) finalH24 += 12;
    if (newAmpm === "AM" && finalH24 === 12) finalH24 = 0;

    const formattedH24 = finalH24.toString().padStart(2, "0");
    const formattedM = newMinute.toString().padStart(2, "0");
    onChange(`${formattedH24}:${formattedM}`);
  };

  const formatDisplayTime = (val) => {
    if (!val) return "--:--";
    const [h, min] = val.split(":");
    const hNum = parseInt(h);
    const ap = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 || 12;
    return `${h12}:${min} ${ap}`;
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  return (
    <div className="sf-input-group" ref={containerRef}>
      <label>{label}</label>
      <div
        className={`sf-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{formatDisplayTime(value)}</span>
        <FaClock style={{ color: "var(--primary)" }} />
      </div>

      {isOpen && (
        <div className="sf-picker-dropdown">
          <div className="sf-picker-layout">
            {/* AM/PM Switch */}
            <div className="sf-mode-selector">
              <button
                type="button"
                className={`sf-mode-btn ${ampm === "AM" ? 'active' : ''}`}
                onClick={() => handleTimeChange(hour12, m, "AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={`sf-mode-btn ${ampm === "PM" ? 'active' : ''}`}
                onClick={() => handleTimeChange(hour12, m, "PM")}
              >
                PM
              </button>
            </div>

            {/* Hours Grid */}
            <div className="sf-grid-section">
              <span className="sf-grid-section-title">Hours</span>
              <div className="sf-time-grid">
                {hours.map(h => (
                  <button
                    key={h}
                    type="button"
                    className={`sf-grid-item-btn ${hour12 === h ? 'selected' : ''}`}
                    onClick={() => handleTimeChange(h, m, ampm)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Grid */}
            <div className="sf-grid-section">
              <span className="sf-grid-section-title">Minutes</span>
              <div className="sf-time-grid">
                {minutes.map(min => (
                  <button
                    key={min}
                    type="button"
                    className={`sf-grid-item-btn ${m === min ? 'selected' : ''}`}
                    onClick={() => handleTimeChange(hour12, min, ampm)}
                  >
                    {min}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="sf-btn-solid"
              style={{ padding: '8px', fontSize: '12px', width: '100%' }}
              onClick={() => setIsOpen(false)}
            >
              Set Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ShiftForm({ onSave, onCancel, initialData, selectedBranch, user, loading }) {
  const toast = useToast();
  const [shiftData, setShiftData] = useState({
    shift_name: "",
    start_time: "09:00",
    end_time: "18:00",
    description: "",
  });
  const [duration, setDuration] = useState("");

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";

    let [startH, startM] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);

    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;

    let diff = endTotal - startTotal;
    if (diff < 0) diff += 24 * 60; // Handle midnight crossover

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;

    if (mins === 0) return `${hours} hrs`;
    return `${hours} hrs ${mins} mins`;
  };

  useEffect(() => {
    if (initialData) {
      setShiftData({
        shift_name: initialData.shift_name || initialData.name || "",
        start_time: initialData.start_time || "09:00",
        end_time: initialData.end_time || "18:00",
        description: initialData.description || "",
      });
    } else {
      setShiftData({
        shift_name: "",
        start_time: "09:00",
        end_time: "18:00",
        description: "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    setDuration(calculateDuration(shiftData.start_time, shiftData.end_time));
  }, [shiftData.start_time, shiftData.end_time]);

  const handleFormSubmit = () => {
    if (!shiftData.shift_name.trim()) {
      return toast.error("Shift name is missing");
    }
    if (!shiftData.start_time) {
      return toast.error("Start time is missing");
    }
    if (!shiftData.end_time) {
      return toast.error("End time is missing");
    }

    onSave(shiftData);
  };

  return (
    <div className="sf-redesign-container">
      <div className="sf-form-card-main">
        <h3>{initialData ? "Edit Shift Details" : "Create New Shift"}</h3>

        <div className="sf-input-group">
          <label>Shift Name</label>
          <input
            className="sf-form-input"
            placeholder="e.g., General Shift, Night Shift"
            value={shiftData.shift_name}
            onChange={(e) =>
              setShiftData({ ...shiftData, shift_name: e.target.value })
            }
          />
        </div>

        <div className="sf-row-wrapper">
          <CustomTimePicker
            label="Start Time"
            value={shiftData.start_time}
            onChange={(time) => setShiftData({ ...shiftData, start_time: time })}
          />
          <CustomTimePicker
            label="End Time"
            value={shiftData.end_time}
            onChange={(time) => setShiftData({ ...shiftData, end_time: time })}
          />
        </div>

        {duration && (
          <div className="sf-duration-wrap">
            <div className="sf-duration-pill">
              <FaHourglassHalf size={14} />
              <span>Shift Duration: {duration}</span>
            </div>
          </div>
        )}

        <div className="sf-input-group">
          <label>Description (Optional)</label>
          <textarea
            className="sf-form-input"
            placeholder="Briefly describe this shift..."
            value={shiftData.description}
            onChange={(e) =>
              setShiftData({ ...shiftData, description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="sf-actions-footer">
          <button className="sf-btn-outline" onClick={onCancel} disabled={loading}>
            <FaBan /> Cancel
          </button>
          <button
            className="sf-btn-solid"
            onClick={handleFormSubmit}
            disabled={loading}
          >
            <FaSave /> {initialData ? "Update Shift" : "Add Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}
