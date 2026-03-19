import React from "react";
import colors from "../../styles/colors";

const StaticContent = ({ data, slug, isDarkTheme, loading }) => {
  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
  };

  if (loading) return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>Loading content...</div>;

  // 🔥 ID backup for 100% accurate matching
  const slugMap = {
    "about-us": 1,
    "terms-conditions": 2,
    "privacy-policy": 3
  };

  const item = data.find(c => 
    (c.content_url && c.content_url.includes(slug)) || 
    c.content_id === slugMap[slug]
  );
  
  const textContent = item ? item.content : null;

  if (!textContent) return <div style={{ color: theme.muted, padding: "20px", textAlign: "center" }}>Content not available.</div>;

  return (
    <div
      style={{
        color: theme.text,
        whiteSpace: "pre-wrap", 
        lineHeight: "1.6",
        padding: "10px"
      }}
      dangerouslySetInnerHTML={/<[a-z][\s\S]*>/i.test(textContent) ? { __html: textContent } : undefined}
    >
      {!/<[a-z][\s\S]*>/i.test(textContent) ? textContent : null}
    </div>
  );
};

export default StaticContent;