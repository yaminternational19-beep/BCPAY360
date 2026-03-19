import React, { useState, useEffect } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdHelpOutline } from "react-icons/md";
import api from "../../utils/api";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const FAQs = ({ isDarkTheme }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null); 

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const res = await api.get("/faqs");
        if (res.data?.success) {
          setFaqs(res.data.faq_arr || []);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id); 
  };

  const theme = {
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    cardBg: isDarkTheme ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
    border: isDarkTheme ? colors.darkBorder : "#e2e8f0",
    questionColor: isDarkTheme ? "#ffffff" : "#1e293b",
  };

  // Loading State UI
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: theme.muted, fontSize: "14px", fontWeight: "500" }}>
        Loading FAQs...
      </div>
    );
  }

  // Empty State UI
  if (faqs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: theme.muted, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <MdHelpOutline size={48} style={{ opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: "15px", fontWeight: "500" }}>No FAQs available at the moment.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "10px" }}>
      {/* Header Section */}
      <h2 style={{ color: theme.text, fontSize: "20px", marginBottom: "8px", marginTop: 0, fontWeight: "700" }}>Frequently Asked Questions</h2>
      <p style={{ color: theme.muted, fontSize: "14px", marginBottom: "24px" }}>
        Find answers to common questions about our platform and policies.
      </p>

      {/* Accordion List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {faqs.map((faq) => {
          const isOpen = openId === faq.faq_id;
          return (
            <div 
              key={faq.faq_id} 
              style={{ 
                border: `1px solid ${isOpen ? colors.primary : theme.border}`,
                borderRadius: "10px",
                // Active hone par halka sa background color change hoga
                background: isOpen ? (isDarkTheme ? "rgba(79, 70, 229, 0.1)" : "#f0fdf4") : theme.cardBg,
                overflow: "hidden",
                transition: "all 0.3s ease"
              }}
            >
              {/* Question Header */}
              <div 
                onClick={() => toggleFAQ(faq.faq_id)}
                style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px", cursor: "pointer", userSelect: "none"
                }}
              >
                <h4 style={{ 
                  margin: 0, fontSize: "14px", fontWeight: isOpen ? "700" : "600", 
                  color: isOpen ? colors.primary : theme.questionColor,
                  fontFamily: typography?.fontFamily || "inherit",
                  lineHeight: "1.4", paddingRight: "16px"
                }}>
                  {faq.question}
                </h4>
                <div style={{ color: isOpen ? colors.primary : theme.muted, flexShrink: 0 }}>
                  {isOpen ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
                </div>
              </div>
              
              {/* Answer Body */}
              {isOpen && (
                <div style={{ padding: "0 16px 16px 16px" }}>
                  {/* Separator Line */}
                  <div style={{ height: "1px", background: isOpen ? colors.primary : theme.border, marginBottom: "12px", opacity: 0.2 }} />
                  
                  <div style={{ 
                    color: theme.text, fontSize: "13px", lineHeight: "1.6", 
                    whiteSpace: "pre-wrap", opacity: 0.9 
                  }}>
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQs;