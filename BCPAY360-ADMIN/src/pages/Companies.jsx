import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import { makeEmployees } from "../utils/mockData"; // REMOVED
import "../styles/Companies.css";

const COMPANY_NAMES = [
  "Black Cube Technologies",
  "Acme Corp",
  "Innova Solutions",
  "NextGen Systems",
  "Demo Organization",
];

export default function Companies({ user }) {
  const navigate = useNavigate();
  // const employees = useMemo(() => makeEmployees(1000), []);
  const employees = useMemo(() => [], []);

  const companies = useMemo(() => {
    return COMPANY_NAMES.map((name, i) => {
      const companyEmployees = employees.filter(
        (_, idx) => idx % COMPANY_NAMES.length === i
      );

      const deptMap = {};
      companyEmployees.forEach((e) => {
        if (!deptMap[e.department]) deptMap[e.department] = new Set();
        deptMap[e.department].add(e.role);
      });

      return {
        id: i + 1,
        name,
        departments: Object.entries(deptMap).map(([dept, roles]) => ({
          name: dept,
          designations: Array.from(roles),
        })),
      };
    });
  }, [employees]);

  const handleCompanyClick = (companyName) => {
    if (companyName === user.company) {
      navigate("/admin/dashboard");
    } else {
      alert("This company page will be connected soon.");
    }
  };

  return (
    <div className="companies-page">
      <h2>Companies</h2>

      {companies.map((c) => {
        const isOwnCompany = c.name === user.company;

        return (
          <div
            key={c.id}
            className={`company-card ${isOwnCompany ? "active" : ""}`}
            onClick={() => handleCompanyClick(c.name)}
          >
            <div className="company-header">
              <h3>{c.name}</h3>

              <div className="company-actions">
                {isOwnCompany ? (
                  <span className="editable-badge">Your Company</span>
                ) : (
                  <span className="readonly-badge">Read Only</span>
                )}
              </div>
            </div>

            {c.departments.map((d) => (
              <div key={d.name} className="dept-block">
                <strong>{d.name}</strong>
                <div className="roles">
                  {d.designations.map((r) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="billing-info">
              Plan: <strong>Enterprise</strong> • Users: <strong>1000</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}
