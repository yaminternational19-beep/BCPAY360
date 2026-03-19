import colors from "../../styles/colors";
import typography from "../../styles/typography";

const Card = ({ children, width = "100%", style = {} }) => {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
        width,
        // Removed hardcoded margin: auto and maxWidth to allow flexible layout
        fontFamily: typography.fontFamily,
        ...style, // Allows overrides from individual pages
      }}
    >
      {children}
    </div>
  );
};

export default Card;