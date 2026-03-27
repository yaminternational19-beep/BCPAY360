import React, { useState, useEffect, useMemo } from "react";
import { FaSearch, FaPaperPlane, FaUserCircle, FaCheckCircle, FaFilter, FaInbox, FaSitemap, FaClock, FaIdBadge } from "react-icons/fa";
import { Badge, Button, EmptyState, Loader } from "./components";
import { getSupportTickets, getSupportTicketById, respondToSupportTicket } from "../../api/master.api";
import "./HelpSupport.css";
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

    // Reset pagination when filters change
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
            console.error("Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTicketSelect = async (ticket) => {
        const id = ticket.id;
        setSelectedTicketId(id);
        // Pre-populate with list data (name, profile, branch, etc.)
        setSelectedTicket(ticket);
        setShowModal(true);
        setDetailLoading(true);
        try {
            const res = await getSupportTicketById(id);
            if (res.success) {
                // Merge detail data (like response) with existing metadata
                setSelectedTicket(prev => ({ ...prev, ...res.data }));
            }
        } catch (error) {
            console.error("Failed to fetch ticket details:", error);
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

    const handleSendAndClose = async () => {
        if (!replyText.trim() || !selectedTicketId) return;

        try {
            const response = await respondToSupportTicket(selectedTicketId, { response: replyText });
            if (response.success) {
                setReplyText("");
                setSelectedTicket(prev => ({ ...prev, response: replyText, status: "Closed" }));
                setTickets(prev => prev.map(t =>
                    t.id === selectedTicketId ? { ...t, status: "Closed" } : t
                ));
                setTimeout(handleCloseModal, 1500);
            }
        } catch (error) {
            console.error("Failed to send response:", error);
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

    const totalPages = serverTotalPages;

    return (
        <div className="module-container">
            <div className="module-header flex-between" style={{ marginBottom: "20px" }}>
                <div>
                    <h1 className="module-title">Help & Support</h1>
                    <p className="module-subtitle">Resolve employee queries with a single, efficient response mechanism.</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-container glass-panel" style={{ display: "flex", gap: "16px", padding: "16px", marginBottom: "20px", borderRadius: "12px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                    <input
                        className="form-control"
                        placeholder="Search employee, email or subject..."
                        style={{ paddingLeft: "36px", width: "100%" }}
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

            {/* Tickets Table Area */}
            <div className="support-table-container">
                {loading && <Loader overlay />}
                <table className="help-support-table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: '60px' }}>SL NO</th>
                            <th className="text-center">PROFILE</th>
                            <th className="text-center">EMP ID</th>
                            <th className="text-left">EMPLOYEE NAME</th>
                            <th className="text-left">EMAIL</th>
                            <th className="text-center">BRANCH</th>
                            <th className="text-center">RAISED DATE</th>
                            <th className="text-left">SUBJECT</th>
                            <th className="text-center">STATUS</th>
                            <th className="text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket, index) => {
                            const branch = branches.find(b => b.id === ticket.branch_id);
                            const slNo = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                            return (
                                <tr key={ticket.id}>
                                    <td className="text-center" style={{ color: '#94a3b8', fontSize: '12px' }}>{slNo}</td>
                                    <td className="text-center">
                                        <img
                                            src={ticket.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.employee_name || 'U')}&background=e2e8f0&color=475569`}
                                            alt="avatar"
                                            className="support-avatar"
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.employee_name || 'U')}&background=e2e8f0&color=475569`;
                                            }}
                                        />
                                    </td>
                                    <td className="text-center" style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}>
                                        {ticket.employee_code || 'N/A'}
                                    </td>
                                    <td className="text-left" style={{ fontWeight: '500', color: '#334155' }}>
                                        {ticket.employee_name || 'N/A'}
                                    </td>
                                    <td className="text-left" style={{ fontSize: '13px', color: '#64748b' }}>
                                        {ticket.employee_email}
                                    </td>
                                    <td className="text-center" style={{ fontSize: '13px', color: '#64748b' }}>
                                        {branch ? (branch.branch_name || branch.name) : `ID: ${ticket.branch_id}`}
                                    </td>
                                    <td className="text-center" style={{ color: '#64748b', fontSize: '12px' }}>
                                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '—'}
                                    </td>
                                    <td className="text-left">
                                        <span className="category-tag">{ticket.category}</span>
                                        {ticket.subject && <div style={{ fontSize: '12px', marginTop: '2px', color: '#475569' }}>{ticket.subject}</div>}
                                    </td>
                                    <td className="text-center">
                                        <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                                    </td>
                                    <td className="text-center">
                                        <button 
                                            className={`action-btn ${ticket.status?.toUpperCase() === 'OPEN' ? 'view' : 'show'}`}
                                            onClick={() => handleTicketSelect(ticket)}
                                        >
                                            {ticket.status?.toUpperCase() === 'OPEN' ? 'View Ticket' : 'Show'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {!loading && tickets.length === 0 && (
                    <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                        No records found.
                    </div>
                )}

                {/* Pagination matching Screenshot 2 style */}
                {tickets.length > 0 && (
                    <div className="support-pagination-area">
                        <div className="pagination-text">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, totalEntries)} of {totalEntries}
                        </div>
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                title="First Page"
                            >
                                {"<<"}
                            </button>
                            <button
                                className="pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                title="Previous"
                            >
                                {"<"}
                            </button>
                            
                            <span className="page-indicator">
                                {currentPage} / {totalPages || 1}
                            </span>

                            <button
                                className="pagination-btn"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                title="Next"
                            >
                                {">"}
                            </button>
                            <button
                                className="pagination-btn"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(totalPages)}
                                title="Last Page"
                            >
                                {">>"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Overlay */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Resolution Panel</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Provide feedback and close query</p>
                            </div>
                            <button className="btn-close" onClick={handleCloseModal}>✕</button>
                        </div>

                        <div className="detail-body">
                            {detailLoading ? <Loader /> : selectedTicket && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <div>
                                            <label className="section-label">Employee</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img 
                                                    src={selectedTicket.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTicket.employee_name || 'U')}`}
                                                    className="support-avatar"
                                                />
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedTicket.employee_name}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedTicket.employee_code}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="section-label">Ticket Details</label>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedTicket.category}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                Branch: {branches.find(b => b.id === selectedTicket.branch_id)?.branch_name || 'Main Branch'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b' }}>Raised: {new Date(selectedTicket.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <label className="section-label">Description</label>
                                    <div className="message-bubble">
                                        {selectedTicket.reason || selectedTicket.message || selectedTicket.description || 'No description provided.'}
                                    </div>

                                    <label className="section-label">Final Resolution</label>
                                    {selectedTicket.status?.toUpperCase() === "OPEN" ? (
                                        <>
                                            <textarea
                                                className="resolution-textarea"
                                                placeholder="Provide the resolution steps taken..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <Button 
                                                    onClick={handleSendAndClose}
                                                    disabled={!replyText.trim()}
                                                    variant="primary"
                                                >
                                                    <FaPaperPlane style={{ marginRight: '8px' }} /> Resolve & Close
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontWeight: '700', color: '#166534', fontSize: '13px', marginBottom: '4px' }}>Admin Response:</div>
                                            <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{selectedTicket.response || selectedTicket.adminReply}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
