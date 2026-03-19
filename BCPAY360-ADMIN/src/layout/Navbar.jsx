import React, { useState, useEffect } from "react";
import { FaBars, FaBell, FaSignOutAlt, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";
import logo from "../assets/Logo.png";

const Navbar = ({ user, onToggleSidebar, onLogout }) => {
  const [open, setOpen] = useState(false);

  // 🔹 Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".user-profile-trigger") &&
        !event.target.closest(".profile-menu")
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) return null;

  // const email = user.email || "";
  // const userName =
  //   email.split("@")[0].charAt(0).toUpperCase() +
  //   email.split("@")[0].slice(1);

  const handleLogoutAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.removeItem("auth_user");
    onLogout();
  };

  return (
    <header className="navbar">
      {/* LEFT SECTION */}
      <div className="nav-left">
        

        <div className="brand-section">
           <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}
  >
    <img
  src={logo}
  alt="BCPAY360"
  style={{
    height: "44px",
    width: "44px",
    objectFit: "cover",
    borderRadius: "12px",       // 👈 soft rounded square
    background: "#ffffff",
    padding: "4px",             // 👈 breathing space
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",  // 👈 soft shadow
  }}
/>

    <span
      style={{
        fontSize: "22px",
        fontWeight: 800,
        color: "#0e0d0d",
        letterSpacing: "0.5px"
      }}
    >
      BCPAY360
    </span>
  </div>
          <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleSidebar();
    }}
    style={{
      background: "rgba(255,255,255,0.15)",
      border: "none",
      color: "#ffffff",
      width: "38px",
      height: "38px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "0.2s",
      marginLeft: "20px"
    }}
  >
    <FaBars style={{ fontSize: "18px" }} />
  </button>
        </div>
      </div>


      {/* RIGHT SECTION */}
      <div className="nav-right">
        {/* <div className="nav-utility-icons">
          <button className="utility-btn has-badge">
            <FaBell />
          </button>
        </div> */}

        <div className="user-section">
          <div
            className="user-profile-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
          >
            <div className="trigger-badge">
              {user.role === "COMPANY_ADMIN" ? "ADMIN" : "HR"}
            </div>

            <div className="trigger-divider" />

            <div className="avatar-small">
              <img
                src={logo}
                alt="User"
              />
            </div>
          </div>

          {open && (
            <div className="profile-menu">
              <div className="menu-spacer" />

              {/* <div className="menu-item">
                <FaUser className="menu-icon" />
                Profile
              </div> */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    padding: "14px 18px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#1e293b"
  }}
>
  {/* ICON CONTAINER */}
  <div
    style={{
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginRight: "20px"   // 👈 manual spacing
    }}
  >
    <FaUser
      style={{
        fontSize: "16px",
        color: "#64748b"
      }}
    />
  </div>

  {/* TEXT CONTAINER */}
  <div
    style={{
      display: "flex",
      alignItems: "center"
    }}
  >
    <span style={{ lineHeight: 1 }}>Profile</span>
  </div>
</div>

              <div className="menu-divider" />

              <button
                type="button"
                className="logout-btn"
                onClick={handleLogoutAction}
              >
                <FaSignOutAlt className="menu-icon" />
                <span className="menu-text">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;