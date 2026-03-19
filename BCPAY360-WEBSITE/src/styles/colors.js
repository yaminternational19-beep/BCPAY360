const colors = {
  // Primary Brand Colors
  primary: "#5395ff",
  primaryHover: "#4d89e8",
  // Calculated rgba(83, 149, 255, 0.15) from #5395ff
  primaryLight: "rgba(83, 149, 255, 0.15)", 

  // Background & Surfaces
  background: "#f5f5f5",
  surface: "#ffffff",
  layoutBg: "#f9fafb",
  lightHover: "#f3f4f6", // Added for hover effects
  transparent: "transparent",

  // Text Colors
  textMain: "#1f2937",
  textMuted: "#6b7280",
  textLight: "#ffffff",
  border: "#e5e7eb", // Added standard border color

  // Feedback Colors
  error: "#ef4444",
  success: "#22c55e",
  warning: "#F59E0B",
  info: "#3B82F6",

  // Sidebar Specifics
  sidebarShadow: "4px 0 10px rgba(0,0,0,0.03)",
  sidebarFull: "240px",
  sidebarCollapsed: "78px",

  // Navbar & Layout
  navbarBg: "#ffffff",
  navbarShadow: "0 2px 6px rgba(0, 0, 0, 0.12)",

  // Dark Mode Specifics
  darkBg: "#111827",
  darkDropdown: "#1a1c1e",
  darkHover: "#2d3748",
  darkBorder: "#2d3748",
  darkMuted: "#a0aec0",

  // Status Semantic Colors
  status: {
    present: { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
    late: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
    halfDay: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
    absent: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
    default: { bg: "#F8FAFC", text: "#64748B", dot: "#94A3B8" },
  },

  // Shadows & Radius
  cardShadow: "0 6px 16px rgba(0,0,0,0.1)",
  softShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  dropdownShadow: "0 10px 25px rgba(0,0,0,0.1)",
  buttonShadow: (color) => `0 4px 12px ${color}33`,
  borderRadiusSm: "8px",
  borderRadiusLg: "12px",
  pillRadius: "100px",

  // Transition
  smoothTransition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
};

export default colors;