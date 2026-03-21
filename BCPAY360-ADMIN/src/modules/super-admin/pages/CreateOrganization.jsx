import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { superAdminApi } from "../../../api/superAdmin.api";
import { Loader } from "../../module/components";
import "../../../styles/Forms.css";
import "../styles/superadmin.css";

export default function CreateOrganization() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    is_active: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadCompany();
    }
  }, [id]);

  const loadCompany = async () => {
    try {
      const company = await superAdminApi.getCompanyById(id);
      setForm({
        name: company.company_name || company.name || "",
        email: company.email || "",
        password: "", // Don't fetch password
        is_active: Boolean(company.is_active),
      });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load company details" });
    } finally {
      setFetching(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || (!isEdit && !form.password)) {
      return setMessage({ type: "error", text: "Please fill in all required fields" });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (isEdit) {
        await superAdminApi.updateCompany(id, {
          company_name: form.name,
          email: form.email,
          timezone: "Asia/Kolkata",
          logo_url: null,
          is_active: form.is_active
        });
        setMessage({ type: "success", text: "Organization updated successfully!" });
      } else {
        await superAdminApi.createCompany({
          company_name: form.name,
          email: form.email,
          password: form.password,
          timezone: "Asia/Kolkata",
          logo_url: null
        });
        setMessage({ type: "success", text: "Organization created successfully!" });
      }
      
      setTimeout(() => {
        navigate("/super-admin/dashboard");
      }, 2000);

    } catch (error) {
      setMessage({ type: "error", text: error.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="super-admin-page" style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="super-admin-page">
      <div className="sa-dashboard-header">
        <h1>{isEdit ? "Edit Company" : "Create Company"}</h1>
        <p>{isEdit ? "Update existing organization details." : "Register a new organization and master administrator."}</p>
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

        {isEdit && (
          <div className="sa-form-group">
            <label className="section-label">Organization Status</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  checked={form.is_active === true} 
                  onChange={() => setForm({ ...form, is_active: true })} 
                />
                Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  checked={form.is_active === false} 
                  onChange={() => setForm({ ...form, is_active: false })} 
                />
                Inactive
              </label>
            </div>
          </div>
        )}

        {!isEdit && (
          <div className="sa-form-group" style={{ position: "relative" }}>
            <label className="section-label">Password</label>
            <input
              className="sa-input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required={!isEdit}
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
        )}

        <button className="sa-btn sa-btn-primary" style={{ width: "100%", marginTop: "24px" }} disabled={loading}>
          {loading ? <Loader size="small" /> : isEdit ? "Update Organization" : "Create Organization"}
        </button>
      </form>
    </div>
  );
}
