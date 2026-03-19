import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import "../../../styles/HRPermissions.css";
import {
  getHRList,
  getHRPermissions,
  saveHRPermissions,
} from "../../../api/master.api";
import { useToast } from "../../../context/ToastContext";

/* =====================================================
   PERMISSION CONFIG (SINGLE SOURCE OF TRUTH)
===================================================== */
const PERMISSION_GROUPS = [
  {
    key: "CORE",
    label: "Core Access",
    children: [
      { key: "DASHBOARD", label: "Dashboard Access" },
    ],
  },
  {
    key: "ORGANIZATION",
    label: "Organization Setup",
    children: [
      { key: "DEPARTMENTS", label: "Departments" },
      { key: "EMPLOYEE_TYPES", label: "Employee Types" },
      { key: "SHIFTS", label: "Shifts" },
      { key: "BRANCHES", label: "Branches" },
      { key: "HR_MANAGEMENT", label: "HR Management" },
      { key: "EMPLOYEE_CODE", label: "Employee Code" },
      { key: "GOVERNMENT_FORMS", label: "Government Forms" },
    ],
  },
  {
    key: "HR_MODULE",
    label: "Employee & HR Operations",
    children: [
      { key: "EMPLOYEE_MASTER", label: "Employee Master" },
      { key: "ATTENDANCE", label: "Attendance" },
      { key: "LEAVE_MASTER", label: "Leave Management" },
      { key: "PAYROLL", label: "Payroll Processing" },
      { key: "HOLIDAYS", label: "Holiday Calendar" },
    ],
  },
  {
    key: "FORMS",
    label: "Government Compliance Forms",
    children: [
      { key: "PF_FORMS", label: "Provident Fund (PF)" },
      { key: "ESIC_FORMS", label: "ESIC Forms" },
      { key: "FORM_16", label: "Form-16 (ITX)" },
      { key: "BONUS_ACT", label: "Bonus Act Forms" },
      { key: "LABOUR_LAW", label: "Labour Law / Attendance" },
      { key: "FACTORIES_ACT", label: "Factories Act" },
      { key: "GRATUITY_ACT", label: "Gratuity Act Forms" },
    ],
  },
  {
    key: "REPORTS",
    label: "Analytics & Reports",
    children: [
      { key: "EMPLOYEE_REPORTS", label: "Employee Analytics" },
      { key: "ATTENDANCE_REPORTS", label: "Attendance Reports" },
      { key: "LEAVE_REPORTS", label: "Leave Analytics" },
      { key: "SALARY_REPORTS", label: "Salary/Payroll Reports" },
    ],
  },
  {
    key: "SETTINGS",
    label: "Portal Settings & CMS",
    children: [
      { key: "MANAGE_CONTENT", label: "Manage Content (CMS)" },
      { key: "SUPPORT_TICKETS", label: "Help & Support" },
      { key: "FAQ_MANAGEMENT", label: "FAQ Management" },
      { key: "BROADCAST", label: "Manage Broadcasts" },
    ],
  },
];

/* =====================================================
   HELPERS
===================================================== */
const buildInitialState = () => {
  const state = {};
  PERMISSION_GROUPS.forEach((g) =>
    g.children.forEach((c) => (state[c.key] = false))
  );
  return state;
};

export default function HRPermissions() {
  const toast = useToast();
  const { hrId } = useParams();
  const navigate = useNavigate();

  const [selectedHR, setSelectedHR] = useState(null);
  const [permissions, setPermissions] = useState(buildInitialState());
  const [loading, setLoading] = useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getHRList();
        const list = Array.isArray(res?.data) ? res.data : [];
        const hr = list.find((h) => h.id === Number(hrId));

        if (!hr) {
          toast.error("HR profile not found");
          navigate("/hr-management", { replace: true });
          return;
        }
        setSelectedHR(hr);

        const permRes = await getHRPermissions(hr.id);
        const permData = permRes?.data;
        if (Array.isArray(permData)) {
          setPermissions((prev) => {
            const updated = { ...prev };
            permData.forEach((p) => {
              if (updated.hasOwnProperty(p.module_key)) {
                updated[p.module_key] = p.allowed === 1 || p.allowed === true;
              }
            });
            return updated;
          });
        }
      } catch (err) {
        toast.error("Failed to load permission details");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hrId, navigate, toast]);

  /* =====================================================
     HANDLERS
  ===================================================== */
  const toggleItem = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (group, value) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      group.children.forEach((c) => {
        updated[c.key] = value;
      });
      return updated;
    });
  };

  const toggleAll = (value) => {
    setPermissions((prev) => {
      const updated = {};
      Object.keys(prev).forEach((k) => (updated[k] = value));
      return updated;
    });
  };

  /* =====================================================
     CHECK STATES
  ===================================================== */
  const isGroupChecked = (group) =>
    group.children.every((c) => permissions[c.key]);

  const isGroupIndeterminate = (group) =>
    group.children.some((c) => permissions[c.key]) &&
    !isGroupChecked(group);

  const isAllChecked = () =>
    Object.values(permissions).every(Boolean);

  /* =====================================================
     SAVE
  ===================================================== */
  const save = async () => {
    setLoading(true);
    try {
      const payload = Object.entries(permissions).map(
        ([module_key, allowed]) => ({ 
          module_key, 
          allowed: allowed ? 1 : 0 
        })
      );

      await saveHRPermissions(selectedHR.id, {
        permissions: payload,
      });

      toast.success("Permissions updated successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="hp-permissions-container">
      <div className="hp-header-section">
        <button className="hp-back-btn" onClick={() => navigate("/hr-management")}>
          <FaArrowLeft />
        </button>
        <div className="hp-title-group">
          <h2>Access Permissions</h2>
          <p>Manage module-level access for <strong>{selectedHR?.full_name || "HR Profile"}</strong></p>
        </div>
      </div>

      <div className="hp-meta-card">
        <div className="hp-meta-info">
          <span>Code: <strong>{selectedHR?.hr_code}</strong></span>
          <span>Branch: <strong>{selectedHR?.branch_name}</strong></span>
        </div>
        <label className="hp-select-all-label">
          <input
            type="checkbox"
            checked={isAllChecked()}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          Grant All Permissions
        </label>
      </div>

      <div className="hp-permissions-grid">
        {PERMISSION_GROUPS.map((group) => (
          <div className="hp-group-card" key={group.key}>
            <div className="hp-group-header">
              <label className="hp-group-toggle">
                <input
                  type="checkbox"
                  checked={isGroupChecked(group)}
                  ref={(el) => { if (el) el.indeterminate = isGroupIndeterminate(group); }}
                  onChange={(e) => toggleGroup(group, e.target.checked)}
                />
                {group.label}
              </label>
            </div>

            <div className="hp-items-list">
              {group.children.map((item) => (
                <label key={item.key} className={`hp-item ${permissions[item.key] ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={permissions[item.key]}
                    onChange={() => toggleItem(item.key)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hp-footer-actions">
        <button className="hp-btn-save" onClick={save} disabled={loading}>
          <FaSave /> {loading ? "Saving..." : "Save Change Permissions"}
        </button>
      </div>
    </div>
  );
}
