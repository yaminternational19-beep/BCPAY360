import React, { useState, useEffect } from "react";
import { FaEdit, FaSave, FaFileSignature, FaShieldAlt, FaHandshake, FaMoneyBillWave, FaEnvelope, FaFileAlt, FaPlus, FaCheck, FaTrash, FaTimes } from "react-icons/fa";
import { Card, CardBody, Button, Modal, Loader } from "./components";
import { getCompanyPages, getCompanyPageBySlug, createCompanyPage, updateCompanyPage, deleteCompanyPage } from "../../api/master.api";
import "./module.css";
import { useBranch } from "../../hooks/useBranch"; // Import Hook

// Helper to map icons based on slug
const getIconForSlug = (slug) => {
    switch (slug) {
        case "about-us": case "about": return <FaFileSignature />;
        case "terms-and-conditions": case "terms": return <FaHandshake />;
        case "privacy-policy": case "privacy": return <FaShieldAlt />;
        case "refund-policy": case "refund": return <FaMoneyBillWave />;
        case "contact-us": case "contact": return <FaEnvelope />;
        default: return <FaFileAlt />;
    }
};

// Helper to map colors based on slug
const getColorForSlug = (slug) => {
    switch (slug) {
        case "about-us": case "about": return "blue";
        case "terms-and-conditions": case "terms": return "purple";
        case "privacy-policy": case "privacy": return "green";
        case "refund-policy": case "refund": return "orange";
        case "contact-us": case "contact": return "blue";
        default: return "purple";
    }
};

const INITIAL_CONTACT_STATE = {
    hr: [{ name: "", branch_id: "", email: "", phone: "" }],
    admin: [{ name: "", branch_id: "", email: "", phone: "" }]
};

