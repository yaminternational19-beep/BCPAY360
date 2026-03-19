import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hasPermission } from "../utils/permissions.js";
import {
  FaHome,
  FaUsers,
  FaChevronDown,
  FaChevronRight,
  FaBuilding,
  FaIdCard,
  FaCalendarAlt,
  FaClock,
  FaUmbrellaBeach,
  FaMoneyBillWave,
  FaUserTie,
  FaFileInvoiceDollar,
  FaChartLine,
  FaUserTag,
  FaBusinessTime,
  FaFileAlt,
  FaFileInvoice,
  FaQuestionCircle,
  FaBullhorn,
  FaWpforms,
  FaMoneyCheckAlt,
  FaBriefcaseMedical,
  FaGift,
  FaHardHat,
  FaIndustry,
  FaHandHoldingUsd,
} from "react-icons/fa";
import "../styles/Sidebar.css";
import { FORMS_CONFIG } from "../modules/forms/config/forms.config";
import { REPORTS_CONFIG } from "../modules/software-reports/config/reports.config";

const VALID_ROUTES = [
  "dashboard",
  "employees",
  "attendance",
  "leavemanagement",
  "payroll",
  "companies",
  "departments",
  "employee-types",
  "shifts",
  "branches",
  "employee",
  "accounting",
  "softwarereports",
  "hr-management",
  "organization",
  "holidays",
  "forms",
  "reports",
  "manage-content",
  "help-support",
  "faq",
  "manage-broadcast",
];

const FORM_ICONS = {
  pf: <FaMoneyCheckAlt />,
  esic: <FaBriefcaseMedical />,
  "income-tax": <FaFileInvoiceDollar />,
  bonus: <FaGift />,
  labour: <FaHardHat />,
  factories: <FaIndustry />,
  gratuity: <FaHandHoldingUsd />
};

const REPORT_ICONS = {
  employee: <FaUsers />,
  attendance: <FaClock />,
  leave: <FaUmbrellaBeach />,
  salary: <FaMoneyBillWave />
};

