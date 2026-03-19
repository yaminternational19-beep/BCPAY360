import React, { useEffect, useMemo, useState } from "react";
import {
  getCompanyDocuments,
  createCompanyDocument,
  updateCompanyDocument,
  deleteCompanyDocument
} from "../../../../api/master.api.js";

import { useToast } from "../../../../context/ToastContext.jsx";
import DocumentsTable from "../components/DocumentsTable";
import DocumentModal from "../components/DocumentModal";

import "../styles/styleforms.css";


/* normalize backend response */
const normalizeDocument = (f) => ({
  id: f.id,
  documentCode: f.document_code || "",
  documentName: f.document_name || "",
  description: f.description || "",
  createdAt: f.created_at || ""
});

const Documents = () => {
  const toast = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [saving, setSaving] = useState(false);

  /* fetch */
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await getCompanyDocuments();
      setDocuments((res?.data || []).map(normalizeDocument));
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  /* search */
  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter(f =>
      f.documentName.toLowerCase().includes(q) ||
      f.documentCode.toLowerCase().includes(q)
    );
  }, [documents, search]);

  /* save */
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingDoc) {
        // PATCH only document_name and description
        await updateCompanyDocument(editingDoc.id, {
          document_name: payload.documentName,
          description: payload.description || ""
        });
        toast.success("Document updated");
      } else {
        // POST everything
        await createCompanyDocument({
          document_code: payload.documentCode,
          document_name: payload.documentName,
          description: payload.description || ""
        });
        toast.success("Document created");
      }

      setModalOpen(false);
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err?.message || "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm("Delete this document permanently?")) return;
    try {
      await deleteCompanyDocument(doc.id);
      toast.success("Document deleted");
      fetchDocuments();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="gf-container">
      <div className="gf-header">
        <h2>Company Documents Setup</h2>
        <button className="gf-btn-new" onClick={() => setModalOpen(true)}>
          Add New Document
        </button>
      </div>

      <div className="gf-search-wrap">
        <input
          className="gf-search-input"
          placeholder="Search documents by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DocumentsTable
        data={filteredDocs}
        loading={loading}
        onEdit={(f) => {
          setEditingDoc(f);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />

      <DocumentModal
        isOpen={modalOpen}
        editData={editingDoc}
        loading={saving}
        onClose={() => {
          setModalOpen(false);
          setEditingDoc(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default Documents;
