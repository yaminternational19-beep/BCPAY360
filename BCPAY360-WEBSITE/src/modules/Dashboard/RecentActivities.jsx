import { MdEventNote } from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const RecentActivities = ({ isDarkTheme, data }) => {
  const activities = data || [];
  const theme = { 
    cardBg: isDarkTheme ? colors.darkDropdown : colors.surface, 
    title: isDarkTheme ? colors.textLight : colors.textMain, 
    border: isDarkTheme ? colors.darkBorder : colors.border 
  };

  return (
    <div style={{ 
      backgroundColor: theme.cardBg, 
      borderRadius: "12px", 
      padding: "16px", 
      boxShadow: isDarkTheme ? "none" : colors.softShadow, 
      border: `1px solid ${theme.border}` 
    }}>
      <h4 style={{ margin: "0 0 12px 0", color: theme.title, fontFamily: typography.fontFamily, fontWeight: "700", fontSize: "14px" }}>
        Recent Activities
      </h4>
      
      {activities.length === 0 ? (
        <p style={{ color: colors.textMuted, fontSize: "12px", margin: 0 }}>No recent activity.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {activities.map((item, index) => (
             <div key={index} style={{ 
               display: "flex", 
               alignItems: "center", 
               gap: "12px", 
               padding: "10px 0", 
               borderBottom: index !== activities.length - 1 ? `1px solid ${theme.border}` : "none" 
             }}>
                <div style={{ 
                  width: "32px", height: "32px", 
                  borderRadius: "8px", 
                  backgroundColor: `${colors.primary}15`, 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                   <MdEventNote size={16} color={colors.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: theme.title, fontFamily: typography.fontFamily, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.message || item.text}
                  </div>
                  <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                    {item.time || item.created_at}
                  </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default RecentActivities;