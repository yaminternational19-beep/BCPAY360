import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
  XCircle,
  Clock,
  ExternalLink,
  Pencil,
  Ban,
  FileCheck
} from "lucide-react";
import "../styles/EmployeeView.css";
import {
  getEmployeeById,
  deleteEmployeeById,
  activateEmployeeById,
  updateEmployeeById
} from "../../../api/employees.api";
import { useToast } from "../../../context/ToastContext";
import EmployeeForm from "../components/EmployeeForm";

const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 }
];


const FormDocCard = ({ doc }) => {
  const period = doc.period_type === "MONTH" ? `${doc.doc_month} ${doc.doc_year}` : (doc.financial_year || "N/A");

  return (
    <div className="form-doc-card">
      <div className="doc-info-main">
        <div className="doc-title-row">
          <FileText size={14} className="text-muted" />
          <span className="doc-form-code">{doc.form_code}</span>
          <span className="doc-period-badge">{period}</span>
        </div>
      </div>
      <div className="doc-actions">
        <a href={doc.view_url} target="_blank" rel="noreferrer" className="action-link view" title="View"><Eye size={14} /></a>
        <a href={doc.download_url} target="_blank" rel="noreferrer" className="action-link download" title="Download"><Download size={14} /></a>
      </div>
    </div>
  );
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState({
    employee: null,
    organization: null,
    profile: null,
    auth: null,
    documents: [],
    form_documents: []
  });

  const [docFilters, setDocFilters] = useState({
    month: "All",
    year: "All"
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const res = await getEmployeeById(id);

      if (!res) {
        setError("Employee not found");
        return;
      }

      setData({
        employee: res.employee || null,
        organization: res.organization || null,
        profile: res.profile || null,
        auth: res.auth || null,
        // The API now returns core documents in 'upload' and periodic ones in 'form_documents'
        documents: Array.isArray(res.upload) ? res.upload : [],
        form_documents: Array.isArray(res.form_documents) ? res.form_documents : [],
        generatedMap: (Array.isArray(res.upload) ? res.upload : []).reduce((acc, doc) => {
          if (doc.document_type) acc[doc.document_type] = doc;
          return acc;
        }, {})
      });
    } catch (err) {
      setError(err.message || "Unable to load employee details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const availableYears = useMemo(() => {
    const years = new Set();
    data.form_documents.forEach((doc) => {
      if (doc.doc_year) years.add(doc.doc_year.toString());
    });
    return ["All", ...Array.from(years).sort((a, b) => b - a)];
  }, [data.form_documents]);

  const filteredFormDocs = useMemo(() => {
    return data.form_documents.filter((doc) => {
      const matchMonth =
        docFilters.month === "All" || doc.doc_month == docFilters.month;
      const matchYear =
        docFilters.year === "All" ||
        (doc.doc_year && doc.doc_year.toString() === docFilters.year);
      return matchMonth && matchYear;
    });
  }, [data.form_documents, docFilters]);

  const groupedFormDocs = useMemo(() => {
    return {
      monthly: filteredFormDocs.filter((doc) => doc.period_type === "MONTH"),
      financial: filteredFormDocs.filter((doc) => doc.period_type === "FY"),
    };
  }, [filteredFormDocs]);

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate employee account?")) return;
    setToggling(true);
    try {
      await deleteEmployeeById(id);
      setData(prev => ({
        ...prev,
        employee: { ...prev.employee, status: 'INACTIVE', employee_status: 'INACTIVE' }
      }));
      toast.success("Employee deactivated");
    } catch (err) {
      toast.error(err.message || "Failed to deactivate");
    } finally {
      setToggling(false);
    }
  };

  const handleActivate = async () => {
    if (!window.confirm("Activate employee account?")) return;
    setToggling(true);
    try {
      await activateEmployeeById(id);
      setData(prev => ({
        ...prev,
        employee: { ...prev.employee, status: 'ACTIVE', employee_status: 'ACTIVE' }
      }));
      toast.success("Employee activated");
    } catch (err) {
      toast.error(err.message || "Failed to activate");
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!window.confirm("Delete employee measurement permanently?\nThis cannot be undone.")) return;
    try {
      await deleteEmployeeById(id, true);
      toast.success("Employee deleted permanently");
      navigate('/admin/employees');
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleEditSave = async (formData) => {
    try {
      await updateEmployeeById(id, formData);
      toast.success("Employee profile updated successfully");
      setShowEditForm(false);
      fetchEmployeeData(); // Refresh data
    } catch (err) {
      toast.error(err.message || "Failed to update employee");
    }
  };

  if (loading) {
    return (
      <div className="employee-view-loading">
        <div className="spinner"></div>
        <p>Loading employee profile...</p>
      </div>
    );
  }

  if (error || !data.employee) {
    return (
      <div className="employee-view-error">
        <XCircle size={48} color="#ef4444" />
        <h2>{error || "Not Found"}</h2>
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const { employee, profile, auth, documents } = data;

  // Extract organization details (they come nested in employee in the latest API)
  const organization = {
    branch: employee?.branch || data.organization?.branch,
    department: employee?.department || data.organization?.department,
    designation: employee?.designation || data.organization?.designation,
    shift: employee?.shift || data.organization?.shift,
    employeeType: employee?.employee_type || data.organization?.employeeType
  };

  const fullName = employee?.full_name || employee?.fullName || "";
  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    : "??";

  const status = employee?.employee_status || employee?.status || "INACTIVE";
  const isActive = String(status).toUpperCase() === "ACTIVE";

  // Unified data source for bio-info (latest API flattens these into the employee object)
  const bio = {
    ...profile,
    ...employee // Higher priority for flattened fields in newest API
  };

  return (
    <div className="employee-view-container">
      {/* Edit Modal */}
      {showEditForm && (
        <EmployeeForm
          initial={data}
          onSave={handleEditSave}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* Top Navigation */}
      <div className="view-nav" style={{ marginBottom: "16px" }}>
        <button
          className="back-link"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontWeight: "600",
            color: "#475569",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            transition: "all 0.2s"
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Hero Section */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="hero-avatar-wrapper">
            {bio?.profile_photo_url ? (
              <img
                src={bio.profile_photo_url}
                alt={fullName}
                className="hero-avatar-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="hero-avatar-initials"
              style={{ display: bio?.profile_photo_url ? "none" : "flex" }}
            >
              {initials}
            </div>
          </div>

          <div className="hero-text">
            <h1>{fullName}</h1>
            <div className="hero-pills">
              <span className="pill code">{employee?.employee_code || employee?.employeeCode}</span>
              <span className={`pill status ${status.toLowerCase()}`}>
                {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="quick-stats">
            <div className="q-stat">
              <label>Department</label>
              <span>{employee?.department_name || organization?.department?.name || "-"}</span>
            </div>
            <div className="q-stat">
              <label>Designation</label>
              <span>{employee?.designation_name || organization?.designation?.name || "-"}</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn-edit" onClick={() => setShowEditForm(true)}>
              <Pencil size={18} /> Edit Profile
            </button>
            {isActive ? (
              <button className="btn-warning-outline" onClick={handleDeactivate} disabled={toggling}>
                <Ban size={18} /> Deactivate
              </button>
            ) : (
              <button className="btn-primary" onClick={handleActivate} disabled={toggling}>
                <CheckCircle2 size={18} /> Activate
              </button>
            )}
            <button className="btn-danger" onClick={handleDeleteEmployee}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content-grid">
        {/* Main Details Column */}
        <div className="main-info-column">

          {/* Section: Employment Details */}
          <div className="details-card">
            <div className="details-card-header">
              <Briefcase size={20} />
              <h2>Employment Details</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Employee Code</label>
                <span>{employee?.employee_code || employee?.employeeCode}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={status.toLowerCase()}>{status}</span>
              </div>
              <div className="detail-item">
                <label>Joining Date</label>
                <span>{employee?.joining_date || employee?.joiningDate ? new Date(employee?.joining_date || employee?.joiningDate).toLocaleDateString('en-GB') : "-"}</span>
              </div>
              <div className="detail-item">
                <label>Confirmation Date</label>
                <span>{(employee?.confirmation_date || employee?.confirmationDate) ? new Date(employee?.confirmation_date || employee?.confirmationDate).toLocaleDateString('en-GB') : "-"}</span>
              </div>
              <div className="detail-item">
                <label>Experience</label>
                <span>{employee?.experience_years || employee?.experienceYears || "0"} Years</span>
              </div>
              <div className="detail-item">
                <label>Notice Period</label>
                <span>{employee?.notice_period_days || employee?.noticePeriodDays || "0"} Days</span>
              </div>
            </div>
          </div>

          {/* Section: Organization Details */}
          <div className="details-card">
            <div className="details-card-header">
              <Building2 size={20} />
              <h2>Organization Details</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Branch</label>
                <span>{employee?.branch_name || organization?.branch?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Department</label>
                <span>{employee?.department_name || organization?.department?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Designation</label>
                <span>{employee?.designation_name || organization?.designation?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Employee Type</label>
                <span>{employee?.employee_type_name || organization?.employeeType?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Shift</label>
                <span>{employee?.shift_name || organization?.shift?.name || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Job Location</label>
                <span>{employee?.job_location || employee?.jobLocation || "-"}</span>
              </div>
            </div>
          </div>

          {/* Section: Contact Details */}
          <div className="details-card">
            <div className="details-card-header">
              <Mail size={20} />
              <h2>Contact Details</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item full-width">
                <label>Email Address</label>
                <span className="with-icon"><Mail size={14} /> {employee?.email || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <span className="with-icon"><Phone size={14} /> {employee?.country_code || employee?.countryCode || ""} {employee?.phone_number || employee?.phone || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Emergency Contact</label>
                <span className="with-icon"><Phone size={14} /> {bio?.emergency_country_code || ""} {bio?.emergency_contact_number || bio?.emergency_contact || "-"}</span>
              </div>
            </div>
          </div>

          {/* Section: Personal Profile */}
          <div className="details-card">
            <div className="details-card-header">
              <User size={20} />
              <h2>Personal Profile</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Gender</label>
                <span>{bio?.gender || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Date of Birth</label>
                <span>{bio?.dob ? new Date(bio.dob).toLocaleDateString('en-GB') : "-"}</span>
              </div>
              <div className="detail-item">
                <label>Religion</label>
                <span>{bio?.religion || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Marital Status</label>
                <span>{bio?.marital_status || bio?.maritalStatus || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Father's Name</label>
                <span>{bio?.father_name || bio?.fatherName || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Qualification</label>
                <span>{bio?.qualification || "-"}</span>
              </div>
              <div className="detail-item full-width">
                <label>Current Address</label>
                <span className="with-icon"><MapPin size={14} /> {bio?.address || "-"}</span>
              </div>
              <div className="detail-item full-width">
                <label>Permanent Address</label>
                <span className="with-icon"><MapPin size={14} /> {bio?.permanent_address || bio?.permanentAddress || "-"}</span>
              </div>
            </div>
          </div>

          {/* Section: Statutory Details */}
          <div className="details-card">
            <div className="details-card-header">
              <FileCheck size={20} />
              <h2>Statutory Details</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Aadhaar Number</label>
                <span>{bio?.aadhaar_number || "-"}</span>
              </div>
              <div className="detail-item">
                <label>PAN Number</label>
                <span>{bio?.pan_number || "-"}</span>
              </div>
              <div className="detail-item">
                <label>UAN Number</label>
                <span>{bio?.uan_number || "-"}</span>
              </div>
              <div className="detail-item">
                <label>ESIC Number</label>
                <span>{bio?.esic_number || "-"}</span>
              </div>
            </div>
          </div>

          {/* Section: Salary & Bank */}
          <div className="details-card">
            <div className="details-card-header">
              <CreditCard size={20} />
              <h2>Salary & Banking</h2>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <label>Monthly Salary</label>
                <span>₹{Number(employee?.salary || 0).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Annual CTC</label>
                <span>₹{Number(employee?.ctc_annual || 0).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Bank Name</label>
                <span>{bio?.bank_name || bio?.bankName || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Account Number</label>
                <span>{bio?.account_number || bio?.accountNumber || "-"}</span>
              </div>
              <div className="detail-item">
                <label>IFSC Code</label>
                <span>{bio?.ifsc_code || bio?.ifscCode || "-"}</span>
              </div>
              <div className="detail-item">
                <label>Bank Branch</label>
                <span>{bio?.bank_branch_name || bio?.bankBranchName || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="sidebar-column">

          {/* Documents Section */}
          {/* Documents Section */}
          <div className="details-card sticky-card">
            <div className="details-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} />
                <h2>Documents</h2>
              </div>
            </div>

            <div className="sidebar-body" style={{ padding: '12px' }}>
              <h5 style={{
                margin: '0 0 8px 0',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-secondary)'
              }}>
                Uploaded Documents
              </h5>

              <div className="document-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {documents.length > 0 ? (
                  documents.filter(doc => (doc.document_type || doc.type) !== 'profile_photo').map((doc, idx) => (
                    <div
                      key={idx}
                      className="doc-card-simple"
                      style={{
                        padding: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={16} className="text-muted" />
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {doc.friendly_name || (doc.document_type || doc.type || "").replace(/_/g, " ")}
                        </span>
                      </div>
                      <a
                        href={doc.file_url || doc.view_url || doc.download_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-icon-sm"
                        style={{ color: '#3b82f6' }}
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '12px', minHeight: 'auto' }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>No uploaded documents</p>
                  </div>
                )}
              </div>

              {/* Form Documents Upgrade */}
              <h5 className="doc-section-title" style={{ marginTop: '32px' }}>
                Form / Compliance Documents
              </h5>

              <div className="doc-filters" style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '12px' }}>
                <select
                  value={docFilters.month}
                  onChange={e => setDocFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="filter-select-sm"
                >
                  <option value="All">All Months</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select
                  value={docFilters.year}
                  onChange={e => setDocFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="filter-select-sm"
                >
                  {availableYears.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>)}
                </select>
              </div>

              <div className="form-docs-container">
                <h6 className="doc-sub-section-title">Monthly Documents</h6>
                <div className="document-stack" style={{ marginBottom: '24px' }}>
                  {groupedFormDocs.monthly.length > 0 ? (
                    groupedFormDocs.monthly.map((doc, idx) => (
                      <FormDocCard key={idx} doc={doc} />
                    ))
                  ) : (
                    <p className="empty-text-sm">No monthly documents match the filters</p>
                  )}
                </div>

                <h6 className="doc-sub-section-title">Financial Year Documents</h6>
                <div className="document-stack">
                  {groupedFormDocs.financial.length > 0 ? (
                    groupedFormDocs.financial.map((doc, idx) => (
                      <FormDocCard key={idx} doc={doc} />
                    ))
                  ) : (
                    <p className="empty-text-sm">No financial year documents match the filters</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Section */}
          <div className="details-card">
            <div className="details-card-header">
              <Clock size={20} />
              <h2>System Audit</h2>
            </div>
            <div className="sidebar-body">
              <div className="audit-item">
                <label>Created At</label>
                <span>{employee.created_at || employee.createdAt ? new Date(employee.created_at || employee.createdAt).toLocaleString() : "-"}</span>
              </div>
              <div className="audit-item">
                <label>Last Updated</label>
                <span>{employee.updated_at || employee.updatedAt ? new Date(employee.updated_at || employee.updatedAt).toLocaleString() : "-"}</span>
              </div>
              <div className="audit-item">
                <label>Access Status</label>
                <span>{auth?.is_active || auth?.isActive ? "Login Enabled" : "Login Disabled"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
