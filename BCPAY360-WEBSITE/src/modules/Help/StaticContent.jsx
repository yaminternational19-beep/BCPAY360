import React from "react";
import colors from "../../styles/colors";

const StaticContent = ({ data, slug, isDarkTheme, loading }) => {
  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  if (loading) return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>Loading content...</div>;

  // 🔥 Case-insensitive Slug Match (Robust)
  const item = data.find(c => c.slug && c.slug.toLowerCase() === (slug || "").toLowerCase());
  
  if (!item) {
    if (data.length > 0) {
      console.warn("StaticContent: Page Slug not found in data. Data provided:", data);
      return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>Page not discovered. Contact Support.</div>;
    }
    return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>No content found for this company.</div>;
  }

  const textContent = item.content;

  // 🔥 Flexible HTML vs PlainText renderer
  const isHtml = /<[a-z][\s\S]*>/i.test(textContent);

  return (
    <div
      style={{
        color: theme.text,
        whiteSpace: "pre-wrap", 
        lineHeight: "1.6",
        padding: "10px",
        overflow: "hidden"
      }}
      dangerouslySetInnerHTML={isHtml ? { __html: textContent } : undefined}
    >
      {!isHtml ? textContent : null}
    </div>
  );
};

export default StaticContent;