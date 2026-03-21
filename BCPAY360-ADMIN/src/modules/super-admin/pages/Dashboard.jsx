import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminApi } from "../../../api/superAdmin.api";
import { Loader } from "../../module/components";
import { FaPlus } from "react-icons/fa";
import "../styles/superadmin.css";

// --- Consolidated Mini-Components ---
function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h2>{value}</h2>
    </div>
  );
}

function CompanyCard({ company, onEdit }) {
  return (
    <div className="company-card" onClick={() => onEdit(company.id)} style={{ cursor: 'pointer' }}>
      <div className="card-top">
        <h3 className="company-name">{company.company_name || company.name}</h3>
        <span className={`status-badge ${company.is_active ? "active" : "inactive"}`}>
          {company.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <p className="company-email">{company.email}</p>
    </div>
  );
}

function CompanyCards({ companies, onEdit }) {
  if (!companies.length) {
    return (
      <div className="company-empty">
        <h3>No companies yet</h3>
        <p>Create a company to get started</p>
      </div>
    );
  }

  return (
    <div className="company-grid">
      {companies.map(c => (
        <CompanyCard key={c.id} company={c} onEdit={onEdit} />
      ))}
    </div>
  );
}
// ------------------------------------

export default function Dashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await superAdminApi.getCompanies();
      
      let actCompanies = Array.isArray(response) ? response : (response?.data || []);
      setCompanies(actCompanies);

      if (response && response.stats) {
        setStats(response.stats);
      } else {
        setStats({
          total: actCompanies.length,
          active: actCompanies.filter(c => c.is_active).length,
          inactive: actCompanies.filter(c => !c.is_active).length
        });
      }
    } catch (error) {
      console.error("Failed to fetch companies", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="super-admin-page" style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="super-admin-page dashboard">
      <div className="sa-dashboard-header">
        <div>
          <h1>Super Admin Dashboard</h1>
          <p>Real-time overview of across all managed companies.</p>
        </div>
        <button 
          className="sa-btn sa-btn-primary" 
          onClick={() => navigate("/super-admin/create")}
        >
          <FaPlus /> Create Company
        </button>
      </div>

      <div className="sa-stat-grid">
        <StatCard label="Total Companies" value={stats.total} />
        <StatCard label="Active Companies" value={stats.active} />
        <StatCard label="Inactive Companies" value={stats.inactive} />
      </div>

      <div className="dashboard-section sa-glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontWeight: "700" }}>Manage Companies</h3>
        </div>
        <CompanyCards companies={companies} onEdit={(id) => navigate(`/super-admin/edit/${id}`)} />
      </div>
    </div>
  );
}
