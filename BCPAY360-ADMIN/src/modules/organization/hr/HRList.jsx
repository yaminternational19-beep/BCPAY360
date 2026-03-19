import React, { useEffect, useMemo, useState } from "react";
import "../../../styles/AddHR.css";
import {
  getHRList,
  toggleHRStatus,
  deleteHR,
} from "../../../api/master.api";
import { useBranch } from "../../../hooks/useBranch";
import { useToast } from "../../../context/ToastContext";
import HRForm from "./HRForm";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { FaEdit, FaUserLock, FaPowerOff, FaTrash } from "react-icons/fa";

export default function HRList() {
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem("auth_user"));
  const navigate = useNavigate();

  if (user?.role !== "COMPANY_ADMIN") {
    return <p className="hint">Access denied</p>;
  }

  // USE GLOBAL BRANCH CONTEXT
  const {
    branches,
    selectedBranch,
    changeBranch,
  } = useBranch();

  const [hrs, setHrs] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingHR, setEditingHR] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
  });

  /* =========================
     LOAD DATA
  ========================= */
  const loadHRs = async () => {
    try {
      const res = await getHRList();
      setHrs(res?.data || []);
    } catch (err) {
      toast.error("Failed to load HR profiles");
    }
  };

  useEffect(() => {
    loadHRs();
  }, []);

  /* =========================
     FILTERING
  ========================= */
  const filteredHRs = useMemo(() => {
    return hrs.filter((hr) => {
      // Filter by Global Selected Branch
      if (
        selectedBranch &&
        Number(hr.branch_id) !== Number(selectedBranch)
      ) {
        return false;
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          hr.hr_code?.toLowerCase().includes(s) ||
          hr.full_name?.toLowerCase().includes(s) ||
          hr.email?.toLowerCase().includes(s) ||
          (hr.phone_number || hr.phone)?.[0] === undefined ? false : (hr.phone_number || hr.phone).includes(s);

        if (!match) return false;
      }

      if (filters.status !== "ALL") {
        const active = filters.status === "ACTIVE";
        if (Boolean(hr.is_active) !== active) return false;
      }

      return true;
    });
  }, [hrs, filters, selectedBranch]);

  /* =========================
     EXPORT
  ========================= */
  const exportToExcel = () => {
    if (!selectedIds.length) {
      return toast.info("Please select the HR profiles you want to export");
    }

    const dataToExport = filteredHRs.filter((hr) =>
      selectedIds.includes(hr.id)
    );

    if (!dataToExport.length) {
      return toast.info("No selected data matching current filters available to export");
    }

    const rows = dataToExport.map((hr) => ({
      "HR Code": hr.hr_code,
      "Full Name": hr.full_name,
      Email: hr.email,
      Phone: `${hr.country_code} ${hr.phone_number}`,
      Branch: hr.branch_name,
      Location: hr.job_location || "N/A",
      Gender: hr.gender || "N/A",
      "Experience (Yrs)": hr.experience_years,
      "Joining Date": hr.joining_date ? new Date(hr.joining_date).toLocaleDateString('en-GB') : "N/A",
      "Date of Birth": hr.dob ? new Date(hr.dob).toLocaleDateString('en-GB') : "N/A",
      "Emergency Contact Name": hr.emergency_contact_name || "N/A",
      "Emergency Contact Phone": `${hr.emergency_country_code || ""} ${hr.emergency_contact_number || ""}`.trim() || "N/A",
      Remarks: hr.remarks || "N/A",
      Status: hr.is_active ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HRs");

    XLSX.writeFile(workbook, "Selected_HR_List.xlsx");
    toast.success(`${dataToExport.length} HR records exported successfully`);
  };

  const handleToggle = async (hr) => {
    try {
      await toggleHRStatus(hr.id);
      toast.success(`HR ${hr.is_active ? "disabled" : "enabled"} successfully`);
      loadHRs();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this HR profile? This action cannot be undone.")) return;
    try {
      await deleteHR(id);
      toast.success("HR profile deleted successfully");
      loadHRs();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const [selectedIds, setSelectedIds] = useState([]);

  /* =========================
     SELECTION LOGIC
  ========================= */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredHRs.map((hr) => hr.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="add-hr-page">
      <div className="page-header">
        <h2>HR Management</h2>
        <div className="header-actions" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="primary"
            style={{ width: "fit-content", whiteSpace: "nowrap" }}
            onClick={() => {
              setEditingHR(null);
              setShowForm(true);
            }}
          >
            Add HR
          </button>
          <button className="secondary" onClick={exportToExcel} style={{ width: "fit-content", whiteSpace: "nowrap" }}>
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <select
          value={selectedBranch === null ? "ALL" : selectedBranch}
          onChange={(e) => {
            const val = e.target.value;
            changeBranch(val === "ALL" ? null : Number(val));
          }}
        >
          {branches.length > 1 && (
            <option value="ALL">All Branches</option>
          )}
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branch_name}
            </option>
          ))}
        </select>

        <input
          placeholder="Search HR code / name / email / phone"
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
        />

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: e.target.value }))
          }
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* HR TABLE */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
            <th className="th-checkbox">
              <input
                type="checkbox"
                checked={filteredHRs.length > 0 && selectedIds.length === filteredHRs.length}
                onChange={handleSelectAll}
              />
            </th>
            <th>HR Code</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Branch</th>
            <th>Location</th>
            <th>Gender</th>
            <th>Exp</th>
            <th>Join Date</th>
            <th>DOB</th>
            <th>Status</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredHRs.map((hr) => (
            <tr key={hr.id}>
              {/* Checkbox */}
              <td className="td-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(hr.id)}
                  onChange={() => handleSelectRow(hr.id)}
                />
              </td>

              {/* HR Code */}
              <td>
                <span className="badge code">{hr.hr_code}</span>
              </td>

              {/* Name */}
              <td style={{ fontWeight: 600 }}>{hr.full_name}</td>

              {/* Email */}
              <td>{hr.email}</td>

              {/* Phone */}
              <td>{hr.country_code} {hr.phone_number}</td>

              {/* Branch */}
              <td>{hr.branch_name}</td>

              {/* Location */}
              <td>{hr.job_location || "—"}</td>

              {/* Gender */}
              <td>{hr.gender}</td>

              {/* Experience */}
              <td>{hr.experience_years} Yr</td>

              {/* Joining Date */}
              <td>
                {hr.joining_date ? new Date(hr.joining_date).toLocaleDateString('en-GB') : "—"}
              </td>

              {/* DOB */}
              <td>
                {hr.dob ? new Date(hr.dob).toLocaleDateString('en-GB') : "—"}
              </td>

              {/* Status */}
              <td>
                <span className={`status-badge ${hr.is_active ? "active" : "inactive"}`}>
                  {hr.is_active ? "Active" : "Inactive"}
                </span>
              </td>

              {/* Actions */}
              <td className="row-actions">
                <button
                  title="Edit HR"
                  onClick={() => {
                    setEditingHR(hr);
                    setShowForm(true);
                  }}
                >
                  <FaEdit />
                </button>

                <button
                  title="Permissions"
                  onClick={() => navigate(`/hr-management/${hr.id}/permissions`)}
                >
                  <FaUserLock />
                </button>

                <button 
                   title={hr.is_active ? "Deactivate" : "Activate"}
                   onClick={() => handleToggle(hr)}
                >
                  <FaPowerOff style={{ color: hr.is_active ? "#10b981" : "#ef4444" }} />
                </button>

                <button
                  className="danger"
                  title="Delete"
                  onClick={() => handleDelete(hr.id)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}

          {!filteredHRs.length && (
            <tr>
              <td colSpan={13} className="empty-state">
                No HR profiles match your criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <HRForm
          initialData={editingHR}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadHRs();
          }}
        />
      )}
    </div>
  );
}