const Sidebar = ({ collapsed = false, mobileOpen = false, onCloseMobile, user: userProp }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(userProp || null);

  const isActive = (path) => {
    return location.pathname === `/${path}` ||
      location.pathname.startsWith(`/${path}/`);
  };

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
    } else {
      const authUser = localStorage.getItem("auth_user");
      if (authUser) {
        try {
          setUser(JSON.parse(authUser));
        } catch (e) {
          setUser(null);
        }
      }
    }
  }, [userProp]);

  const isAdmin = user?.role === "COMPANY_ADMIN";
  const isHR = user?.role === "HR";

  const [orgOpen, setOrgOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const isValidRoute = (path) => {
    const clean = path.replace(/^\/admin\//, "").split("/")[0];
    return VALID_ROUTES.includes(clean);
  };

  const go = (path) => {
    const cleanPath = path.replace(/^\/admin\//, "");
    const targetRoute = isValidRoute(cleanPath)
      ? `/${cleanPath}`
      : "/dashboard";

    navigate(targetRoute);
    onCloseMobile?.();
  };

  const safeToggle = (setter, value) => {
    if (collapsed) return;
    setter(value);
  };

  const hrPermissions =
    user?.role === "HR"
      ? JSON.parse(localStorage.getItem("hr_permissions") || "[]")
      : [];

  const canAccess = (moduleKey, action = "view") => {
    if (user?.role === "COMPANY_ADMIN") return true;
    if (user?.role !== "HR") return false;

    return hasPermission(hrPermissions, moduleKey, action);
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""
        }`}
    >
      <div className="sidebar-header">
        {/* Branding icon and text removed as per user request */}
      </div>

      <nav className="sidebar-menu">
        <button
          type="button"
          className={`menu-item ${isActive("dashboard") ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go("dashboard");
          }}
        >
          <div className="menu-left">
            <FaHome />
            {!collapsed && <span>Dashboard</span>}
          </div>
        </button>

        {isAdmin && (
          <>
            <button
              type="button"
              className={`menu-item expandable ${['branches', 'organization', 'departments', 'employee-types', 'shifts', 'hr-management'].some(p => isActive(p)) ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                safeToggle(setOrgOpen, !orgOpen);
              }}
            >
              <div className="menu-left">
                <FaBuilding />
                {!collapsed && <span>Organization</span>}
              </div>
              {!collapsed && (orgOpen ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />)}
            </button>

            {orgOpen && !collapsed && (
              <div className="submenu">
                <button
                  type="button"
                  className={`submenu-item ${isActive("branches") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("branches");
                  }}
                >
                  <FaBuilding /> Branches
                </button>

                <button
                  type="button"
                  className={`submenu-item ${isActive("organization/emp-code") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("organization/emp-code");
                  }}
                >
                  <FaIdCard /> Employee Code
                </button>

                <button
                  type="button"
                  className={`submenu-item ${isActive("departments") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("departments");
                  }}
                >
                  <FaBuilding /> Departments
                </button>
                <button
                  type="button"
                  className={`submenu-item ${isActive("employee-types") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("employee-types");
                  }}
                >
                  <FaUserTag /> Employee Types
                </button>
                <button
                  type="button"
                  className={`submenu-item ${isActive("shifts") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("shifts");
                  }}
                >
                  <FaBusinessTime /> Shifts
                </button>
                <button
                  type="button"
                  className={`submenu-item ${isActive("hr-management") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("hr-management");
                  }}
                >
                  <FaIdCard /> Add HR
                </button>

                <button
                  type="button"
                  className={`submenu-item ${isActive("organization/documents") ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go("organization/documents");
                  }}
                >
                  <FaFileInvoice /> Add Documents
                </button>
              </div>
            )}
          </>
        )}

        {(isAdmin || isHR) && (
          <>
            <button
              type="button"
              className={`menu-item expandable ${['employees', 'attendance', 'leavemanagement', 'payroll', 'holidays'].some(p => isActive(p)) ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                safeToggle(setHrOpen, !hrOpen);
              }}
            >
              <div className="menu-left">
                <FaUsers />
                {!collapsed && <span>HR Module</span>}
              </div>
              {!collapsed && (hrOpen ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />)}
            </button>

            {hrOpen && !collapsed && (
              <div className="submenu">
                {canAccess("EMPLOYEE_MASTER") && (
                  <button
                    type="button"
                    className={`submenu-item ${isActive("employees") ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go("employees");
                    }}
                  >
                    <FaUsers /> Employees
                  </button>
                )}


                {canAccess("ATTENDANCE") && (
                  <button
                    type="button"
                    className={`submenu-item ${isActive("attendance") ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go("attendance");
                    }}
                  >
                    <FaClock /> Attendance
                  </button>
                )}

                {canAccess("LEAVE_MASTER") && (
                  <button
                    type="button"
                    className={`submenu-item ${isActive("leavemanagement") ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go("leavemanagement");
                    }}
                  >
                    <FaUmbrellaBeach /> Leaves
                  </button>
                )}

                {canAccess("PAYROLL") && (
                  <button
                    type="button"
                    className={`submenu-item ${isActive("payroll") ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go("payroll");
                    }}
                  >
                    <FaMoneyBillWave /> Payroll
                  </button>
                )}

                {canAccess("HOLIDAYS") && (
                  <button
                    type="button"
                    className={`submenu-item ${isActive("holidays") ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/holidays");
                      onCloseMobile?.();
                    }}
                  >
                    <FaCalendarAlt /> Holidays
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <button
              type="button"
              className={`menu-item expandable ${isActive('forms') ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                safeToggle(setFormsOpen, !formsOpen);
              }}
            >
              <div className="menu-left">
                <FaWpforms />
                {!collapsed && <span>Forms</span>}
              </div>
              {!collapsed && (formsOpen ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />)}
            </button>

            {formsOpen && !collapsed && (
              <div className="submenu">
                {Object.values(FORMS_CONFIG).map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    className={`submenu-item ${isActive(`forms/${form.id}`) ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go(`forms/${form.id}`);
                    }}
                  >
                    {FORM_ICONS[form.id] || <FaFileAlt />} {form.title}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`menu-item expandable ${isActive('reports') ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                safeToggle(setReportsOpen, !reportsOpen);
              }}
            >
              <div className="menu-left">
                <FaChartLine />
                {!collapsed && <span>Reports</span>}
              </div>
              {!collapsed && (reportsOpen ? <FaChevronDown className="chevron-icon" /> : <FaChevronRight className="chevron-icon" />)}
            </button>

            {reportsOpen && !collapsed && (
              <div className="submenu">
                {Object.values(REPORTS_CONFIG).map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    className={`submenu-item ${isActive(`reports/${report.id}`) ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go(`reports/${report.id}`);
                    }}
                  >
                    {REPORT_ICONS[report.id] || <FaChartLine />} {report.title}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`menu-item ${isActive("manage-content") ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go("manage-content");
              }}
            >
              <div className="menu-left">
                <FaFileAlt />
                {!collapsed && <span>Manage Content</span>}
              </div>
            </button>

            <button
              type="button"
              className={`menu-item ${isActive("help-support") ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go("help-support");
              }}
            >
              <div className="menu-left">
                <FaQuestionCircle />
                {!collapsed && <span>Help & Support</span>}
              </div>
            </button>

            <button
              type="button"
              className={`menu-item ${isActive("faq") ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go("faq");
              }}
            >
              <div className="menu-left">
                <FaQuestionCircle />
                {!collapsed && <span>FAQ</span>}
              </div>
            </button>

            <button
              type="button"
              className={`menu-item ${isActive("manage-broadcast") ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go("manage-broadcast");
              }}
            >
              <div className="menu-left">
                <FaBullhorn />
                {!collapsed && <span>Manage Broadcast</span>}
              </div>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
