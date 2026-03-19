import React, { useState, useEffect } from "react";
import { 
  MdDescription, MdOutlineFileDownload, MdVisibility, 
  MdPersonOutline, MdOutlineAccountBalanceWallet, MdEventNote,
  MdDateRange
} from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../utils/api";
import colors from "../../styles/colors";
import DocumentPreviewModal from "../Profile/DocumentPreviewModal";

const Documents = ({ isDarkTheme }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PERSONAL, FORM
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/profile");
      const data = res?.data?.employee;

      if (data) {
        const mappedDocs = [
          ...(data.personal_documents || []).map(doc => ({
            id: doc.id,
            category: "PERSONAL",
            type: doc.document_type,
            viewUrl: doc.view_url,
            downloadUrl: doc.download_url,
            createdAt: doc.created_at // 🔥 Added created_at for personal docs
          })),
          ...(data.form_documents || []).map(doc => ({
            id: `${doc.form_code}_${doc.doc_year}_${doc.doc_month}`,
            category: "FORM",
            type: doc.form_code,
            year: doc.doc_year,
            month: doc.doc_month,
            viewUrl: doc.view_url,
            downloadUrl: doc.download_url
          }))
        ];
        
        // Sort Form docs by Year and Month (Latest First)
        mappedDocs.sort((a, b) => {
          if (a.category === "FORM" && b.category === "FORM") {
             if(a.year !== b.year) return b.year - a.year;
             return b.month - a.month;
          }
          return 0;
        });

        setDocuments(mappedDocs);
        setFilteredDocs(mappedDocs);
      }
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = documents;

    if (activeTab !== "ALL") result = result.filter(doc => doc.category === activeTab);
    if (filterYear !== "ALL") result = result.filter(doc => doc.category === "FORM" && String(doc.year) === filterYear);
    if (filterMonth !== "ALL") result = result.filter(doc => doc.category === "FORM" && String(doc.month) === filterMonth);

    setFilteredDocs(result);
  }, [activeTab, filterYear, filterMonth, documents]);

  const availableYears = [...new Set(documents.filter(d => d.category === "FORM" && d.year).map(d => d.year))].sort((a, b) => b - a);

  // --- HELPERS FOR UI ---
  const formatDocType = (type) => type ? type.replace(/_/g, " ").toUpperCase() : "DOCUMENT";
  
  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  // 🔥 Helper to format exact date (e.g., 25 Feb 2026)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDocIcon = (type, category) => {
    const t = type.toLowerCase();
    if (t.includes('pan') || t.includes('aadhaar') || t.includes('form') || t.includes('letter')) return <MdPersonOutline size={22} />;
    if (t.includes('salary')) return <MdOutlineAccountBalanceWallet size={22} />;
    if (t.includes('attendance') || t.includes('pf')) return <MdEventNote size={22} />;
    return <MdDescription size={22} />;
  };

  const theme = {
    bg: isDarkTheme ? colors.darkBg : colors.background,
    cardBg: isDarkTheme ? colors.darkDropdown : "#ffffff",
    text: isDarkTheme ? colors.textLight : "#1e293b",
    muted: isDarkTheme ? colors.darkMuted : "#64748b",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    tabBg: isDarkTheme ? "rgba(255,255,255,0.05)" : "#f1f5f9",
    activeTabBg: colors.primary,
  };

  if (loading) return <div style={{ padding: "40px", color: theme.text, textAlign: "center", fontWeight: "600" }}>Loading Documents...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto", color: theme.text, boxSizing: "border-box" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "800" }}>My Documents</h2>
          <p style={{ margin: 0, fontSize: "13px", color: theme.muted }}>View and download your official records.</p>
        </div>
        <span style={{ fontSize: "12px", background: `${colors.primary}15`, color: colors.primary, padding: "6px 14px", borderRadius: "20px", fontWeight: "700" }}>
          {filteredDocs.length} Files
        </span>
      </div>
      
      {/* MODERN TAB FILTERS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px", alignItems: "center" }}>
        
        {/* Pill Tabs */}
        <div style={{ display: "flex", background: theme.tabBg, padding: "4px", borderRadius: "12px", gap: "4px" }}>
          {["ALL", "PERSONAL", "FORM"].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if(tab !== "FORM") { setFilterYear("ALL"); setFilterMonth("ALL"); }
              }}
              style={{
                padding: "8px 16px", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                cursor: "pointer", transition: "all 0.3s ease",
                background: activeTab === tab ? theme.activeTabBg : "transparent",
                color: activeTab === tab ? "#fff" : theme.muted,
                boxShadow: activeTab === tab ? "0 4px 10px rgba(0,0,0,0.1)" : "none"
              }}
            >
              {tab === "ALL" ? "All Files" : tab === "PERSONAL" ? "Personal Docs" : "Company & Payroll"}
            </button>
          ))}
        </div>

        {/* Date Dropdowns (Only if Form Docs are relevant) */}
        {(activeTab === "FORM" || activeTab === "ALL") && availableYears.length > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={dropdownContainer(theme)}>
              <MdDateRange size={14} color={theme.muted} style={{ marginLeft: "10px" }} />
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={selectStyle(theme)}>
                <option value="ALL">All Years</option>
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>

            <div style={{ ...dropdownContainer(theme), opacity: filterYear === "ALL" ? 0.5 : 1 }}>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} disabled={filterYear === "ALL"} style={selectStyle(theme)}>
                <option value="ALL">All Months</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT CARDS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {filteredDocs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: theme.cardBg, borderRadius: "16px", border: `1px dashed ${theme.border}` }}>
            <MdDescription size={48} style={{ color: theme.border, marginBottom: "16px" }} />
            <h4 style={{ margin: "0 0 8px 0", color: theme.text, fontSize: "16px" }}>No documents found</h4>
            <p style={{ margin: 0, color: theme.muted, fontSize: "13px" }}>Try adjusting your filters to find what you're looking for.</p>
            {(activeTab !== "ALL" || filterYear !== "ALL") && (
              <button onClick={() => { setActiveTab("ALL"); setFilterYear("ALL"); setFilterMonth("ALL"); }} style={{ marginTop: "16px", padding: "8px 16px", background: colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} style={{
              background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: "16px",
              padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: "16px", transition: "0.2s ease"
            }}>
              
              {/* Left: Icon & Details */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 200px" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                  background: doc.category === "PERSONAL" ? "#f3e8ff" : "#e0f2fe",
                  color: doc.category === "PERSONAL" ? "#a855f7" : "#0ea5e9",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {getDocIcon(doc.type, doc.category)}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "700", fontSize: "15px", color: theme.text, wordBreak: "break-word" }}>
                    {formatDocType(doc.type)}
                  </span>
                  
                  {/* 🔥 DYNAMIC DATE INFO SECTION */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {doc.category === "PERSONAL" ? "Personal Record" : "Company Record"}
                    </span>
                    
                    {/* For Form Docs (Salary, Attendance) */}
                    {doc.category === "FORM" && (
                      <>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.border }} />
                        <span style={{ fontSize: "12px", fontWeight: "700", color: colors.primary }}>
                          {getMonthName(doc.month)} {doc.year}
                        </span>
                      </>
                    )}

                    {/* For Personal Docs (Aadhaar, PAN) */}
                    {doc.category === "PERSONAL" && doc.createdAt && (
                      <>
                        <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.border }} />
                        <span style={{ fontSize: "12px", fontWeight: "700", color: theme.muted }}>
                          Uploaded: {formatDate(doc.createdAt)}
                        </span>
                      </>
                    )}
                  </div>

                </div>
              </div>

              {/* Right: Action Buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => setPreviewDoc(doc)} style={ghostBtnStyle(theme)}>
                  <MdVisibility size={16} /> View
                </button>
                <a href={doc.downloadUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "flex" }}>
                  <button style={solidBtnStyle(theme)}>
                    <MdOutlineFileDownload size={16} /> Download
                  </button>
                </a>
              </div>
              
            </div>
          ))
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <DocumentPreviewModal 
          url={previewDoc.viewUrl} 
          type={previewDoc.type} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
    </div>
  );
};

/* --- UI Component Styles --- */
const dropdownContainer = (theme) => ({
  display: "flex", alignItems: "center", background: theme.cardBg, 
  border: `1px solid ${theme.border}`, borderRadius: "8px", overflow: "hidden"
});

const selectStyle = (theme) => ({
  padding: "8px 12px", border: "none", background: "transparent", color: theme.text, 
  fontSize: "13px", fontWeight: "600", outline: "none", cursor: "pointer", appearance: "none", minWidth: "100px"
});

const ghostBtnStyle = (theme) => ({
  padding: "8px 16px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: "transparent",
  color: theme.text, cursor: "pointer", fontWeight: "700", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s"
});

const solidBtnStyle = (theme) => ({
  padding: "8px 16px", borderRadius: "8px", border: "none", background: colors.primary,
  color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s"
});

export default Documents;