import React, { useState, useEffect } from "react";
import { FaPaperPlane, FaUsers, FaHistory, FaCheckCircle, FaBullhorn, FaTrash } from "react-icons/fa";
import { Button, Modal, Card, CardBody, Badge, EmptyState, Loader } from "./components";
import { getBroadcasts, createBroadcast, deleteBroadcast, getBroadcastEmployees } from "../../api/master.api";
import "./module.css";
import { useBranch } from "../../hooks/useBranch"; // Import Hook

export default function ManageBroadcast() {
    const { branches } = useBranch();
    const [broadcasts, setBroadcasts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [audienceType, setAudienceType] = useState("ALL"); // ALL, BRANCH, EMPLOYEE
    const [broadcastBranchId, setBroadcastBranchId] = useState("");
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeBranchFilter, setEmployeeBranchFilter] = useState("");

    // Fetch broadcasts on mount
    useEffect(() => {
        fetchBroadcasts();
    }, []);

    // Fetch employees when audience type changes to EMPLOYEE
    useEffect(() => {
        if (audienceType === "EMPLOYEE" && isModalOpen) {
            fetchEmployees();
        }
    }, [audienceType, isModalOpen]);

    const fetchBroadcasts = async () => {
        setIsLoading(true);
        try {
            const response = await getBroadcasts();

            // Handle both response formats
            if (response.success) {
                setBroadcasts(response.data || []);
            } else if (Array.isArray(response)) {
                // Direct array response
                setBroadcasts(response);
            } else if (response.data) {
                // Response with data property but no success flag
                setBroadcasts(response.data);
            } else {
                alert("Failed to load broadcasts: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to load broadcasts: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
            const response = await getBroadcastEmployees();

            // Handle both response formats
            if (response.success) {
                setEmployees(response.data || []);
            } else if (Array.isArray(response)) {
                // Direct array response
                setEmployees(response);
            } else if (response.data) {
                // Response with data property but no success flag
                setEmployees(response.data);
            } else {
                alert("Failed to load employees: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to load employees: " + error.message);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const toggleEmployee = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(selectedEmployees.filter((e) => e !== id));
        } else {
            setSelectedEmployees([...selectedEmployees, id]);
        }
    };

    // Filter employees based on search query
    const filteredEmployees = employees.filter((emp) => {
        // 1. Branch Filter check
        if (employeeBranchFilter && emp.branch_id !== Number(employeeBranchFilter)) {
            return false;
        }

        // 2. Search Filter check
        if (!employeeSearch.trim()) return true;

        const searchLower = employeeSearch.toLowerCase();
        const empCode = (emp.employee_code || "").toLowerCase();
        const fullName = (emp.full_name || emp.name || emp.employee_name || "").toLowerCase();
        const combinedText = `${empCode} ${fullName}`.toLowerCase();

        return empCode.includes(searchLower) ||
            fullName.includes(searchLower) ||
            combinedText.includes(searchLower);
    });

    const handleSend = async () => {
        // Validation
        if (!message.trim()) {
            alert("Message is required");
            return;
        }

        if (audienceType === "BRANCH" && !broadcastBranchId) {
            alert("Please select a branch");
            return;
        }

        if (audienceType === "EMPLOYEE" && selectedEmployees.length === 0) {
            alert("Please select at least one employee");
            return;
        }

        // Build payload
        const payload = {
            audience_type: audienceType,
            message: message.trim(),
        };

        if (audienceType === "BRANCH") {
            payload.branch_id = broadcastBranchId;
        } else if (audienceType === "EMPLOYEE") {
            payload.employee_ids = selectedEmployees;
            // The backend requires a branch_id even for specific employees.
            // We pass the branch_id of the first selected employee.
            if (selectedEmployees.length > 0) {
                const firstSelectedEmp = employees.find(emp => emp.id === selectedEmployees[0]);
                if (firstSelectedEmp && firstSelectedEmp.branch_id) {
                    payload.branch_id = firstSelectedEmp.branch_id;
                } else if (employeeBranchFilter) {
                    // Fallback to the filter if the employee array didn't contain the branch_id
                    payload.branch_id = Number(employeeBranchFilter);
                }
            }
        }

        setIsSending(true);
        try {
            const response = await createBroadcast(payload);
            // Handle both response formats
            if (response.success || response.success === undefined) {
                // Refresh broadcast list
                await fetchBroadcasts();
                alert("Broadcast sent successfully!");
                // Reset form
                setMessage("");
                setSelectedEmployees([]);
                setBroadcastBranchId("");
                setAudienceType("ALL");
                setEmployeeSearch("");
                setIsModalOpen(false);
            } else {
                alert("Failed to send broadcast: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to send broadcast: " + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this broadcast?")) return;

        try {
            const response = await deleteBroadcast(id);
            // Handle both response formats
            if (response.success || response.success === undefined) {
                // Remove from state instantly
                setBroadcasts(broadcasts.filter((b) => b.id !== id));
                alert("Broadcast deleted successfully!");
            } else {
                alert("Failed to delete broadcast: " + (response.message || "Unknown error"));
            }
        } catch (error) {
            alert("Failed to delete broadcast: " + error.message);
        }
    };

    const openComposer = () => {
        setIsModalOpen(true);
    };

    const getAudienceLabel = (broadcast) => {
        if (broadcast.audience_type === "ALL") return "All Employees";
        if (broadcast.audience_type === "BRANCH") {
            const branch = branches.find(b => b.id === broadcast.branch_id);
            return `Branch: ${branch?.branch_name || branch?.name || 'Unknown'}`;
        }
        if (broadcast.audience_type === "EMPLOYEE") {
            const count = broadcast.employee_ids?.length || broadcast.recipient_count || 0;
            return `${count} Employee${count !== 1 ? 's' : ''}`;
        }
        return "Unknown";
    };


    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    <h1 className="module-title">Manage Broadcast</h1>
                    <p className="module-subtitle">Send announcements to your organization.</p>
                </div>
                <Button variant="primary" startIcon={<FaPaperPlane />} onClick={openComposer} style={{ width: "fit-content" }}>
                    New Broadcast
                </Button>
            </div>

            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h3 style={{ marginBottom: "20px", color: "#374151" }}>Recent Activity</h3>

                {broadcasts.length === 0 ? (
                    <EmptyState
                        icon={<FaHistory style={{ color: "#d1d5db" }} />}
                        title="No Broadcasts Sent"
                        description="Your history of sent announcements will appear here."
                        action={
                            <Button variant="primary" size="small" onClick={openComposer}>
                                Send First Broadcast
                            </Button>
                        }
                    />
                ) : (
                    <div className="history-list">
                        {broadcasts.map((item) => (
                            <div key={item.id} className="history-item sent" style={{ marginLeft: "12px" }}>
                                <div className="history-date">{formatDate(item.created_at)}</div>
                                <Card style={{ marginBottom: "0" }}>
                                    <CardBody style={{ padding: "16px" }}>
                                        <p className="history-msg">{item.message}</p>
                                        <div className="flex-between" style={{ marginTop: "12px" }}>
                                            <div className="history-meta" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <Badge variant="neutral">{getAudienceLabel(item)}</Badge>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#059669", fontWeight: "600" }}>
                                                    <FaCheckCircle /> Delivered
                                                </div>
                                                <Button
                                                    size="small"
                                                    variant="danger"
                                                    startIcon={<FaTrash />}
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FaBullhorn style={{ color: "#4f46e5" }} /> Compose Broadcast
                    </div>
                }
                size="medium"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSending}>Cancel</Button>
                        <Button variant="primary" onClick={handleSend} isLoading={isSending} disabled={isSending} endIcon={<FaPaperPlane />}>
                            Send Announcement
                        </Button>
                    </>
                }
            >
                <div className="form-field">
                    <label className="form-label">Target Audience</label>
                    <div className="audience-selector">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="audienceType"
                                checked={audienceType === "ALL"}
                                onChange={() => setAudienceType("ALL")}
                                disabled={isSending}
                            />
                            All Employees
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="audienceType"
                                checked={audienceType === "BRANCH"}
                                onChange={() => setAudienceType("BRANCH")}
                                disabled={isSending}
                            />
                            Branch-wise
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="audienceType"
                                checked={audienceType === "EMPLOYEE"}
                                onChange={() => setAudienceType("EMPLOYEE")}
                                disabled={isSending}
                            />
                            Specific Employees
                        </label>
                    </div>
                </div>

                {audienceType === "BRANCH" && (
                    <div className="form-field">
                        <label className="form-label">Select Branch</label>
                        <select
                            className="form-control"
                            value={broadcastBranchId}
                            onChange={(e) => setBroadcastBranchId(e.target.value)}
                            disabled={isSending}
                        >
                            <option value="">Select a branch</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.branch_name || branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {audienceType === "EMPLOYEE" && (
                    <div className="form-field">
                        <label className="form-label">Select Recipients</label>
                        {isLoadingEmployees ? (
                            <div className="flex-center" style={{ padding: "20px" }}>
                                <Loader />
                            </div>
                        ) : employees.length === 0 ? (
                            <p className="text-sm text-muted">No employees available</p>
                        ) : (
                            <>
                                {/* Search Input and Branch Filter */}
                                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                                    <div style={{ position: "relative", flex: 2 }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by employee code or name..."
                                            value={employeeSearch}
                                            onChange={(e) => setEmployeeSearch(e.target.value)}
                                            disabled={isSending}
                                            style={{ paddingLeft: "36px" }}
                                        />
                                        <FaUsers style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "#94a3b8",
                                            fontSize: "14px"
                                        }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <select
                                            className="form-control"
                                            value={employeeBranchFilter}
                                            onChange={(e) => setEmployeeBranchFilter(e.target.value)}
                                            disabled={isSending}
                                        >
                                            <option value="">All Branches</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.branch_name || b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Employee List */}
                                <div className="checkbox-list" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}>
                                    {filteredEmployees.length === 0 ? (
                                        <p className="text-sm text-muted" style={{ padding: "12px", textAlign: "center", margin: 0 }}>
                                            No employees found matching "{employeeSearch}"
                                        </p>
                                    ) : (
                                        filteredEmployees.map((emp) => {
                                            const empCode = emp.employee_code || "N/A";
                                            const empName = emp.full_name || emp.name || emp.employee_name ||
                                                `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || "Unknown";
                                            const displayText = `${empCode} - ${empName}`;

                                            return (
                                                <label key={emp.id} className="checkbox-item" style={{ padding: "8px 12px", borderRadius: "6px", cursor: "pointer" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onChange={() => toggleEmployee(emp.id)}
                                                        style={{ marginRight: "12px" }}
                                                        disabled={isSending}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: "500", fontSize: "14px", color: "#1f2937" }}>
                                                            {displayText}
                                                        </div>
                                                        {emp.branch_id && (
                                                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                                                                Branch ID: {emp.branch_id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                        {selectedEmployees.length > 0 && (
                            <p className="text-sm text-muted" style={{ marginTop: "8px" }}>
                                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                )}

                <div className="form-field">
                    <label className="form-label">Message Content</label>
                    <textarea
                        className="form-control"
                        placeholder="Type your announcement here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ resize: "none", minHeight: "150px" }}
                        disabled={isSending}
                    />
                    <p className="text-sm text-muted" style={{ marginTop: "6px" }}>
                        This message will be sent immediately to the selected recipients.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
