import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { FORMS_CONFIG } from "../config/forms.config";
import PageHeader from "../../../components/ui/PageHeader";
import SummaryCards from "../../../components/ui/SummaryCards";
import FiltersBar from "../../../components/ui/FiltersBar";
import DataTable from "../../../components/ui/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";
import {
    Eye,
    Upload,
    Download,
    Trash2,
    CheckCircle,
    AlertCircle,
    Users,
    FileOutput,
    FileSpreadsheet,
    FileText
} from "lucide-react";
import {
    getEmployeesByForm,
    uploadEmployeeForm,
    replaceEmployeeForm,
    deleteEmployeeForm
} from "../../../api/employees.api";
import { getDepartments } from "../../../api/master.api";
import "../../../styles/shared/modern-ui.css";
import "../Forms.css";
import "../../../styles/Attendance.css";
import { useBranch } from "../../../hooks/useBranch";

const MONTH_MAP = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

const EmployeeFormsPage = () => {
    console.log("Forms Module Loaded - terminology: Upload");
    const { branches, selectedBranch, changeBranch, isSingleBranch } = useBranch();
    const { formType } = useParams();

    const config = useMemo(() => {
        const baseConfig = FORMS_CONFIG[formType];
        if (baseConfig) return baseConfig;

        return {
            title: formType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Forms",
            subtitle: `Compliance documents for ${formType}.`,
            emptyStateText: `No records found for ${formType}.`,
            forms: []
        };
    }, [formType]);

    const [selectedFormCode, setSelectedFormCode] = useState("");

    const selectedForm = useMemo(() => {
        if (!config.forms || config.forms.length === 0) {
            return { code: formType, name: config.title, periodType: "MONTH" };
        }
        return config.forms.find(f => f.code === selectedFormCode) || config.forms[0];
    }, [config, selectedFormCode, formType]);

    useEffect(() => {
        if (config.forms && config.forms.length > 0 && !selectedFormCode) {
            setSelectedFormCode(config.forms[0].code);
        }
    }, [config, selectedFormCode]);

    const [availableList, setAvailableList] = useState([]);
    const [missingList, setMissingList] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [activeTab, setActiveTab] = useState("Available");
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [filters, setFilters] = useState({
        search: "",
        departmentId: "",
        month: new Date().toLocaleString('en-US', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        financialYear: "2024-25"
    });

    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTab, selectedBranch, filters.departmentId, filters.month, filters.year, filters.financialYear, selectedFormCode]);

    const fetchMasterData = async () => {
        try {
            if (selectedBranch) {
                const response = await getDepartments(selectedBranch);
                setDepartments(response || []);
            } else {
                setDepartments([]);
                setFilters(prev => ({ ...prev, departmentId: "" }));
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchData = useCallback(async () => {
        if (!selectedForm.code) return;
        setLoading(true);
        try {
            const params = {
                formCode: selectedForm.code,
                periodType: selectedForm.periodType,
                docType: "FORM",
                branchId: selectedBranch,
                departmentId: filters.departmentId
            };

            if (selectedForm.periodType === "FY") {
                params.financialYear = filters.financialYear;
            } else if (selectedForm.periodType === "MONTH") {
                params.year = parseInt(filters.year);
                params.month = MONTH_MAP[filters.month] || parseInt(filters.month);
            } else if (selectedForm.periodType === "HALF_YEAR") {
                params.year = parseInt(filters.year);
            }

            const response = await getEmployeesByForm(params);
            setAvailableList(response.available || []);
            setMissingList(response.missing || []);
            setSummary(response.summary || null);
        } catch (error) {
            console.error("Error fetching form data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedForm, filters, selectedBranch]);

    useEffect(() => { fetchMasterData(); }, [selectedBranch]);
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const stats = useMemo(() => {
        const data = summary || { total: 0, available: 0, missing: 0 };
        return [
            { label: "Total Employees", value: data.total, icon: <Users size={18} />, color: "blue" },
            { label: "Documents Available", value: data.available, icon: <CheckCircle size={18} />, color: "green" },
            { label: "Pending Uploads", value: data.missing, icon: <AlertCircle size={18} />, color: "orange" }
        ];
    }, [summary]);

    const handleView = (emp) => emp.view_url && window.open(emp.view_url, "_blank");
    const handleDownload = (emp) => emp.download_url && window.open(emp.download_url, "_blank");

    const getPeriodData = () => {
        const data = {
            docType: "FORM",
            formCode: selectedForm.code,
            periodType: selectedForm.periodType
        };
        if (selectedForm.periodType === "FY") data.financialYear = filters.financialYear;
        else if (selectedForm.periodType === "MONTH") {
            data.year = parseInt(filters.year);
            data.month = MONTH_MAP[filters.month] || parseInt(filters.month);
        } else if (selectedForm.periodType === "HALF_YEAR") data.year = parseInt(filters.year);
        return data;
    };

    const handleUpload = async (emp, file) => {
        if (!file) return;
        setUploading(true);
        try {
            await uploadEmployeeForm({
                employeeId: emp.employee_id || emp.id,
                ...getPeriodData(),
                file
            });
            fetchData();
        } catch (error) { alert("Upload failed: " + error.message); }
        finally { setUploading(false); }
    };

    const handleReplace = async (emp, file) => {
        if (!file || !window.confirm("Replace existing document?")) return;
        setUploading(true);
        try {
            await replaceEmployeeForm({
                employeeId: emp.employee_id || emp.id,
                ...getPeriodData(),
                file
            });
            fetchData();
        } catch (error) { alert("Replace failed: " + error.message); }
        finally { setUploading(false); }
    };

    const handleDelete = async (emp) => {
        if (!window.confirm("Permanently delete this document?")) return;
        setUploading(true);
        try {
            await deleteEmployeeForm({
                employeeId: emp.employee_id || emp.id,
                ...getPeriodData()
            });
            fetchData();
        } catch (error) { alert("Delete failed: " + error.message); }
        finally { setUploading(false); }
    };

    const filteredData = useMemo(() => {
        const list = activeTab === "Available" ? availableList : missingList;
        if (!filters.search) return list;
        const s = filters.search.toLowerCase();
        return list.filter(e => (e.full_name || "").toLowerCase().includes(s) || (e.employee_code || "").toLowerCase().includes(s));
    }, [activeTab, availableList, missingList, filters.search]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredData.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredData.map(e => e.id || e.employee_id)));
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    const handleExport = () => {
        const selectedData = filteredData.filter(e => selectedIds.has(e.id || e.employee_id));
        if (selectedData.length === 0) return;
        const headers = ["Code", "Name", "Phone", "Joined", "Branch", "Dept", "Form", "Period", "Status"];
        const rows = selectedData.map(e => [
            `"${e.employee_code || ''}"`, `"${e.full_name || ''}"`, `"${e.phone || ''}"`,
            `"${e.joining_date ? new Date(e.joining_date).toLocaleDateString('en-GB') : '-'}"`,
            `"${e.branch_name || ''}"`, `"${e.department_name || ''}"`, `"${selectedForm.name}"`,
            `"${selectedForm.periodType === 'FY' ? filters.financialYear : filters.month + ' ' + filters.year}"`, `"${activeTab}"`
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `FormsExport.csv`; a.click();
        setSelectedIds(new Set());
    };

    // Columns object was removed natively

    return (
        <div className="page-container fade-in">
            <PageHeader title={config.title} subtitle={config.subtitle}
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
                            {config.forms?.length > 0 && <select value={selectedFormCode} onChange={(e) => setSelectedFormCode(e.target.value)}>{config.forms.map(f => <option key={f.code} value={f.code}>{f.name}</option>)}</select>}
                            {selectedForm.periodType === "FY" && <select value={filters.financialYear} onChange={(e) => handleFilterChange("financialYear", e.target.value)}>{["2023-24", "2024-25", "2025-26"].map(y => <option key={y} value={y}>{y}</option>)}</select>}
                            {selectedForm.periodType === "MONTH" && (
                                <><select value={filters.month} onChange={(e) => handleFilterChange("month", e.target.value)}>{Object.keys(MONTH_MAP).map(m => <option key={m} value={m}>{m}</option>)}</select>
                                    <select value={filters.year} onChange={(e) => handleFilterChange("year", e.target.value)}>{[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}</select></>
                            )}
                        </div>
                    </div>
                }
            />
            <SummaryCards cards={stats} />
            <FiltersBar search={filters.search} onSearchChange={v => handleFilterChange("search", v)}>
                {!isSingleBranch && <select value={selectedBranch || "ALL"} onChange={e => changeBranch(e.target.value === "ALL" ? null : Number(e.target.value))}>
                    {branches.length > 1 && <option value="ALL">All Branches</option>}{branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>}
                <select value={filters.departmentId} onChange={e => handleFilterChange("departmentId", e.target.value)} disabled={!selectedBranch}>
                    <option value="">{selectedBranch ? "All Departments" : "Select Branch"}</option>{departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
                <div className="tab-toggle-container ml-auto">
                    {["Available", "Upload"].map(t => <button key={t} className={`tab-btn ${activeTab === t ? 'active' : 'inactive'}`} onClick={() => setActiveTab(t)}>{t}</button>)}
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
                                            <FileOutput size={24} color="#94a3b8" />
                                            <div>No {activeTab.toLowerCase()} documents</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((e) => {
                                    const eid = e.id || e.employee_id;
                                    const isSelected = selectedIds.has(eid);
                                    return (
                                        <tr key={eid} className={isSelected ? 'row-selected' : ''}>
                                            <td className="checkbox-cell text-center">
                                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(eid)} />
                                            </td>
                                            <td className="col-profile text-center">
                                                <img
                                                    src={e.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name)}&background=EFF6FF&color=3B82F6&bold=true`}
                                                    alt={e.full_name}
                                                    className="attendance-avatar-sm"
                                                    style={{ margin: '0 auto' }}
                                                    onError={(err) => {
                                                        err.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name || 'U')}&background=EFF6FF&color=3B82F6&bold=true`;
                                                    }}
                                                />
                                            </td>
                                            <td className="text-center font-semibold" style={{ fontWeight: '600', color: '#1e293b' }}>
                                                {e.employee_code}
                                            </td>
                                            <td className="text-center">{e.full_name}</td>
                                            <td className="text-center font-mono">{e.phone || "—"}</td>
                                            <td className="text-center">{e.joining_date ? new Date(e.joining_date).toLocaleDateString('en-GB') : "—"}</td>
                                            <td className="text-center">{e.branch_name || "—"}</td>
                                            <td className="text-center">{e.department_name || "—"}</td>
                                            <td className="text-center">
                                                <StatusBadge type={activeTab === "Available" ? "success" : "warning"} label={activeTab} />
                                            </td>
                                            <td className="text-center">
                                                <div className="actions-group" style={{ justifyContent: 'center' }}>
                                                    {activeTab === "Available" ? (
                                                        <>
                                                            <button className="action-btn view" onClick={() => handleView(e)} title="View"><Eye size={16} strokeWidth={2.5} /></button>
                                                            <button className="action-btn download" onClick={() => handleDownload(e)} title="Download"><Download size={16} strokeWidth={2.5} /></button>
                                                            <div className="relative">
                                                                <input type="file" style={{ display: "none" }} id={`r-${eid}`} onChange={(ev) => handleReplace(e, ev.target.files[0])} disabled={uploading} />
                                                                <label htmlFor={`r-${eid}`} className="action-btn replace" style={{ cursor: 'pointer' }}><Upload size={16} strokeWidth={2.5} /></label>
                                                            </div>
                                                            <button className="action-btn delete" onClick={() => handleDelete(e)} title="Delete"><Trash2 size={16} strokeWidth={2.5} /></button>
                                                        </>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="file" style={{ display: "none" }} id={`u-${eid}`} onChange={(ev) => handleUpload(e, ev.target.files[0])} disabled={uploading} />
                                                            <label htmlFor={`u-${eid}`} className="action-btn upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={16} strokeWidth={2.5} /></label>
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
        </div>
    );
};

export default EmployeeFormsPage;
