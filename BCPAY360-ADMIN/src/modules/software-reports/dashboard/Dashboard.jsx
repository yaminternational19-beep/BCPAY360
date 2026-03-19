import React from "react";
import PageHeader from "../../../components/ui/PageHeader";
import SummaryCards from "../../../components/ui/SummaryCards";
import { FaFileContract, FaChartBar, FaFolderOpen, FaHistory, FaListAlt, FaFileSignature } from "react-icons/fa";
import "../../../styles/shared/modern-ui.css";
import "./Dashboard.css";

const Dashboard = () => {
    const stats = [
        { label: "Total Reports", value: "12", icon: <FaFileContract />, color: "blue" },
        { label: "Active Forms", value: "8", icon: <FaChartBar />, color: "green" },
        { label: "Generated Files", value: "0", icon: <FaFolderOpen />, color: "orange" },
        { label: "Pending Tasks", value: "0", icon: <FaHistory />, color: "blue" },
    ];

    return (
        <div className="page-container fade-in">
            <PageHeader
                title="Software Reports Dashboard"
                subtitle="Central management system for government compliance forms and statutory reporting."
            />

            <SummaryCards cards={stats} />

            <div className="summary-grid" style={{ marginTop: '24px' }}>
                <div className="stats-card" style={{ flex: 1, cursor: 'default' }}>
                    <div className="stats-card-icon blue"><FaListAlt /></div>
                    <div className="card-info">
                        <span className="stats-label">Quick Access</span>
                        <h3 className="stats-value" style={{ fontSize: '18px' }}>Government Forms</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>PF, ESI, Factory Act & other compliance forms</p>
                    </div>
                </div>
                <div className="stats-card" style={{ flex: 1, cursor: 'default' }}>
                    <div className="stats-card-icon green"><FaFileSignature /></div>
                    <div className="card-info">
                        <span className="stats-label">Quick Access</span>
                        <h3 className="stats-value" style={{ fontSize: '18px' }}>Analytical Reports</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Employee, attendance, salary & statutory reports</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
