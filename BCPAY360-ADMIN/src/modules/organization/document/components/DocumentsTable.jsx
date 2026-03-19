import React from "react";
import "../styles/styleforms.css";
import { FaEdit, FaTrash, FaPowerOff, FaEye, FaBan } from "react-icons/fa";

const DocumentsTable = ({ data, loading, onEdit, onDelete, onToggleStatus }) => {
  if (loading) return <div className="gf-loading">Loading configuration…</div>;
  if (!data.length) return <div className="gf-empty">No documents found.</div>;

  return (
    <div className="gf-table-card">
      <table className="gf-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Document Name</th>
            <th>Description</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((f, i) => (
            <tr key={f.id}>
              <td>{i + 1}</td>
              <td><span className="gf-badge code">{f.documentCode}</span></td>
              <td style={{ fontWeight: 600 }}>{f.documentName}</td>
              <td style={{ maxWidth: '300px', fontSize: '13px', color: '#666' }}>
                {f.description || <span style={{ color: '#ccc', fontStyle: 'italic' }}>No description</span>}
              </td>
              <td>
                <div className="gf-actions">
                  <button
                    className="gf-btn-action edit"
                    onClick={() => onEdit(f)}
                    title="Edit Document"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="gf-btn-action delete"
                    onClick={() => onDelete(f)}
                    title="Delete Document"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentsTable;
