import React, { useState, useEffect } from "react";
import { MdOutlineConfirmationNumber, MdCheckCircle, MdPendingActions, MdQuestionAnswer } from "react-icons/md";
import api from "../../utils/api";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const MyTickets = ({ isDarkTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get("/support");
        if (res.data?.success) {
          setTickets(res.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    cardBg: isDarkTheme ? "rgba(255,255,255,0.05)" : "#f8fafc",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    replyBg: isDarkTheme ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const options = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("en-IN", options);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px", color: theme.muted, fontSize: "13px" }}>Loading your tickets...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 10px", color: theme.muted }}>
        <MdOutlineConfirmationNumber size={40} style={{ opacity: 0.3, marginBottom: "10px" }} />
        <p style={{ margin: 0, fontSize: "13px" }}>You haven't raised any support tickets yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px" }}>
      {tickets.map((ticket) => {
        const isOpen = ticket.status === "OPEN";
        
        return (
          <div key={ticket.id} style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            {/* Header: ID, Category & Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: theme.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Ticket #{ticket.id}
                </span>
                <h4 style={{ margin: "2px 0 0 0", color: theme.text, fontSize: "14px", fontFamily: typography.fontFamily }}>
                  {ticket.category}
                </h4>
              </div>
              
              <span style={{
                padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px",
                background: isOpen ? `${colors.status.late.bg}` : `${colors.status.present.bg}`,
                color: isOpen ? colors.status.late.dot : colors.status.present.dot,
                border: `1px solid ${isOpen ? colors.status.late.dot : colors.status.present.dot}40`
              }}>
                {isOpen ? <MdPendingActions size={12} /> : <MdCheckCircle size={12} />}
                {ticket.status}
              </span>
            </div>

            {/* User's Reason / Query */}
            <div style={{ fontSize: "13px", color: theme.text, lineHeight: "1.5" }}>
              <span style={{ fontWeight: "700", color: theme.muted, marginRight: "4px" }}>Q:</span>
              {ticket.reason}
            </div>

            {/* Admin's Response (If Closed/Answered) */}
            {ticket.response && (
              <div style={{ 
                background: theme.replyBg, padding: "12px", borderRadius: "8px", 
                borderLeft: `3px solid ${colors.primary}`, marginTop: "4px" 
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", color: colors.primary, fontWeight: "700", fontSize: "11px", textTransform: "uppercase" }}>
                  <MdQuestionAnswer size={14} /> Admin Reply
                </div>
                <div style={{ fontSize: "13px", color: theme.text, lineHeight: "1.5" }}>
                  {ticket.response}
                </div>
              </div>
            )}

            {/* Footer: Dates */}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px dashed ${theme.border}`, paddingTop: "10px", marginTop: "4px", fontSize: "10px", color: theme.muted, fontWeight: "600" }}>
              <span>Created: {formatDate(ticket.created_at)}</span>
              {ticket.responded_at && <span>Resolved: {formatDate(ticket.responded_at)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyTickets;