import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // useNavigate hata diya hai kyunki hard reload best hai
import {
  MdDashboard, 
  MdPeople, 
  MdEventNote, 
  MdAttachMoney, 
  MdBeachAccess, 
  MdPerson,     
  MdFolder,     
  MdLogout
} from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography"; 
import logo from "../../assets/images/AppLogo1.png";

const Sidebar = ({ isOpen, isMobile, width, onClose, topOffset }) => {
  const location = useLocation();
  const [user, setUser] = useState({ companyName: "", companyLogo: null });

  useEffect(() => {
    const updateBranding = () => {
      const storedUser = localStorage.getItem("userProfile");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          companyName: parsed.companyName || "BCPAY360",
          companyLogo: parsed.companyLogo || logo
        });
      }
    };

    updateBranding();
    // Listen for storage changes if other tabs/components update it
    window.addEventListener("storage", updateBranding);
    // Custom event check (optional but good for same-tab updates)
    const interval = setInterval(updateBranding, 2000); 

    return () => {
      window.removeEventListener("storage", updateBranding);
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <MdDashboard size={22} /> },
    { name: "Attendance", path: "/attendance", icon: <MdPeople size={22} /> },
    { name: "Leaves", path: "/leaves", icon: <MdEventNote size={22} /> },
    { name: "Salary", path: "/salary", icon: <MdAttachMoney size={22} /> },
    { name: "Holiday", path: "/holiday", icon: <MdBeachAccess size={22} /> },
    { name: "My Profile", path: "/profile", icon: <MdPerson size={22} /> },
    { name: "My Documents", path: "/documents", icon: <MdFolder size={22} /> },
  ];

  // --- 🔥 FIXED LOGOUT FUNCTIONALITY ---
  const handleLogout = () => {
    // 1. Clear all storage completely
    localStorage.clear(); 
    sessionStorage.clear();

    // 2. Hard redirect to login page (Prevents hanging/freezing)
    window.location.replace("/login"); 
  };

  // --- DYNAMIC STYLES FOR POSITIONING ---
  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: isMobile ? topOffset : 0, 
    bottom: 0, 
    width: width,
    backgroundColor: "#000000", 
    borderRight: `1px solid #333333`, 
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: isOpen ? "4px 0 15px rgba(0,0,0,0.5)" : "none",
    whiteSpace: "nowrap",
    zIndex: 1010, 
    transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-100%)") : "none",
    transition: isMobile ? "transform 0.3s ease" : "width 0.3s ease",
  };

  return (
    <div style={sidebarStyle}>
      
      {/* HEADER */}
      {!isMobile && (
        <div
          style={{
            height: "72px",
            display: "flex",
            alignItems: "center",
            padding: isOpen ? "0 15px" : "0", 
            justifyContent: isOpen ? "flex-start" : "center",
            borderBottom: `1px solid #333333`,
            marginBottom: "10px",
            flexShrink: 0 
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", transition: "all 0.2s", overflow: "hidden" }}>
            <img 
              src={user.companyLogo || logo} 
              alt="logo" 
              style={{ width: "32px", height: "32px", objectFit: "contain", flexShrink: 0 }} 
            />
            {isOpen && (
              <div style={{ overflow: "hidden" }}>
                <span style={{ 
                  fontWeight: "800", 
                  fontSize: "14px", 
                  color: "#ffffff", 
                  display: "block",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  width: "100%"
                }}>
                  {user.companyName || "BCPay 360"}
                </span>
                <span style={{ fontSize: "9px", fontWeight: "600", color: "#888", display: "block", marginTop: "-2px" }}>
                  Employee Portal
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MENU ITEMS */}
      <div style={{ padding: "16px 8px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => isMobile && onClose()} 
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isOpen ? "flex-start" : "center",
                padding: "12px",
                borderRadius: "4px", 
                textDecoration: "none",
                color: "#ffffff",
                backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "all 0.2s ease",
              }}
              title={!isOpen ? item.name : ""}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "24px", color: "#ffffff" }}>
                {item.icon}
              </div>

              {(isOpen || isMobile) && (
                <span style={{ marginLeft: "12px", fontSize: "14px", fontWeight: active ? "700" : "500" }}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* LOGOUT BUTTON */}
      <div style={{ padding: "16px 8px", borderTop: "1px solid #333333", backgroundColor: "#000000" }}>
        <div
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "flex-start" : "center",
            padding: "12px",
            borderRadius: "4px", 
            cursor: "pointer",
            color: "#ef4444", 
            transition: "all 0.2s ease",
          }}
          title={!isOpen ? "Logout" : ""}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "24px" }}>
            <MdLogout size={22} />
          </div>

          {(isOpen || isMobile) && (
            <span style={{ marginLeft: "12px", fontSize: "14px", fontWeight: "600" }}>
              Logout
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;