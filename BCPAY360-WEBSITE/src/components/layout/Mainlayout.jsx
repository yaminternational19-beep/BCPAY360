import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import colors from "../../styles/colors";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Read company logo from stored profile (set at login or profile fetch)
  const storedProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem("userProfile") || sessionStorage.getItem("userProfile") || "null");
    } catch { return null; }
  })();
  const companyLogoUrl = storedProfile?.company_logo_url || null;
  const companyName = storedProfile?.company_name || "BCPay360"; // Key: Blackcube Solutions when logged in

  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  // --- DIMENSIONS ---
  const SIDEBAR_OPEN_WIDTH = "250px";
  const SIDEBAR_COLLAPSED_WIDTH = "70px";
  const NAVBAR_HEIGHT = "72px"; // Matched to your Navbar height

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSidebarToggle = () => setSidebarOpen(prev => !prev);

  const sidebarWidth = isMobile
    ? (sidebarOpen ? "250px" : "0px")
    : (sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH);

  const contentMargin = isMobile ? "0px" : sidebarWidth;

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: isDarkTheme ? colors.darkBg : colors.layoutBg,
      transition: "background-color 0.3s ease",
      overflowX: "hidden"
    }}>

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        width={sidebarWidth}
        onClose={() => setSidebarOpen(false)}
        topOffset={NAVBAR_HEIGHT}
        companyLogoUrl={companyLogoUrl}
        companyName={companyName}
      />

      {/* MOBILE BACKDROP - Starts BELOW Navbar */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: NAVBAR_HEIGHT, // 🔥 Starts below Navbar
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1005, // Above content, below Sidebar
            backdropFilter: "blur(3px)"
          }}
        />
      )}

      {/* CONTENT */}
      <div
        style={{
          flexGrow: 1,
          marginLeft: contentMargin,
          transition: "marginLeft 0.3s ease",
          display: "flex",
          flexDirection: "column",
          width: isMobile ? "100%" : `calc(100% - ${contentMargin})`,
          boxSizing: "border-box"
        }}
      >
        <Navbar
          toggleTheme={toggleTheme}
          isDarkTheme={isDarkTheme}
          onOpen={handleSidebarToggle}
          leftPosition={contentMargin}
          navbarHeight={NAVBAR_HEIGHT}
        />

        <main style={{
          marginTop: NAVBAR_HEIGHT,
          padding: isMobile ? "16px" : "24px",
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <Outlet context={{ isDarkTheme }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;