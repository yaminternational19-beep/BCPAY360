import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaQuestionCircle } from "react-icons/fa";
import { Button, Modal, EmptyState, Loader } from "./components";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "../../api/master.api";
import "./module.css";

export default function FAQ() {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ question: "", answer: "" });
    const [expandedId, setExpandedId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch FAQs on component mount
    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setIsLoading(true);
        try {
            const response = await getFaqs();

            // Handle both response formats
            if (response.success) {
                setFaqs(response.data || []);
            } else if (Array.isArray(response)) {
                // Direct array response
                setFaqs(response);
            } else if (response.data) {
                // Response with data property but no success flag
                setFaqs(response.data);
            } else {
                alert("Failed to load FAQs: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to load FAQs: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (faq = null) => {
        if (faq) {
            setEditingId(faq.id);
            setFormData({ question: faq.question, answer: faq.answer });
        } else {
            setEditingId(null);
            setFormData({ question: "", answer: "" });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

        try {
            const response = await deleteFaq(id);
            // Handle both response formats
            if (response.success || response.success === undefined) {
                // Remove from state instantly
                setFaqs(faqs.filter((f) => f.id !== id));
                if (expandedId === id) setExpandedId(null);
                alert("FAQ deleted successfully!");
            } else {
                alert("Failed to delete FAQ: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to delete FAQ: " + error.message);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!formData.question || !formData.question.trim()) {
            alert("Question is required");
            return;
        }
        if (!formData.answer || !formData.answer.trim()) {
            alert("Answer is required");
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                // Update existing FAQ
                const response = await updateFaq(editingId, formData);
                // Handle both response formats
                if (response.success || response.success === undefined) {
                    // Refresh the list
                    await fetchFaqs();
                    alert("FAQ updated successfully!");
                    setIsModalOpen(false);
                } else {
                    alert("Failed to update FAQ: " + (response.message || "Unknown error"));
                }
            } else {
                // Create new FAQ
                const response = await createFaq(formData);
                // Handle both response formats
                if (response.success || response.success === undefined) {
                    // Refresh the list
                    await fetchFaqs();
                    alert("FAQ created successfully!");
                    setIsModalOpen(false);
                } else {
                    alert("Failed to create FAQ: " + (response.message || "Unknown error"));
                }
            }
        } catch (error) {
            alert("Failed to save FAQ: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isLoading) {
        return (
            <div className="module-container flex-center" style={{ minHeight: "400px" }}>
                <Loader />
            </div>
        );
    }

    return (
        <div className="module-container">
            <div className="module-header flex-between">
                <div>
                    <h1 className="module-title">FAQ Management</h1>
                    <p className="module-subtitle">Create and manage frequently asked questions.</p>
                </div>
                <Button variant="primary" startIcon={<FaPlus />} onClick={() => handleOpenModal()} style={{ width: "fit-content" }}>
                    Create FAQ
                </Button>
            </div>

            <div className="faq-list">
                {faqs.length === 0 ? (
                    <EmptyState
                        title="No FAQs Created"
                        description="Get started by creating the first frequently asked question."
                        icon={<FaQuestionCircle style={{ color: "#d1d5db" }} />}
                        action={
                            <Button variant="primary" size="small" onClick={() => handleOpenModal()}>
                                Create Now
                            </Button>
                        }
                    />
                ) : (
                    faqs.map((faq) => (
                        <div key={faq.id} className="faq-card ui-card">
                            <button className="faq-trigger" onClick={() => toggleExpand(faq.id)}>
                                <div className="faq-question">{faq.question}</div>
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    {expandedId === faq.id ? <FaChevronUp className="text-muted" /> : <FaChevronDown className="text-muted" />}
                                </div>
                            </button>

                            {expandedId === faq.id && (
                                <div className="faq-content">
                                    <p style={{ marginTop: 0 }}>{faq.answer}</p>
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                                        <Button
                                            size="small"
                                            variant="secondary"
                                            startIcon={<FaEdit />}
                                            onClick={() => handleOpenModal(faq)}
                                            style={{ width: "fit-content", flex: "none" }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="danger"
                                            startIcon={<FaTrash />}
                                            onClick={() => handleDelete(faq.id)}
                                            style={{ width: "fit-content", flex: "none" }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit FAQ" : "Add New FAQ"}
                size="medium"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={isSaving}>Save FAQ</Button>
                    </>
                }
            >
                <div className="form-field">
                    <label className="form-label">Question</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="e.g. How do I apply for leave?"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Answer</label>
                    <textarea
                        className="form-control"
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        placeholder="Provide a clear and concise answer..."
                        style={{ minHeight: "120px" }}
                    />
                </div>
            </Modal>
        </div>
    );
}
