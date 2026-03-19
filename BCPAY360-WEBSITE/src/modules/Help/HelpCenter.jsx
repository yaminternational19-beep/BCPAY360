import React, { useState, useEffect } from "react";
import { MdEmail, MdPhone, MdSend, MdSupportAgent } from "react-icons/md";
import api from "../../utils/api";
import { toast } from "react-toastify";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const HelpCenter = ({ isDarkTheme }) => {
  // 🔥 Form aur User data ke states
  const [userData, setUserData] = useState({ name: "Loading...", email: "Loading..." });
  const [formData, setFormData] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // 🔥 Nayi API (HR & Admin) ke liye state
  const [contacts, setContacts] = useState({ hr: [], admin: [] });
  const [loadingContacts, setLoadingContacts] = useState(true);

  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    cardBg: isDarkTheme ? colors.darkHover : "#ffffff",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    inputBg: isDarkTheme ? "rgba(0,0,0,0.2)" : "#f8fafc",
    disabledBg: isDarkTheme ? "rgba(255,255,255,0.05)" : "#e2e8f0",
  };

  useEffect(() => {
    // 1. Profile Data Fetch (For Name & Email)
    const fetchUserForSupport = async () => {
      try {
        const res = await api.get("/profile");
        const emp = res.data?.employee || res.data?.data || {};
        setUserData({
          name: emp.full_name || emp.first_name || "Employee",
          email: emp.email || "No Email Found"
        });
      } catch (error) {
        console.error("Failed to load user info:", error);
        setUserData({ name: "Not Available", email: "Not Available" });
      }
    };

    // 2. 🔥 Naya API Fetch (For HR & Admin Contacts)
    const fetchSupportDetails = async () => {
      setLoadingContacts(true);
      try {
        const res = await api.get("/support-details");
        if (res.data?.success) {
          setContacts(res.data.contacts || { hr: [], admin: [] });
        }
      } catch (error) {
        console.error("Failed to fetch support contacts:", error);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchUserForSupport();
    fetchSupportDetails();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) return toast.warning("Please select a subject");
    if (!formData.message.trim()) return toast.warning("Please enter your message");

    setSubmitting(true);
    try {
      const payload = {
        full_name: userData.name,
        email: userData.email,
        category: formData.subject,
        reason: formData.message
      };

      await api.post("/support", payload);
      
      toast.success("Support ticket submitted successfully!");
      setFormData({ subject: "", message: "" }); // Reset form
    } catch (error) {
      console.error("Support API Error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const ContactCard = ({ person }) => (
    <div style={{
      display: "flex", flexDirection: "column", gap: "6px",
      background: theme.cardBg, padding: "12px",
      borderRadius: "8px", border: `1px solid ${theme.border}`,
      fontSize: "12px", marginBottom: "8px"
    }}>
      <strong style={{ color: theme.text, fontSize: "14px", textTransform: "capitalize" }}>
        {person.name} {person.branch_name ? `(${person.branch_name})` : ""}
      </strong>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.muted }}>
        <MdEmail size={14} color={colors.primary} /> {person.email}
      </div>
      {person.phone && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: theme.muted }}>
          <MdPhone size={14} color={colors.primary} /> {person.phone}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "10px" }}>
      
      {/* --- FORM SECTION --- */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <MdSupportAgent size={24} color={colors.primary} />
          <h3 style={{ margin: 0, color: theme.text, fontFamily: typography.fontFamily, fontSize: "16px" }}>
            Hi there, how can we help today?
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle(theme)}>Full Name</label>
              <input type="text" value={userData.name} readOnly style={{ ...inputStyle(theme), background: theme.disabledBg, cursor: "not-allowed", opacity: 0.8 }} />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label style={labelStyle(theme)}>Email Address</label>
              <input type="text" value={userData.email} readOnly style={{ ...inputStyle(theme), background: theme.disabledBg, cursor: "not-allowed", opacity: 0.8 }} />
            </div>
          </div>

          <div>
            <label style={labelStyle(theme)}>Subject <span style={{color: colors.status.absent.dot}}>*</span></label>
            <select name="subject" value={formData.subject} onChange={handleChange} style={{ ...inputStyle(theme), background: theme.inputBg }}>
              <option value="">-- Select Issue Type --</option>
              <option value="Login/Account Issue">Login / Account Access Issue</option>
              <option value="Attendance/Biometric">Attendance / Biometric Issue</option>
              <option value="Leave/Holiday">Leave / Holiday Query</option>
              <option value="Salary/Payroll">Salary / Payroll / Payslip</option>
              <option value="Profile/Documents">Profile / Documentation Update</option>
              <option value="Other">General Query / Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle(theme)}>Message <span style={{color: colors.status.absent.dot}}>*</span></label>
            <textarea 
              name="message" rows="3" value={formData.message} onChange={handleChange} 
              placeholder="Please describe your issue in detail..."
              style={{ ...inputStyle(theme), background: theme.inputBg, resize: "none" }}
            />
          </div>

          <button type="submit" disabled={submitting} style={{
            padding: "12px", borderRadius: "8px", background: colors.primary, color: "#fff",
            border: "none", fontWeight: "600", fontSize: "13px", cursor: submitting ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px"
          }}>
            {submitting ? "Sending..." : <><MdSend size={16} /> Send Message</>}
          </button>
        </form>
      </div>

      <div style={{ height: "1px", background: theme.border, marginBottom: "20px" }} />

      {/* --- DIRECT CONTACT SECTION --- */}
      <div>
        <p style={{ margin: "0 0 12px 0", color: theme.muted, fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
          Or reach out to us directly
        </p>

        {loadingContacts ? <div style={{ color: theme.muted, fontSize: "12px" }}>Loading contacts...</div> : null}

        {!loadingContacts && contacts.hr?.length === 0 && contacts.admin?.length === 0 && (
          <div style={{ color: theme.muted, fontSize: "12px" }}>Contact information not available.</div>
        )}

        {contacts.hr?.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 8px 0", color: theme.text, fontSize: "13px" }}>HR Department</h4>
            {contacts.hr.map((hr, idx) => <ContactCard key={`hr-${idx}`} person={hr} />)}
          </div>
        )}

        {contacts.admin?.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: theme.text, fontSize: "13px" }}>System Admins</h4>
            {contacts.admin.map((admin, idx) => <ContactCard key={`admin-${idx}`} person={admin} />)}
          </div>
        )}
      </div>

    </div>
  );
};

// Common Styles
const labelStyle = (theme) => ({ fontSize: "11px", fontWeight: "700", color: theme.muted, marginBottom: "4px", display: "block", textTransform: "uppercase" });
const inputStyle = (theme) => ({ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, color: theme.text, fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: typography.fontFamily });

export default HelpCenter;