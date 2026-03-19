import { useEffect, useState } from "react";
import { FaTimes, FaSave, FaBan } from "react-icons/fa";
import { useToast } from "../../../context/ToastContext";
import "../../../styles/Branch.css";

const EMPTY_FORM = {
  branch_code: "",
  branch_name: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  is_active: true,
};

const BranchForm = ({ initial, onSave, onClose }) => {
  const isEdit = Boolean(initial);
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (initial) {
      setForm({
        ...EMPTY_FORM,
        ...initial,
        is_active: initial.is_active !== undefined ? initial.is_active : true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [initial]);

  const change = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation with descriptive toasts
    if (!form.branch_name.trim()) {
      return toast.error("Please enter the branch name then click on the save button");
    }
    if (!form.location.trim()) {
      return toast.error("Please enter the branch location then click on the save button");
    }

    const payload = {
      ...form,
      is_active: Boolean(form.is_active),
    };

    onSave(payload);
    toast.success(isEdit ? "Branch updated successfully" : "Branch created successfully");
  };

  return (
    <div className="bf-modal-backdrop" onClick={onClose}>
      <div className="bf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bf-modal-header">
          <h3>{isEdit ? "Edit Branch Details" : "Register New Branch"}</h3>
          <button onClick={onClose} className="bf-close-btn" title="Close">
            <FaTimes />
          </button>
        </div>

        <form className="bf-form" onSubmit={handleSubmit}>
          <div className="bf-form-grid">
            <div className="bf-form-group">
              <label>
                Branch Name <span className="bf-field-required">*</span>
              </label>
              <input
                placeholder="Enter branch name"
                value={form.branch_name}
                onChange={(e) => change("branch_name", e.target.value)}
              />
            </div>
            <div className="bf-form-group">
              <label>Branch Code</label>
              <input
                placeholder="Unique code (e.g. BR001)"
                value={form.branch_code}
                onChange={(e) => change("branch_code", e.target.value)}
              />
            </div>
          </div>

          <div className="bf-form-grid">
            <div className="bf-form-group">
              <label>
                Location <span className="bf-field-required">*</span>
              </label>
              <input
                placeholder="City or region"
                value={form.location}
                onChange={(e) => change("location", e.target.value)}
              />
            </div>
            <div className="bf-form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => change("phone", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="bf-form-group">
            <label>Full Address</label>
            <textarea
              placeholder="Provide complete physical address"
              value={form.address}
              onChange={(e) => change("address", e.target.value)}
              rows={3}
            />
          </div>

          <div className="bf-form-grid">
            <div className="bf-form-group">
              <label>Official Email</label>
              <input
                type="email"
                placeholder="branch@company.com"
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
              />
            </div>
            <div className="bf-form-group" style={{ justifyContent: 'center' }}>
              <label className="bf-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => change("is_active", e.target.checked)}
                />
                <span className="bf-checkbox-text">Active Branch</span>
              </label>
            </div>
          </div>

          <div className="bf-form-footer">
            <button type="button" className="bf-btn bf-btn-secondary" onClick={onClose}>
              <FaBan /> Cancel
            </button>
            <button type="submit" className="bf-btn bf-btn-primary">
              <FaSave /> {isEdit ? "Update Branch" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchForm;

