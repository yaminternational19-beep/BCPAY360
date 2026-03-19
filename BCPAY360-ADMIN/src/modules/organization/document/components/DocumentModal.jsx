import React, { useEffect, useState } from "react";
import "../styles/styleforms.css";
import { useToast } from "../../../../context/ToastContext.jsx";
import { FaFileInvoice, FaTimes } from "react-icons/fa";

const DocumentModal = ({
  isOpen,
  onClose,
  onSave,
  editData = null,
  loading = false
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    documentName: "",
    documentCode: "",
    description: ""
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        documentName: editData.documentName || "",
        documentCode: editData.documentCode || "",
        description: editData.description || ""
      });
    } else {
      setFormData({
        documentName: "",
        documentCode: "",
        description: ""
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.documentName || (!editData && !formData.documentCode)) {
      toast.error("Document Name and Code are mandatory");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="gf-modal-overlay" onClick={onClose}>
      <div className="gf-modal" onClick={e => e.stopPropagation()}>
        <div className="gf-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaFileInvoice style={{ color: "var(--gf-primary)", fontSize: "20px" }} />
            <h3>{editData ? "Edit Document" : "Setup Document"}</h3>
          </div>
          <button className="gf-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="gf-modal-body">
          {!editData && (
            <div className="gf-form-group">
              <label>Document Code <span style={{ color: "red" }}>*</span></label>
              <input name="documentCode" placeholder="e.g. DOC-12A" value={formData.documentCode} onChange={handleChange} />
            </div>
          )}
          <div className="gf-form-group">
            <label>Document Name <span style={{ color: "red" }}>*</span></label>
            <input name="documentName" placeholder="e.g. PF Policy" value={formData.documentName} onChange={handleChange} />
          </div>
          <div className="gf-form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Provide brief details about this document..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="gf-modal-footer">
          <button onClick={onClose} className="gf-btn-cancel">Dismiss</button>
          <button onClick={handleSubmit} className="gf-btn-save" disabled={loading}>
            {loading ? "Processing..." : (editData ? "Update Document" : "Save Document")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
