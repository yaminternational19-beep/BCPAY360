import React, { useEffect, useState, useRef, useCallback } from "react";
import "./EmpCode.css";
import { generateEmployeeCode } from "../../../api/master.api.js";
import { useBranch } from "../../../hooks/useBranch";
import { useToast } from "../../../context/ToastContext";
import { FaBarcode, FaCheckCircle, FaInfoCircle, FaSave } from "react-icons/fa";

const EmpCode = () => {
  const toast = useToast();
  const {
    branches,
    selectedBranch,
    changeBranch,
    branchStatus,
  } = useBranch();

  const [employeeCode, setEmployeeCode] = useState("");
  const [preview, setPreview] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(""); // show error once
  const hasFailed = useRef(false);                   // guard: stop retrying

  /* =========================================
     When branch changes → fetch emp code config
     ========================================= */
  useEffect(() => {
    // Reset guard whenever branch changes so a new branch gets a fresh attempt
    hasFailed.current = false;
    setFetchError("");

    if (!selectedBranch) {
      setEmployeeCode("");
      setPreview("");
      setExists(false);
      return;
    }

    const fetchEmpCode = async () => {
      // 🛑 Already failed for this branch — do NOT retry
      if (hasFailed.current) return;

      try {
        const res = await generateEmployeeCode({ branch_id: selectedBranch });

        if (res?.exists) {
          setEmployeeCode(res.employee_code);
          setExists(true);
        } else {
          setEmployeeCode("");
          setExists(false);
        }
      } catch (err) {
        hasFailed.current = true; // 🛑 Mark as failed — no more retries
        const msg = err?.message || "Failed to fetch employee code";
        setFetchError(msg);       // Show error once in the UI
        toast.error(msg);
        setEmployeeCode("");
        setExists(false);
      }
    };

    fetchEmpCode();
  }, [selectedBranch]); // ✅ toast intentionally excluded — it's a new ref each render

  /* =========================================
     Preview next employee code (frontend only)
     ========================================= */
  useEffect(() => {
    if (!employeeCode) {
      setPreview("");
      return;
    }

    const match = employeeCode.match(/(\d+)$/);
    if (!match) {
      setPreview("Invalid format");
      return;
    }

    const number = match[1];
    const prefix = employeeCode.slice(0, -number.length);

    try {
      const next =
        prefix + String(parseInt(number, 10) + 1).padStart(number.length, "0");
      setPreview(next);
    } catch (e) {
      setPreview("Error");
    }
  }, [employeeCode]);

  /* =========================================
     Save (Create / Update using SAME API)
     ========================================= */
  const handleSave = async () => {
    if (!selectedBranch || !employeeCode) {
      toast.error("Branch and employee code are required");
      return;
    }

    try {
      setLoading(true);

      await generateEmployeeCode({
        branch_id: selectedBranch,
        employee_code: employeeCode,
      });

      toast.success(`Employee code ${exists ? "updated" : "created"} successfully!`);
      setExists(true);
    } catch (err) {
      toast.error(err?.message || "Failed to save employee code");
    } finally {
      setLoading(false);
    }
  };

  if (branchStatus === "LOADING") {
    return (
      <div className="ec-loading-wrap">
        <div className="ec-spinner"></div>
        <p>Loading setup...</p>
      </div>
    );
  }

  // Show API error banner (only once — no retry)
  const errorBanner = fetchError ? (
    <div style={{
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#dc2626",
      borderRadius: "10px",
      padding: "12px 16px",
      marginBottom: "16px",
      fontSize: "0.9rem",
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      ⚠️ {fetchError}
    </div>
  ) : null;

  return (
    <div className="ec-page-container">
      <div className="ec-setup-card">
        {errorBanner}

        {/* Header Section */}
        <div className="ec-header-box">
          <div className="ec-icon-circle">
            <FaBarcode />
          </div>
          <div className="ec-header-text">
            <h2>Employee Code Setup</h2>
            <p>Define the sequential code format for new employee IDs</p>
          </div>
        </div>

        <div className="ec-card-body">
          {/* Branch Picker */}
          <div className="ec-form-section">
            <label className="ec-label">
              Target Branch <span className="ec-req">*</span>
            </label>
            <div className="ec-input-wrapper">
              <select
                className="ec-select"
                value={selectedBranch === null ? "" : selectedBranch}
                onChange={(e) => {
                  const val = e.target.value;
                  changeBranch(val ? Number(val) : null);
                }}
              >
                <option value="">-- Select Branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
            {!selectedBranch && (
              <p className="ec-hint">Please select a branch to view or configure its code format</p>
            )}
          </div>

          <div className="ec-split-layout">
            {/* Code Configuration */}
            <div className="ec-form-section">
              <label className="ec-label">
                Base Employee Code <span className="ec-req">*</span>
                {exists && <span className="ec-badge exists">Existing</span>}
                {!exists && selectedBranch && <span className="ec-badge new">New Setup</span>}
              </label>
              <div className="ec-input-wrapper">
                <input
                  className="ec-input"
                  placeholder="e.g. EMP2026001"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  disabled={!selectedBranch}
                />
              </div>
              <p className="ec-hint">Recommended: [BranchCode][Year][001]</p>
            </div>

            {/* Preview Section */}
            <div className={`ec-preview-box ${preview && !preview.includes("Invalid") ? 'active' : ''}`}>
              <div className="ec-preview-inner">
                <div className="ec-preview-label">Next Generation Preview</div>
                <div className="ec-preview-value">
                  {preview || (selectedBranch ? "Waiting for code..." : "Select branch first")}
                </div>
                {preview && !preview.includes("Invalid") && (
                  <div className="ec-preview-status">
                    <FaCheckCircle /> Valid Format Detected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="ec-guidelines">
            <div className="ec-guide-header">
              <FaInfoCircle /> Important Guidelines
            </div>
            <ul>
              <li>The code <strong>must end with a number</strong> (e.g., 001) for auto-incrementing.</li>
              <li>Changing this format will only affect <strong>new</strong> employees added after the update.</li>
              <li>Ensure the prefix is consistent with your company's naming convention.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="ec-footer">
          <button
            className="ec-btn-save"
            onClick={handleSave}
            disabled={loading || !selectedBranch || !employeeCode}
          >
            {loading ? (
              <span className="ec-loading-text">Saving Changes...</span>
            ) : (
              <>
                <FaSave /> {exists ? "Update Format Configuration" : "Initialize Code Format"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmpCode;
