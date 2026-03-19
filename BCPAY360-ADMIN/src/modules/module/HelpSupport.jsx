import React, { useState, useEffect, useMemo } from "react";
import { FaSearch, FaPaperPlane, FaUserCircle, FaCheckCircle, FaFilter, FaInbox, FaSitemap, FaClock, FaIdBadge } from "react-icons/fa";
import { Badge, Button, EmptyState, Loader } from "./components";
import { getSupportTickets, getSupportTicketById, respondToSupportTicket } from "../../api/master.api";
import "./HelpSupport.css";
import "../../styles/Attendance.css";
import { useBranch } from "../../hooks/useBranch"; // Import Hook

export default function HelpSupport() {
    const { branches, selectedBranch, changeBranch, isSingleBranch } = useBranch();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);

    // Fetch data on mount and when filters change
    // Fetch data when filters change - Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedBranch, statusFilter]);

    // Fetch data when page or filters change
    useEffect(() => {
        fetchTickets();
    }, [currentPage, searchQuery, selectedBranch, statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: ITEMS_PER_PAGE
            };
            if (searchQuery) params.search = searchQuery;
            if (selectedBranch) params.branch_id = selectedBranch;
            if (statusFilter !== "All") params.status = statusFilter;

            const response = await getSupportTickets(params);
            if (response.success) {
                setTickets(response.data || []);
                if (response.pagination) {
                    setServerTotalPages(response.pagination.totalPages || 1);
                    setTotalEntries(response.pagination.total || 0);
                }
            }
        } catch (error) {
            alert("Failed to fetch tickets: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketSelect = async (id) => {
        setSelectedTicketId(id);
        setShowModal(true);
        setDetailLoading(true);
        try {
            const response = await getSupportTicketById(id);
            if (response.success) {
                setSelectedTicket(response.data);
            }
        } catch (error) {
            alert("Failed to fetch ticket details: " + error.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTicket(null);
        setSelectedTicketId(null);
        setReplyText("");
    };

    // Pagination Data
    const totalPages = serverTotalPages;
    const paginatedTickets = tickets; // Data is already paginated from server

    const handleSendAndClose = async () => {
        if (!replyText.trim() || !selectedTicketId) return;

        try {
            const response = await respondToSupportTicket(selectedTicketId, { response: replyText });
            if (response.success) {
                setReplyText("");
                // Update local state to reflect closure
                setSelectedTicket(prev => ({ ...prev, adminReply: replyText, status: "Closed" }));
                setTickets(prev => prev.map(t =>
                    t.id === selectedTicketId ? { ...t, status: "Closed" } : t
                ));
                alert("Response sent and ticket closed successfully.");
                setTimeout(handleCloseModal, 1500);
            }
        } catch (error) {
            alert("Failed to send response: " + error.message);
        }
    };

    const getStatusVariant = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case "OPEN": return "warning";
            case "CLOSED": return "success";
            default: return "neutral";
        }
    };

    return (
        <div className="module-container">
            <div className="module-header flex-between">
                <div>
                    <h1 className="module-title">Help & Support</h1>
                    <p className="module-subtitle">Resolve employee queries with a single, efficient response mechanism.</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-container glass-panel" style={{ display: "flex", gap: "16px", padding: "16px", marginBottom: "20px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                    <input
                        className="form-control"
                        placeholder="Search employee, email or subject..."
                        style={{ paddingLeft: "36px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {!isSingleBranch && (
                    <select
                        className="form-control"
                        style={{ width: "180px" }}
                        value={selectedBranch === null ? "ALL" : selectedBranch}
                        onChange={(e) => {
                            const val = e.target.value;
                            changeBranch(val === "ALL" ? null : Number(val));
                        }}
                    >
                        {branches.length > 1 && <option value="ALL">All Branches</option>}
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>
                        ))}
                    </select>
                )}
                <select
                    className="form-control"
                    style={{ width: "150px" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                </select>
            </div>

            {/* Tickets Table Panel */}
            <div className="support-table-container">
                {loading && <Loader overlay />}
                <div className="support-table-wrapper">
                    <table className="attendance-table">
                        <thead style={{ position: "sticky", top: 0, zIndex: 1, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <tr>
                                <th className="text-center" style={{ width: '60px' }}>Sl No</th>
                                <th className="text-center">Profile</th>
                                <th className="text-center">Emp ID</th>
                                <th className="text-left">Employee Name</th>
                                <th className="text-left">Email</th>
                                <th className="text-center">Branch</th>
                                <th className="text-center">Raised Date</th>
                                <th className="text-center">Subject</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTickets.map((ticket, index) => {
                                const branch = branches.find(b => b.id === ticket.branch_id);
                                const slNo = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                return (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => handleTicketSelect(ticket.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="text-center" style={{ color: '#64748b' }}>{slNo}</td>
                                        <td className="text-center">
                                            <img
                                                src={ticket.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.employee_name || 'U')}&background=e2e8f0&color=475569`}
                                                alt="avatar"
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.employee_name || 'U')}&background=e2e8f0&color=475569`;
                                                }}
                                            />
                                        </td>
                                        <td className="text-center" style={{ color: '#64748b', fontWeight: '500' }}>
                                            {ticket.employee_code || 'N/A'}
                                        </td>
                                        <td className="text-left font-semibold" style={{ color: '#1e293b' }}>
                                            {ticket.employee_name || 'N/A'}
                                        </td>
                                        <td className="text-left" style={{ fontSize: '12px', color: '#64748b' }}>
                                            {ticket.employee_email}
                                        </td>
                                        <td className="text-center" style={{ color: '#64748b' }}>
                                            {branch ? (branch.branch_name || branch.name) : `ID: ${ticket.branch_id}`}
                                        </td>
                                        <td className="text-center" style={{ color: '#64748b', fontSize: '13px' }}>
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '—'}
                                        </td>
                                        <td className="text-center" style={{ color: '#475569' }}>
                                            <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                                {ticket.category}
                                            </span>
                                            {ticket.subject && <div style={{ fontSize: '12px', marginTop: '4px' }}>{ticket.subject}</div>}
                                        </td>
                                        <td className="text-center">
                                            <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                                        </td>
                                        <td className="text-center">
                                            {ticket.status?.toUpperCase() === 'OPEN' ? (
                                                <button className="action-btn view">View Ticket</button>
                                            ) : (
                                                <button className="action-btn show">Show</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && tickets.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="table-empty text-center" style={{ padding: "40px" }}>
                                        No tickets found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Area */}
                    {tickets.length > 0 && (
                        <div className="support-pagination-area">
                            <div className="pagination-text">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalEntries)} of {totalEntries} entries
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                >
                                    First
                                </button>
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <div className="page-numbers">
                                    {[...Array(Math.max(1, totalPages))].map((_, i) => (
                                        <button
                                            key={i}
                                            className={`page-number-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </button>
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(totalPages)}
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Popup overlay for Detail Panel */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleCloseModal} className="detail-close-btn">✕</button>

                        {detailLoading && <Loader overlay />}
                        {selectedTicket && (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div className="detail-header">
                                    <div className="detail-title-area" style={{ flex: 1 }}>
                                        <h2 className="detail-title">
                                            {selectedTicket.category} {selectedTicket.subject ? `- ${selectedTicket.subject}` : ''}
                                        </h2>
                                        <Badge variant={getStatusVariant(selectedTicket.status)}>{selectedTicket.status}</Badge>
                                    </div>
                                    <div className="detail-info-grid">
                                        <div className="info-chip">
                                            <FaUserCircle size={14} color="#94a3b8" /> {selectedTicket.employee_name}
                                        </div>
                                        {selectedTicket.employee_code && (
                                            <div className="info-chip">
                                                <FaIdBadge size={14} color="#94a3b8" /> {selectedTicket.employee_code}
                                            </div>
                                        )}
                                        <div className="info-chip">
                                            <FaSitemap size={14} color="#94a3b8" /> {branches.find(b => b.id === selectedTicket.branch_id)?.branch_name || selectedTicket.branch_id}
                                        </div>
                                        <div className="info-chip">
                                            <FaIdBadge size={14} color="#94a3b8" /> {selectedTicket.department || 'General'}
                                        </div>
                                        <div className="info-chip">
                                            <FaClock size={14} color="#94a3b8" /> {new Date(selectedTicket.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="message-section">
                                    <label className="section-label">Employee Description</label>
                                    <div className="message-bubble">
                                        {selectedTicket.reason || selectedTicket.message || selectedTicket.description || 'No description provided.'}
                                    </div>
                                </div>

                                <div className="admin-resolution-container">
                                    <label className="section-label">Admin Resolution</label>
                                    {selectedTicket.status?.toUpperCase() === "OPEN" ? (
                                        <>
                                            <textarea
                                                className="resolution-textarea"
                                                placeholder="Provide a final resolution to the employee..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: '12px' }}>
                                                <button
                                                    onClick={handleCloseModal}
                                                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSendAndClose}
                                                    disabled={!replyText.trim()}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: !replyText.trim() ? '#94a3b8' : '#3b82f6', color: '#fff', cursor: !replyText.trim() ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                                                >
                                                    <FaPaperPlane /> Send & Close Ticket
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="closed-ticket-msg">
                                            <div className="resolved-label">Resolved:</div>
                                            <div style={{ fontSize: '14px' }}>{selectedTicket.adminReply}</div>
                                            <div className="resolved-footer">
                                                <FaCheckCircle /> This ticket has been resolved and closed.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
