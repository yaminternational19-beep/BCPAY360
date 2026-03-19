import colors from "../../styles/colors";
import typography from "../../styles/typography";

const Button = ({
  label,
  type = "button",
  onClick,
  fullWidth = false,
  bgColor,       // optional custom color
  hoverColor,    // optional custom hover color
  style,         // 🔥 Added: Allows overriding styles from parent (Login.js)
  ...props       // 🔥 Added: Allows passing other props like 'disabled'
}) => {
  // Default to Black if no color provided
  const background = bgColor || "#000000"; 
  const hoverBackground = hoverColor || "#333333"; // Dark Grey hover default

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        backgroundColor: background,
        color: "#ffffff",
        padding: "12px 18px",
        fontSize: typography.size?.md || "14px", // Safe fallback
        fontWeight: typography.weight?.medium || 500,
        borderRadius: "8px",
        width: fullWidth ? "100%" : "auto",
        border: "none",
        cursor: "pointer",
        fontFamily: typography.fontFamily,
        transition: "all 0.3s ease", // Smooth transition for all properties
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // 🔥 Merge custom styles passed from parent (Login.js)
        ...style 
      }}
      // Internal hover logic (only runs if parent doesn't override background via style)
      onMouseOver={(e) => {
        if (!style?.backgroundColor) e.target.style.backgroundColor = hoverBackground;
      }}
      onMouseOut={(e) => {
        if (!style?.backgroundColor) e.target.style.backgroundColor = background;
      }}
      {...props}
    >
      {label}
    </button>
  );
};

export default Button;