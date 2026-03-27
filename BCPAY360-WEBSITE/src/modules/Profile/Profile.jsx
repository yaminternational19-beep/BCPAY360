import React, { useState, useEffect, useRef } from "react";
import {
  MdDescription, MdKeyboardArrowRight, MdClose, 
  MdLockReset, MdDeleteForever, MdLogout, MdLocationCity, MdPerson, MdWork, MdCalendarToday,
  MdVisibility, MdOutlineFileDownload, MdPersonOutline, MdOutlineAccountBalanceWallet, MdEventNote, MdDateRange
} from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import api from "../../utils/api";
import ProfileHeader from "./ProfileHeader";
import ProfileInfoGrid from "./ProfileInfoGrid";
import PasswordModal from "./PasswordModal";
import DeleteModal from "./DeleteModal";
import EditProfileModal from "./EditProfileModal";
import DocumentPreviewModal from "./DocumentPreviewModal";
import SupportGrid from "../Help/SupportGrid"; 
import colors from "../../styles/colors";

// 🔥 UPGRADED DATA MAPPING: Taki saare filters modal mein kaam kar sakein
const mapEmployeeData = (data) => {
  const mappedDocs = [
    ...(data.personal_documents || []).map(doc => ({ 
      id: `personal_${doc.id}`, 
      category: "PERSONAL",
      type: doc.document_type, 
      viewUrl: doc.view_url, 
      downloadUrl: doc.download_url,
      createdAt: doc.created_at
    })),
    ...(data.form_documents || []).map((doc, index) => ({ 
      id: `form_${index}`, 
      category: "FORM",
      type: doc.form_code, 
      year: doc.doc_year,
      month: doc.doc_month,
      viewUrl: doc.view_url, 
      downloadUrl: doc.download_url 
    }))
  ];

  // Sort by newest first
  mappedDocs.sort((a, b) => {
    if (a.category === "FORM" && b.category === "FORM") {
       if(a.year !== b.year) return b.year - a.year;
       return b.month - a.month;
    }
    return 0;
  });

  return {
    name: data.full_name || "User",
    email: data.email || "—",
    phone: data.phone || "—",
    address: data.address || "—",
    permanentAddress: data.permanent_address || "—",
    designation: data.designation || "Employee",
    department: data.department || "—",
    employeeId: data.employee_code || "—",
    joiningDate: data.joining_date ? new Date(data.joining_date).toLocaleDateString('en-GB') : "—",
    organisationName: data.company_name || "—",
    profilePhotoUrl: data.profile_photo_url || null,
    documents: mappedDocs
  };
};

const Profile = ({ isDarkTheme }) => {
  const hasFetched = useRef(false);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [showDocsListModal, setShowDocsListModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile");
      const data = res?.data?.employee;
      if (data) {
        localStorage.setItem("userProfile", JSON.stringify(data));
        const mappedData = mapEmployeeData(data);
        setEmployee(mappedData);
        setProfilePhoto(mappedData.profilePhotoUrl);
      }
    } catch (err) {
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchProfile();
      hasFetched.current = true;
    }
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfilePhoto(previewUrl);
    window.dispatchEvent(new CustomEvent("updateNavbarPhoto", { detail: previewUrl }));

    try {
      const formData = new FormData();
      formData.append("profile_photo", file); 
      formData.append("full_name", employee.name);
      formData.append("email", employee.email);

      const res = await api.put("/edit-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        toast.success("Profile photo updated!");
        const newUrl = res.data.employee?.profile_photo_url;
        if (newUrl) {
          setProfilePhoto(newUrl);
          const stored = JSON.parse(localStorage.getItem("userProfile") || "{}");
          localStorage.setItem("userProfile", JSON.stringify({ ...stored, photo: newUrl }));
          window.dispatchEvent(new CustomEvent("updateNavbarPhoto", { detail: newUrl }));
        }
      }
    } catch (error) {
      toast.error("Server upload failed. Rolling back...");
      fetchProfile(); 
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  const theme = {
    bg: isDarkTheme ? colors.darkBg : colors.background,
    cardBg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : colors.border,
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: theme.text }}>Loading Profile...</div>;

  return (
    <div style={{ padding: "12px 16px", maxWidth: 1000, margin: "0 auto", background: theme.bg }}>
      <ToastContainer position="top-center" autoClose={3000} />

      <ProfileHeader employee={employee} profilePhoto={profilePhoto} onUpload={handlePhotoUpload} isDarkTheme={isDarkTheme} onEdit={() => setShowEditModal(true)} />
      <ProfileInfoGrid title="Work Information" isLocked isDarkTheme={isDarkTheme} items={[ { label: "Organization", value: employee.organisationName, icon: <MdLocationCity size={16} /> }, { label: "Employee ID", value: employee.employeeId, icon: <MdPerson size={16} /> }, { label: "Department", value: employee.department, icon: <MdWork size={16} /> }, { label: "Joining Date", value: employee.joiningDate, icon: <MdCalendarToday size={16} /> } ]} />

      {/* Documents Quick Access */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ fontSize: 14, marginBottom: 12, color: theme.text }}>Documents</h4>
        <div onClick={() => setShowDocsListModal(true)} style={quickCard(theme)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={quickIconBlue}><MdDescription size={20} /></div>
            <div>
              <div style={quickTitle(theme)}>View Documents</div>
              <div style={quickSub(theme)}>{employee.documents.length} files available</div>
            </div>
          </div>
          <MdKeyboardArrowRight size={20} color={theme.muted} />
        </div>
      </div>

      {/* Settings & Security */}
      <div style={{ marginTop: 24 }}>
        <h4 style={{ fontSize: 14, marginBottom: 12, color: theme.text }}>Security & Account</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SecurityItem theme={theme} icon={<MdLockReset />} title="Change Password" sub="Update credentials" onClick={() => setShowPassModal(true)} />
          <SecurityItem theme={theme} icon={<MdDeleteForever />} title="Delete Account" sub="Permanently remove your data" isDanger onClick={() => setShowDeleteModal(true)} />
          <SecurityItem theme={theme} icon={<MdLogout />} title="Logout" sub="Exit current session" isDanger onClick={() => setShowLogoutModal(true)} />
        </div>
      </div>

      <SupportGrid isDarkTheme={isDarkTheme} />

      {/* MODALS */}
      {showDocsListModal && <DocumentListModal theme={theme} docs={employee.documents} onClose={() => setShowDocsListModal(false)} onPreview={setPreviewDoc} isDarkTheme={isDarkTheme} />}
      {previewDoc && <DocumentPreviewModal url={previewDoc.viewUrl} type={previewDoc.type} isDarkTheme={isDarkTheme} onClose={() => setPreviewDoc(null)} />}
      
      {showEditModal && <EditProfileModal employee={employee} isDarkTheme={isDarkTheme} onClose={() => setShowEditModal(false)} onSuccess={fetchProfile} />}
      {showPassModal && <PasswordModal isDarkTheme={isDarkTheme} onClose={() => setShowPassModal(false)} />}
      {showDeleteModal && <DeleteModal isDarkTheme={isDarkTheme} onClose={() => setShowDeleteModal(false)} />}
      {showLogoutModal && <LogoutModal theme={theme} onConfirm={handleLogout} onClose={() => setShowLogoutModal(false)} />}
    </div>
  );
};

