import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../../components/ui/PageHeader";
import SummaryCards from "../../../components/ui/SummaryCards";
import FiltersBar from "../../../components/ui/FiltersBar";
import DataTable from "../../../components/ui/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";
import { FaCheckCircle, FaExclamationCircle, FaUsers, FaEye, FaUpload, FaDownload, FaFileExport, FaTrash } from "react-icons/fa";
import { getEmployeesByForm, uploadEmployeeForm, replaceEmployeeForm, deleteEmployeeForm } from "../../../api/employees.api";
import { getDepartments } from "../../../api/master.api";
import { REPORTS_CONFIG } from "../config/reports.config";
import "../../../styles/shared/modern-ui.css";
import "../../../styles/Attendance.css";
import "../styles/softwarerReports.css"; // Added missing CSS import
import { useBranch } from "../../../hooks/useBranch"; // Import Hook
import { FileSpreadsheet, FileText } from "lucide-react";

const MONTH_MAP = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

const SoftwareReportsPage = () => {
    const { reportType } = useParams();
    const { branches, selectedBranch, changeBranch, isSingleBranch } = useBranch();

    // Metadata State
    const [reportMetadata, setReportMetadata] = useState(null);
    const [fetchingMetadata, setFetchingMetadata] = useState(true);

    // Metadata Fetching
    useEffect(() => {
        const fetchMetadata = async () => {
            setFetchingMetadata(true);
            try {
                // Fallback to config directly since no form API exists for generic reports yet
                const configFallback = REPORTS_CONFIG[reportType];
                setReportMetadata({
                    title: configFallback?.title || reportType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Report",
                    subtitle: `Report data for ${reportType}.`,
                    code: configFallback?.id || reportType,
                    periodType: configFallback?.periodType || "MONTH",
                    emptyStateText: `No records found for ${reportType}.`
                });
            } catch (error) {
                // silenced

            } finally {
                setFetchingMetadata(false);
            }
        };
        fetchMetadata();
    }, [reportType]);

    // API Data State
    const [availableList, setAvailableList] = useState([]);
    const [missingList, setMissingList] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Master Data
    const [departments, setDepartments] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState("Available"); // tabs: Available | Upload
    const [selectedIds, setSelectedIds] = useState(new Set());

    // State for filters
    const [filters, setFilters] = useState({
        search: "",
        departmentId: "",
        month: new Date().toLocaleString('en-US', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        financialYear: "2024-25"
    });

    // Clear selection on tab or filter change
    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTab, selectedBranch, filters.departmentId, filters.month, filters.year, filters.financialYear, reportType]);


    useEffect(() => {
        if (selectedBranch) {
            (async () => {
                try {
                    const depts = await getDepartments(selectedBranch);
                    setDepartments(depts || []);
                } catch (error) {
                    // silenced
                }
            })();
        } else {
            setDepartments([]);
        }
    }, [selectedBranch]);

    const fetchData = useCallback(async () => {
        if (!reportMetadata?.code) return;

        setLoading(true);
        try {
            const params = {
                formCode: reportMetadata.code,
                periodType: reportMetadata.periodType,
                docType: "REPORT",
                branchId: selectedBranch,
                departmentId: filters.departmentId
            };

            // Add period parameters based on periodType
            if (reportMetadata.periodType === "FY") {
                params.financialYear = filters.financialYear;
            } else if (reportMetadata.periodType === "MONTH") {
                params.year = parseInt(filters.year);
                const monthVal = filters.month;
                params.month = MONTH_MAP[monthVal] || parseInt(monthVal);

                if (!params.month || isNaN(params.month)) {
                    alert(`Invalid month selected: ${monthVal}`);
                    return;
                }
            } else if (reportMetadata.periodType === "HALF_YEAR") {
                params.year = parseInt(filters.year);
            }

            const response = await getEmployeesByForm(params);
            setAvailableList(response.available || []);
            setMissingList(response.missing || []);
            setSummary(response.summary || null);
        } catch (error) {
            alert("Error fetching report data: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [reportMetadata, filters]);

    useEffect(() => {
        if (reportMetadata) {
            fetchData();
        }
    }, [fetchData, reportMetadata]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Stats calculation
    const stats = useMemo(() => {
        if (!summary) return [
            { label: "Total Employees", value: 0, icon: <FaUsers />, color: "blue" },
            { label: "Reports Available", value: 0, icon: <FaCheckCircle />, color: "green" },
            { label: "Reports Missing", value: 0, icon: <FaExclamationCircle />, color: "orange" }
        ];

        return [
            {
                label: "Total Employees",
                value: summary.total || 0,
                icon: <FaUsers />,
                color: "blue"
            },
            {
                label: "Reports Available",
                value: summary.available || 0,
                icon: <FaCheckCircle />,
                color: "green"
            },
            {
                label: "Reports Missing",
                value: summary.missing || 0,
                icon: <FaExclamationCircle />,
                color: "orange"
            }
        ];
    }, [summary]);

    const handleView = (emp) => {
        if (emp.view_url) {
            window.open(emp.view_url, "_blank");
        }
    };

    const handleDownload = (emp) => {
        if (emp.download_url) {
            window.open(emp.download_url, "_blank");
        }
    };

    const handleUpload = async (emp, file) => {
        if (!file) return;
        setUploading(true);
        try {
            const uploadData = {
                employeeId: emp.employee_id || emp.id,
                docType: "REPORT",
                formCode: reportMetadata.code,
                periodType: reportMetadata.periodType,
                file: file
            };

            if (reportMetadata.periodType === "FY") {
                uploadData.financialYear = filters.financialYear;
            } else if (reportMetadata.periodType === "MONTH") {
                uploadData.year = parseInt(filters.year);
                const monthVal = filters.month;
                uploadData.month = MONTH_MAP[monthVal] || parseInt(monthVal);
            } else if (reportMetadata.periodType === "HALF_YEAR") {
                uploadData.year = parseInt(filters.year);
            }

            await uploadEmployeeForm(uploadData);
            fetchData();
        } catch (error) {
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleReplace = async (emp, file) => {
        if (!file) return;
        if (!window.confirm("Replace existing document?")) return;

        setUploading(true);
        try {
            const replaceData = {
                employeeId: emp.employee_id || emp.id,
                docType: "REPORT",
                formCode: reportMetadata.code,
                periodType: reportMetadata.periodType,
                file: file
            };

            if (reportMetadata.periodType === "FY") {
                replaceData.financialYear = filters.financialYear;
            } else if (reportMetadata.periodType === "MONTH") {
                replaceData.year = parseInt(filters.year);
                const monthVal = filters.month;
                replaceData.month = MONTH_MAP[monthVal] || parseInt(monthVal);
            } else if (reportMetadata.periodType === "HALF_YEAR") {
                replaceData.year = parseInt(filters.year);
            }

            await replaceEmployeeForm(replaceData);
            fetchData();
        } catch (error) {
            alert("Replace failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (emp) => {
        if (!window.confirm("Permanently delete this document?")) return;

        setUploading(true);
        try {
            const deleteData = {
                employeeId: emp.employee_id || emp.id,
                docType: "REPORT",
                formCode: reportMetadata.code,
                periodType: reportMetadata.periodType
            };

            if (reportMetadata.periodType === "FY") {
                deleteData.financialYear = filters.financialYear;
            } else if (reportMetadata.periodType === "MONTH") {
                deleteData.year = parseInt(filters.year);
                const monthVal = filters.month;
                deleteData.month = MONTH_MAP[monthVal] || parseInt(monthVal);
            } else if (reportMetadata.periodType === "HALF_YEAR") {
                deleteData.year = parseInt(filters.year);
            }

            await deleteEmployeeForm(deleteData);
            fetchData();
        } catch (error) {
            alert("Delete failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Filtered list based on tab and searching
    const currentList = useMemo(() => {
        // "Upload" tab shows employees who are missing documents (to upload)
        return activeTab === "Available" ? availableList : missingList;
    }, [activeTab, availableList, missingList]);

    const filteredData = useMemo(() => {
        if (!filters.search) return currentList;

        const searchLower = filters.search.toLowerCase();
        return currentList.filter(emp =>
            (emp.full_name || "").toLowerCase().includes(searchLower) ||
            (emp.employee_code || "").toLowerCase().includes(searchLower)
        );
    }, [currentList, filters.search]);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(emp => emp.id || emp.employee_id)));
        }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    // Export Handler
    const handleExport = () => {
        const selectedData = filteredData.filter(emp => selectedIds.has(emp.id || emp.employee_id));
        if (selectedData.length === 0) return;

        const headers = ["Employee Code", "Employee Name", "Phone", "Joining Date", "Branch", "Department", "Report Name", "Period", "Status"];
        const rows = selectedData.map(emp => [
            `"${emp.employee_code || ''}"`,
            `"${emp.full_name || ''}"`,
            `"${emp.phone || ''}"`,
            `"${emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}"`,
            `"${emp.branch_name || ''}"`,
            `"${emp.department_name || ''}"`,
            `"${reportMetadata.title || reportMetadata.code}"`,
            `"${reportMetadata.periodType === "FY" ? filters.financialYear : reportMetadata.periodType === "MONTH" ? `${filters.month} ${filters.year}` : reportMetadata.periodType === "LIFETIME" ? "N/A" : filters.year}"`,
            `"${activeTab}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Report_${reportMetadata.code}_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSelectedIds(new Set());
    };

    // Columns object was removed natively

    if (fetchingMetadata) return <div className="p-8 text-center">Loading Report Configuration...</div>;

    return (
        <div className="page-container fade-in">
            <PageHeader
                title={reportMetadata?.title}
                subtitle={reportMetadata?.subtitle}
                actions={
                    <div className="flex items-center gap-4">
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn-export-new"
                                onClick={handleExport}
                                title="Export to Excel"
                                disabled={selectedIds.size === 0}
                                style={{
                                    backgroundColor: '#10b981', // Green for Excel
                                    borderColor: '#10b981',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontWeight: '500',
                                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                                    opacity: selectedIds.size === 0 ? 0.6 : 1
                                }}
                            >
                                <FileSpreadsheet size={16} /> Excel ({selectedIds.size})
                            </button>

                            <button
                                className="btn-export-new"
                                onClick={handleExport}
                                title="Export to PDF"
                                disabled={selectedIds.size === 0}
                                style={{
                                    backgroundColor: '#ef4444', // Red for PDF
                                    borderColor: '#ef4444',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontWeight: '500',
                                    cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                                    opacity: selectedIds.size === 0 ? 0.6 : 1
                                }}
                            >
                                <FileText size={16} /> PDF ({selectedIds.size})
                            </button>
                        </div>
                        <div className="selector-group">
                            {reportMetadata?.periodType === "FY" && (
                                <select value={filters.financialYear} onChange={(e) => handleFilterChange("financialYear", e.target.value)}>
                                    <option value="2023-24">FY 2023-24</option>
                                    <option value="2024-25">FY 2024-25</option>
                                    <option value="2025-26">FY 2025-26</option>
                                </select>
                            )}
                            {reportMetadata?.periodType === "MONTH" && (
                                <>
                                    <select value={filters.month} onChange={(e) => handleFilterChange("month", e.target.value)}>
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select value={filters.year} onChange={(e) => handleFilterChange("year", e.target.value)}>
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>
                }
            />

            < SummaryCards cards={stats} />

            <FiltersBar search={filters.search} onSearchChange={(val) => handleFilterChange("search", val)}>
                {!isSingleBranch && (
                    <select
                        value={selectedBranch === null ? "ALL" : selectedBranch}
                        onChange={(e) => {
                            const val = e.target.value;
                            changeBranch(val === "ALL" ? null : Number(val));
                        }}
                        className="filter-select-modern"
                    >
                        {branches.length > 1 && <option value="ALL">All Branches</option>}
                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                    </select>
                )}

                <select value={filters.departmentId} onChange={(e) => handleFilterChange("departmentId", e.target.value)} className="filter-select-modern" disabled={!selectedBranch}>
                    <option value="">{selectedBranch ? "All Departments" : "Select Branch First"}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>

                <div className="tab-toggle-container ml-auto">
                    {["Available", "Upload"].map(t => (
                        <button key={t} className={`tab-btn ${activeTab === t ? 'active' : 'inactive'}`} onClick={() => setActiveTab(t)}>{t}</button>
                    ))}
                </div>
            </FiltersBar>


            <div className="attendance-table-container mt-6">
                {loading && (
                    <div className="drawer-table-overlay" style={{ zIndex: 50 }}>Loading...</div>
                )}
                <div className="history-table-wrapper">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th className="checkbox-cell" style={{ width: '40px', textAlign: 'center' }}>
                                    <input type="checkbox" checked={filteredData.length > 0 && selectedIds.size === filteredData.length} onChange={toggleSelectAll} />
                                </th>
                                <th className="col-profile text-center">Profile</th>
                                <th className="text-center">Emp ID</th>
                                <th className="text-center">Name</th>
                                <th className="text-center">Phone</th>
                                <th className="text-center">Joining Date</th>
                                <th className="text-center">Branch</th>
                                <th className="text-center">Department</th>
                                <th className="text-center">Document Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="table-empty text-center" style={{ padding: '40px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <FaFileExport size={24} color="#94a3b8" />
                                            <div>
                                                {activeTab === "Available"
                                                    ? "No available reports"
                                                    : `No pending uploads — all employees have ${reportMetadata?.title || "this report"}`}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((emp) => {
                                    const eid = emp.id || emp.employee_id;
                                    const isSelected = selectedIds.has(eid);
                                    return (
                                        <tr key={eid} className={isSelected ? 'row-selected' : ''}>
                                            <td className="checkbox-cell text-center">
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(eid)} />
                                            </td>
                                            <td className="col-profile text-center">
                                                <img
                                                    src={emp.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
                                                    alt={emp.full_name}
                                                    className="attendance-avatar-sm"
                                                    style={{ margin: '0 auto' }}
                                                    onError={(err) => {
                                                        err.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name || 'U')}&background=EFF6FF&color=3B82F6&bold=true`;
                                                    }}
                                                />
                                            </td>
                                            <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>
                                                {emp.employee_code}
                                            </td>
                                            <td className="text-center">{emp.full_name}</td>
                                            <td className="text-center" style={{ color: '#64748b', fontFamily: 'monospace' }}>{emp.phone || "—"}</td>
                                            <td className="text-center" style={{ color: '#64748b' }}>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB') : "—"}</td>
                                            <td className="text-center" style={{ color: '#64748b' }}>{emp.branch_name || "—"}</td>
                                            <td className="text-center" style={{ color: '#64748b' }}>{emp.department_name || "—"}</td>
                                            <td className="text-center">
                                                <StatusBadge
                                                    type={activeTab === "Available" ? "success" : "warning"}
                                                    label={activeTab === "Available" ? "Available" : "Upload"}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <div className="actions-group" style={{ justifyContent: 'center' }}>
                                                    {activeTab === "Available" ? (
                                                        <>
                                                            <button className="action-btn view" onClick={() => handleView(emp)} title="View"><FaEye size={14} /></button>
                                                            <button className="action-btn download" onClick={() => handleDownload(emp)} title="Download"><FaDownload size={14} /></button>
                                                            <div className="relative">
                                                                <input type="file" style={{ display: "none" }} id={`r-${eid}`} onChange={(ev) => handleReplace(emp, ev.target.files[0])} disabled={uploading} />
                                                                <label htmlFor={`r-${eid}`} className="action-btn replace" style={{ cursor: 'pointer' }}><FaUpload size={14} /></label>
                                                            </div>
                                                            <button className="action-btn delete" onClick={() => handleDelete(emp)} title="Delete"><FaTrash size={14} /></button>
                                                        </>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="file" style={{ display: "none" }} id={`u-${eid}`} onChange={(ev) => handleUpload(emp, ev.target.files[0])} disabled={uploading} />
                                                            <label htmlFor={`u-${eid}`} className="action-btn upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUpload size={14} /></label>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default SoftwareReportsPage;
