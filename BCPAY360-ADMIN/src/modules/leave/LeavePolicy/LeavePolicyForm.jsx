import React, { useEffect, useState } from "react";
import "../../../styles/LeaveManagement.css";

const EMPTY_FORM = {
  leave_code: "",
  leave_name: "",
  annual_quota: "",
  is_paid: 1,
  allow_carry_forward: 0,
  max_carry_forward: ""
};

export default function LeavePolicyForm({ initialData, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setForm({
        leave_code: initialData.leave_code || "",
        leave_name: initialData.leave_name || "",
        annual_quota: initialData.annual_quota ?? "",
        is_paid: initialData.is_paid ?? 1,
        allow_carry_forward: initialData.allow_carry_forward ?? 0,
        max_carry_forward: initialData.max_carry_forward ?? ""
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value
    }));
  };

  const submit = async () => {
    if (!form.leave_code || !form.leave_name || form.annual_quota === "") {
      alert("Leave Code, Name and Annual Quota are required");
      return;
    }

    await onSave({
      ...form,
      max_carry_forward: form.allow_carry_forward
        ? Number(form.max_carry_forward || 0)
        : null
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? "Edit Leave Type" : "Create Leave Type"}</h3>

        <div className="form-grid">
          <input
            name="leave_code"
            placeholder="Leave Code (EL)"
            value={form.leave_code}
            onChange={handleChange}
            disabled={isEdit}
          />

          <input
            name="leave_name"
            placeholder="Leave Name"
            value={form.leave_name}
            onChange={handleChange}
          />

          <input
            type="number"
            name="annual_quota"
            placeholder="Annual Quota"
            value={form.annual_quota}
            onChange={handleChange}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              name="is_paid"
              checked={form.is_paid === 1}
              onChange={handleChange}
            />
            Paid Leave
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              name="allow_carry_forward"
              checked={form.allow_carry_forward === 1}
              onChange={handleChange}
            />
            Allow Carry Forward
          </label>

          {form.allow_carry_forward === 1 && (
            <input
              type="number"
              name="max_carry_forward"
              placeholder="Max Carry Forward"
              value={form.max_carry_forward}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={submit}>
            {isEdit ? "Update" : "Save"}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
