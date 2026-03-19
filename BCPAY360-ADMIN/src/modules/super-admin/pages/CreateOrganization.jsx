import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminApi } from "../../../api/superAdmin.api";
import { Loader } from "../../module/components";
import "../../../styles/Forms.css";
import "../styles/superadmin.css";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return setMessage({ type: "error", text: "Please fill in all fields" });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Create Organization and Admin in a single unified API call
      await superAdminApi.createCompany({
        company_name: form.name,
        email: form.email,
        password: form.password,
        timezone: "Asia/Kolkata",
        logo_url: null
      });

      setMessage({ type: "success", text: "Organization and Admin created successfully!" });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/super-admin/dashboard");
      }, 2000);

    } catch (error) {
      setMessage({ type: "error", text: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-admin-page">
      <div className="sa-dashboard-header">
        <h1>Create Company</h1>
        <p>Register a new organization and master administrator.</p>
      </div>

      <form className="sa-glass-card sa-form-container" onSubmit={submit}>
        
        {message.text && (
          <div className={`sa-badge sa-badge-${message.type === 'success' ? 'success' : 'danger'}`} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", textAlign: 'center' }}>
            {message.text}
          </div>
        )}

        <div className="sa-form-group">
          <label className="section-label">Company Name</label>
          <input
            className="sa-input"
            placeholder="e.g. Acme Corporation"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="sa-form-group">
          <label className="section-label">Company Email</label>
          <input
            className="sa-input"
            type="email"
            placeholder="admin@company.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="sa-form-group" style={{ position: "relative" }}>
          <label className="section-label">Password</label>
          <input
            className="sa-input"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            minLength="6"
          />
          <button
            type="button"
            style={{ position: "absolute", right: "12px", top: "34px", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
            onClick={() => setShowPassword(p => !p)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button className="sa-btn sa-btn-primary" style={{ width: "100%", marginTop: "24px" }} disabled={loading}>
          {loading ? <Loader size="small" /> : "Create Organization"}
        </button>
      </form>
    </div>
  );
}