export default function ManageContent() {
    const { branches } = useBranch();
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Editor State
    const [content, setContent] = useState("");
    const [contactData, setContactData] = useState(INITIAL_CONTACT_STATE);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Creation State
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [newSectionColor, setNewSectionColor] = useState("blue");

    // Fetch pages on mount
    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        setIsLoading(true);
        try {
            const response = await getCompanyPages();
            if (response.success) {
                setSections(response.data || []);
            }
        } catch (error) {
            // silenced
        } finally {
            setIsLoading(false);
        }
    };

    const isContactPage = (slug) => slug === "contact-us" || slug === "contact";

    // Handle opening the content editor
    const handleEdit = async (section) => {
        setActiveSection(section);
        setIsEditorOpen(true);
        setIsFetchingContent(true);
        setContent("");
        setContactData(INITIAL_CONTACT_STATE);

        try {
            const response = await getCompanyPageBySlug(section.slug);
            if (response.success && response.data) {
                const rawContent = response.data.content || "";
                setContent(rawContent);

                if (isContactPage(section.slug)) {
                    try {
                        const parsed = JSON.parse(rawContent);

                        // Migration and Validation Logic
                        const migratedData = { hr: [], admin: [] };
                        ['hr', 'admin'].forEach(cat => {
                            if (Array.isArray(parsed[cat])) {
                                migratedData[cat] = parsed[cat].map(val => {
                                    if (typeof val === 'object') {
                                        return {
                                            name: val.name || "",
                                            branch_id: val.branch_id || "",
                                            email: val.email || "",
                                            phone: val.phone || ""
                                        };
                                    }
                                    return {
                                        name: "",
                                        branch_id: "",
                                        email: typeof val === 'string' && val.includes('@') ? val : "",
                                        phone: typeof val === 'string' && !val.includes('@') ? val : ""
                                    };
                                });
                            } else if (parsed[cat] && typeof parsed[cat] === 'object') {
                                // Double legacy format
                                const emails = Array.isArray(parsed[cat].emails) ? parsed[cat].emails : [];
                                const phones = Array.isArray(parsed[cat].phones) ? parsed[cat].phones : [];
                                const maxLen = Math.max(emails.length, phones.length, 1);

                                for (let i = 0; i < maxLen; i++) {
                                    migratedData[cat].push({
                                        name: "",
                                        branch_id: "",
                                        email: emails[i] || "",
                                        phone: phones[i] || ""
                                    });
                                }
                            }

                            // Ensure at least one empty entry if empty
                            if (migratedData[cat].length === 0) {
                                migratedData[cat] = [{ name: "", branch_id: "", email: "", phone: "" }];
                            }
                        });

                        setContactData(migratedData);
                    } catch (e) {
                        // Backward compatibility: rawContent is plain text/markdown
                        setContactData(INITIAL_CONTACT_STATE);
                    }
                }
            }
        } catch (error) {
            alert("Failed to load page content: " + error.message);
        } finally {
            setIsFetchingContent(false);
        }
    };

    const validateContacts = () => {
        const errors = [];
        ['hr', 'admin'].forEach(cat => {
            const entries = contactData[cat];
            const seenEmails = new Set();
            const seenPhones = new Set();

            entries.forEach((entry, idx) => {
                const label = `${cat.toUpperCase()} Contact #${idx + 1}`;

                // Branch selection is mandatory ONLY for HR
                if (cat === 'hr' && !entry.branch_id) {
                    errors.push(`${label}: Branch is required.`);
                }

                if ((cat === 'hr' ? entry.branch_id : true) && (entry.email || entry.phone)) {
                    if (entry.email) {
                        const emailKey = `${cat === 'hr' ? entry.branch_id : 'global'}|${entry.email?.toLowerCase().trim()}`;
                        if (seenEmails.has(emailKey)) {
                            errors.push(`${label}: Duplicate email "${entry.email}" found${cat === 'hr' ? ' for the same branch' : ''}.`);
                        }
                        seenEmails.add(emailKey);
                    }

                    if (entry.phone) {
                        const phoneKey = `${cat === 'hr' ? entry.branch_id : 'global'}|${entry.phone?.trim()}`;
                        if (seenPhones.has(phoneKey)) {
                            errors.push(`${label}: Duplicate phone "${entry.phone}" found${cat === 'hr' ? ' for the same branch' : ''}.`);
                        }
                        seenPhones.add(phoneKey);
                    }
                }
            });
        });
        return errors;
    };

    // Handle saving content
    const handleSaveContent = async () => {
        if (!activeSection) return;

        if (isContactPage(activeSection.slug)) {
            const errors = validateContacts();
            if (errors.length > 0) {
                alert("Validation Errors:\n\n" + errors.join("\n"));
                return;
            }
        }

        setIsSaving(true);
        try {
            let finalContent = content;
            if (isContactPage(activeSection.slug)) {
                finalContent = JSON.stringify(contactData);
            }

            const response = await updateCompanyPage(activeSection.id, {
                title: activeSection.title,
                content: finalContent,
                content_type: isContactPage(activeSection.slug) ? "JSON" : "HTML"
            });
            if (response.success) {
                setIsEditorOpen(false);
                fetchPages(); // Refresh the list
                alert("Page updated successfully!");
            }
        } catch (error) {
            alert("Failed to save changes: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Dynamic entry handlers
    const addEntry = (category) => {
        setContactData(prev => ({
            ...prev,
            [category]: [...prev[category], { name: "", branch_id: "", email: "", phone: "" }]
        }));
    };

    const removeEntry = (category, index) => {
        setContactData(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const updateEntry = (category, index, field, value) => {
        setContactData(prev => {
            const newList = [...prev[category]];
            newList[index] = { ...newList[index], [field]: value };
            return {
                ...prev,
                [category]: newList
            };
        });
    };

    // Handle creating a new section
    const handleCreateSection = async () => {
        if (!newSectionTitle.trim()) return;

        try {
            const response = await createCompanyPage({ title: newSectionTitle });
            if (response.success) {
                setNewSectionTitle("");
                setIsCreateOpen(false);
                fetchPages();
                alert("Page created successfully!");
            }
        } catch (error) {
            alert("Failed to create page: " + error.message);
        }
    };

    // Handle deleting a section
    const handleDeletePage = async () => {
        if (!activeSection) return;
        if (!window.confirm(`Are you sure you want to delete "${activeSection.title}"?`)) return;

        setIsDeleting(true);
        try {
            const response = await deleteCompanyPage(activeSection.id);
            if (response.success) {
                setIsEditorOpen(false);
                fetchPages();
                alert("Page deleted successfully!");
            }
        } catch (error) {
            alert("Failed to delete page: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderContactSection = (category, label) => (
        <div className="contact-category-section" style={{ marginBottom: "32px" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
                <h4 style={{ margin: 0, color: "#374151" }}>{label} Contacts</h4>
                <Button variant="ghost" size="small" onClick={() => addEntry(category)} style={{ color: "#4f46e5", fontWeight: "600" }}>
                    <FaPlus size={10} style={{ marginRight: "4px" }} /> Add Contact
                </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {contactData[category].map((entry, idx) => (
                    <div key={idx} className="contact-entry-card" style={{
                        padding: "16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb",
                        position: "relative"
                    }}>
                        {contactData[category].length > 1 && (
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() => removeEntry(category, idx)}
                                style={{ position: "absolute", top: "8px", right: "8px" }}
                            >
                                <FaTimes className="text-danger" />
                            </Button>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: category === 'hr' ? "1fr 1fr" : "1fr", gap: "12px" }}>
                            <div className="form-field" style={{ gridColumn: category === 'hr' ? "span 1" : "span 1", marginBottom: "8px" }}>
                                <label className="form-label" style={{ fontSize: "12px" }}>Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={entry.name}
                                    onChange={(e) => updateEntry(category, idx, 'name', e.target.value)}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            {category === 'hr' && (
                                <div className="form-field" style={{ gridColumn: "span 1", marginBottom: "8px" }}>
                                    <label className="form-label" style={{ fontSize: "12px" }}>Branch (Required)</label>
                                    <select
                                        className="form-control"
                                        value={entry.branch_id}
                                        onChange={(e) => updateEntry(category, idx, 'branch_id', e.target.value)}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="form-field" style={{ gridColumn: category === 'hr' ? "span 1" : "span 1", marginBottom: category === 'hr' ? 0 : "8px" }}>
                                <label className="form-label" style={{ fontSize: "12px" }}>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={entry.email}
                                    onChange={(e) => updateEntry(category, idx, 'email', e.target.value)}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="form-field" style={{ gridColumn: category === 'hr' ? "span 1" : "span 1", marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "12px" }}>Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={entry.phone}
                                    onChange={(e) => updateEntry(category, idx, 'phone', e.target.value)}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
                    <h1 className="module-title">Manage Content</h1>
                    <p className="module-subtitle">Update and manage your organization's static content pages.</p>
                </div>
                <Button variant="primary" startIcon={<FaPlus />} onClick={() => setIsCreateOpen(true)} style={{ width: "fit-content" }}>
                    Add New Page
                </Button>
            </div>

            <div className="content-grid">
                {sections.map((section) => (
                    <Card key={section.id} className="interactive" onClick={() => handleEdit(section)}>
                        <CardBody style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div className={`section-icon-wrapper icon-${getColorForSlug(section.slug)}`}>
                                {getIconForSlug(section.slug)}
                            </div>
                            <h3 className="ui-card-title">{section.title}</h3>
                            <p className="ui-card-subtitle" style={{ marginBottom: "16px" }}>Last updated: {formatDate(section.updated_at)}</p>

                            <Button variant="secondary" size="small" startIcon={<FaEdit />}>
                                Edit Content
                            </Button>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Content Editor Modal */}
            <Modal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={activeSection ? `Edit ${activeSection.title}` : "Edit Content"}
                size="large"
                footer={
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <div>
                            {activeSection && !activeSection.is_system && (
                                <Button
                                    variant="danger"
                                    onClick={handleDeletePage}
                                    isLoading={isDeleting}
                                    startIcon={<FaTrash />}
                                >
                                    Delete Page
                                </Button>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveContent} isLoading={isSaving} startIcon={<FaSave />}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                }
            >
                {isFetchingContent ? (
                    <div className="flex-center" style={{ minHeight: "200px" }}>
                        <Loader />
                    </div>
                ) : (
                    <>
                        {activeSection && isContactPage(activeSection.slug) ? (
                            <div className="contact-structured-editor">
                                {renderContactSection('hr', 'HR Support')}
                                <hr style={{ margin: "24px 0", border: "0", borderTop: "1px solid #e5e7eb" }} />
                                {renderContactSection('admin', 'Admin Support')}
                            </div>
                        ) : (
                            <div className="form-field">
                                <label className="form-label">Page Content</label>
                                <textarea
                                    className="form-control"
                                    style={{ minHeight: "300px", fontFamily: "monospace" }}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Type your content here..."
                                />
                                <p className="text-sm text-muted" style={{ marginTop: "8px" }}>
                                    Basic HTML formatting is supported.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            {/* Create Section Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Add New Content Page"
                size="small"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateSection} startIcon={<FaCheck />}>
                            Create Page
                        </Button>
                    </>
                }
            >
                <div className="form-field">
                    <label className="form-label">Page Title</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Employee Handbook"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">Color Theme</label>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {["blue", "purple", "green", "orange"].map(color => (
                            <div
                                key={color}
                                onClick={() => setNewSectionColor(color)}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    backgroundColor: color === "blue" ? "#e0f2fe" :
                                        color === "purple" ? "#f3e8ff" :
                                            color === "green" ? "#dcfce7" : "#ffedd5",
                                    border: newSectionColor === color ? `2px solid #4f46e5` : "2px solid transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: color === "blue" ? "#0284c7" :
                                        color === "purple" ? "#9333ea" :
                                            color === "green" ? "#16a34a" : "#ea580c"
                                }}
                            >
                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "currentColor" }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