// --- Helper Components ---
const SecurityItem = ({ theme, icon, title, sub, onClick, isDanger }) => (
  <div onClick={onClick} style={{ ...quickCard(theme), border: isDanger ? `1px solid ${colors.status.absent.bg}` : `1px solid ${theme.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ ...quickIconBlue, background: isDanger ? colors.status.absent.dot : "linear-gradient(135deg,#0ea5e9,#0284c7)" }}>{icon}</div>
      <div>
        <div style={{ ...quickTitle(theme), color: isDanger ? colors.status.absent.dot : theme.text }}>{title}</div>
        <div style={quickSub(theme)}>{sub}</div>
      </div>
    </div>
    <MdKeyboardArrowRight size={20} color={theme.muted} />
  </div>
);

const LogoutModal = ({ theme, onConfirm, onClose }) => (
  <div style={overlayStyle}>
    <div style={{ width: "90%", maxWidth: 340, background: theme.cardBg, borderRadius: 16, padding: 24, textAlign: 'center', border: `1px solid ${theme.border}` }}>
      <h3 style={{ color: theme.text }}>Confirm Logout</h3>
      <p style={{ color: theme.muted, fontSize: 13, marginBottom: 20 }}>Are you sure you want to exit?</p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, padding: 10, borderRadius: 8, background: colors.status.absent.dot, color: '#fff', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>
    </div>
  </div>
);

// 🔥 UPGRADED DOCUMENT LIST MODAL (Exactly like Documents.jsx UI)
const DocumentListModal = ({ theme, docs, onClose, onPreview, isDarkTheme }) => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");

  const availableYears = [...new Set(docs.filter(d => d.category === "FORM" && d.year).map(d => d.year))].sort((a, b) => b - a);

  let filteredDocs = docs;
  if (activeTab !== "ALL") filteredDocs = filteredDocs.filter(doc => doc.category === activeTab);
  if (filterYear !== "ALL") filteredDocs = filteredDocs.filter(doc => doc.category === "FORM" && String(doc.year) === filterYear);
  if (filterMonth !== "ALL") filteredDocs = filteredDocs.filter(doc => doc.category === "FORM" && String(doc.month) === filterMonth);

  const formatDocType = (type) => type ? type.replace(/_/g, " ").toUpperCase() : "DOCUMENT";
  const getMonthName = (monthNum) => new Date(2000, monthNum - 1).toLocaleString('default', { month: 'short' });
  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const getDocIcon = (type, category) => {
    const t = type.toLowerCase();
    if (t.includes('pan') || t.includes('aadhaar') || t.includes('form')) return <MdPersonOutline size={20} />;
    if (t.includes('salary')) return <MdOutlineAccountBalanceWallet size={20} />;
    if (t.includes('attendance') || t.includes('pf')) return <MdEventNote size={20} />;
    return <MdDescription size={20} />;
  };

  const modalTheme = {
    tabBg: isDarkTheme ? "rgba(255,255,255,0.05)" : "#f1f5f9",
    activeTabBg: colors.primary,
    hoverBg: isDarkTheme ? "rgba(255,255,255,0.02)" : "#f8fafc"
  };

  return (
    <div style={overlayStyle}>
      <div style={{ width: "95%", maxWidth: 800, background: theme.cardBg, borderRadius: "16px", overflow: 'hidden', border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
        
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: theme.text, fontSize: "18px", fontWeight: "700" }}>My Documents</h3>
            <div style={{ fontSize: "11px", color: theme.muted, marginTop: "2px" }}>View and manage your files</div>
          </div>
          <MdClose onClick={onClose} size={24} color={theme.text} style={{ cursor: 'pointer', opacity: 0.6 }} />
        </div>

        {/* Filters Area */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", flexWrap: "wrap", gap: "12px", background: modalTheme.hoverBg }}>
          
          {/* Pill Tabs */}
          <div style={{ display: "flex", background: modalTheme.tabBg, padding: "4px", borderRadius: "12px", gap: "4px" }}>
            {["ALL", "PERSONAL", "FORM"].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if(tab !== "FORM") { setFilterYear("ALL"); setFilterMonth("ALL"); } }}
                style={{ padding: "6px 12px", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "0.3s", background: activeTab === tab ? modalTheme.activeTabBg : "transparent", color: activeTab === tab ? "#fff" : theme.muted }}
              >
                {tab === "ALL" ? "All Files" : tab === "PERSONAL" ? "Personal Docs" : "Company Docs"}
              </button>
            ))}
          </div>

          {/* Date Selectors */}
          {(activeTab === "FORM" || activeTab === "ALL") && availableYears.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "0 8px" }}>
                <MdDateRange size={14} color={theme.muted} />
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ padding: "6px", border: "none", background: "transparent", color: theme.text, fontSize: "12px", fontWeight: "600", outline: "none", cursor: "pointer" }}>
                  <option value="ALL">All Years</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} disabled={filterYear === "ALL"} style={{ padding: "6px 10px", border: `1px solid ${theme.border}`, borderRadius: "8px", background: theme.cardBg, color: theme.text, fontSize: "12px", fontWeight: "600", outline: "none", cursor: "pointer", opacity: filterYear === "ALL" ? 0.5 : 1 }}>
                <option value="ALL">All Months</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Scrollable List */}
        <div style={{ padding: "16px 20px", overflowY: 'auto', flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredDocs.length === 0 && <div style={{color: theme.muted, textAlign: "center", padding: "40px 20px"}}>No documents match your filters.</div>}
          
          {filteredDocs.map(doc => (
            <div key={doc.id} style={{ 
              display: 'flex', justifyContent: 'space-between', padding: "14px 16px", 
              border: `1px solid ${theme.border}`, borderRadius: "12px", alignItems: 'center',
              background: theme.cardBg, flexWrap: "wrap", gap: "16px"
            }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: doc.category === "PERSONAL" ? "#f3e8ff" : "#e0f2fe", color: doc.category === "PERSONAL" ? "#a855f7" : "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getDocIcon(doc.type, doc.category)}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: theme.text }}>{formatDocType(doc.type)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: theme.muted, textTransform: "uppercase" }}>{doc.category}</span>
                    {doc.category === "FORM" && <><span style={{width: 4, height: 4, borderRadius: '50%', background: theme.border}} /><span style={{ fontSize: "11px", fontWeight: "700", color: colors.primary }}>{getMonthName(doc.month)} {doc.year}</span></>}
                    {doc.category === "PERSONAL" && doc.createdAt && <><span style={{width: 4, height: 4, borderRadius: '50%', background: theme.border}} /><span style={{ fontSize: "11px", fontWeight: "600", color: theme.muted }}>Uploaded: {formatDate(doc.createdAt)}</span></>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: "8px" }}>
                <button onClick={() => onPreview(doc)} style={{ padding: '6px 12px', background: "transparent", border: `1px solid ${theme.border}`, color: theme.text, borderRadius: "8px", fontSize: "12px", cursor: 'pointer', display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }}><MdVisibility size={14} /> View</button>
                <a href={doc.downloadUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><button style={{ padding: '6px 12px', background: colors.primary, border: "none", color: '#fff', borderRadius: "8px", fontSize: "12px", cursor: 'pointer', display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }}><MdOutlineFileDownload size={14} /> Download</button></a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

/* --- Styles --- */
const quickCard = (theme) => ({ padding: "14px 16px", borderRadius: 12, background: theme.cardBg, border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" });
const quickIconBlue = { width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" };
const quickTitle = (theme) => ({ fontWeight: 600, fontSize: "14px" });
const quickSub = (theme) => ({ fontSize: 11, color: theme.muted, marginTop: 2 });
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 };

export default Profile;