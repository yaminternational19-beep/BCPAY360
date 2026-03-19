import React, { useState, useMemo } from "react";
import Card from "../../components/common/Card";
import {
  MdFileDownload,
  MdCheckCircle,
  MdPending,
  MdDateRange,
  MdHistory,
  MdArrowDropDown
} from "react-icons/md";
import colors from "../../styles/colors";
import typography from "../../styles/typography";
import { toast } from "react-toastify"; 

const SalaryHistory = ({ isDarkTheme, data, loading }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [downloadingId, setDownloadingId] = useState(null); 

  const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // 🔥 Backend Array path fixed
  const salaryHistory = data?.salary_history || [];

  const getMonthName = (monthNumber) =>
    new Date(0, monthNumber - 1).toLocaleString("default", { month: "short" });

  const filteredData = useMemo(() => {
    return salaryHistory
      .filter(item => item.pay_year === selectedYear)
      .sort((a, b) => new Date(b.pay_year, b.pay_month - 1) - new Date(a.pay_year, a.pay_month - 1));
  }, [salaryHistory, selectedYear]);

  const handleDownload = async (e, url, filename, id) => {
    e.preventDefault(); 
    if (!url) return;

    setDownloadingId(id);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || "Payslip.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download Error:", error);
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const theme = {
    title: isDarkTheme ? colors.textLight : colors.textMain,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    muted: isDarkTheme ? colors.darkMuted : colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    rowHover: isDarkTheme ? colors.darkHover : "#f8fafc",
    tableHeader: isDarkTheme ? colors.darkDropdown : "#f9fafb",
  };

  const getStatusStyle = (status) => {
    const isPaid = status === "SUCCESS";
    return {
      backgroundColor: isPaid ? `${colors.status.present.dot}15` : `${colors.status.late.dot}15`,
      color: isPaid ? colors.status.present.dot : colors.status.late.dot,
      border: `1px solid ${isPaid ? `${colors.status.present.dot}30` : `${colors.status.late.dot}30`}`,
    };
  };

  return (
    <Card style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column", borderRadius: "12px" }}>
      
      {/* HEADER */}
      <div style={{ 
        padding: "12px 16px", 
        borderBottom: `1px solid ${theme.border}`, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            backgroundColor: `${colors.primary}15`, 
            display: "flex", alignItems: "center", justifyContent: "center", 
            color: colors.primary 
          }}>
            <MdHistory size={18} />
          </div>
          <h3 style={{ margin: 0, color: theme.title, fontFamily: typography.fontFamily, fontSize: 14, fontWeight: 700 }}>
            Salary History
          </h3>
        </div>

        {/* COMPACT YEAR FILTER */}
        <div style={{ position: "relative" }}>
          <div style={{ 
            padding: "6px 10px", 
            backgroundColor: theme.tableHeader, 
            borderRadius: 20, 
            border: `1px solid ${theme.border}`, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: "4px" 
          }}>
            <MdDateRange size={14} color={theme.muted} />
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{selectedYear}</span>
            <MdArrowDropDown size={14} color={theme.text} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            >
              {yearsList.map(year => <option key={year}>{year}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div style={{ overflowX: "auto", flex: 1 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: theme.muted, fontSize: 12 }}>Loading records...</div>
        ) : filteredData.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr style={{ backgroundColor: theme.tableHeader }}>
                {["MONTH", "AMOUNT", "CREDITED", "STATUS", "SLIP"].map(h => (
                  <th key={h} style={{ 
                    padding: "10px 16px", 
                    textAlign: "left", 
                    fontSize: 10, 
                    fontWeight: 700,
                    color: theme.muted, 
                    textTransform: "uppercase",
                    whiteSpace: "nowrap" 
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  
                  <td style={{ padding: "10px 16px", fontWeight: 600, fontSize: 12, color: theme.text }}>
                    {getMonthName(item.pay_month)} {item.pay_year}
                  </td>

                  <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: theme.text }}>
                    AED {Number(item.net_salary).toLocaleString("en-IN")}
                  </td>

                  <td style={{ padding: "10px 16px", fontSize: 11, color: theme.muted, whiteSpace: "nowrap" }}>
                    {item.credited_on
                      ? new Date(item.credited_on).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })
                      : "—"}
                  </td>

                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ 
                      ...getStatusStyle(item.payment_status), 
                      padding: "3px 8px", 
                      borderRadius: 12, 
                      fontSize: 10, 
                      fontWeight: 700, 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "4px" 
                    }}>
                      {item.payment_status === "SUCCESS" ? <MdCheckCircle size={10} /> : <MdPending size={10} />}
                      {item.payment_status}
                    </span>
                  </td>

                  <td style={{ padding: "10px 16px" }}>
                    {/* 🔥 Use item.download_url as per backend */}
                    {item.download_url ? (
                      <button
                        onClick={(e) => handleDownload(e, item.download_url, `Payslip_${item.pay_month}_${item.pay_year}.pdf`, index)}
                        style={{ 
                          color: downloadingId === index ? theme.muted : colors.primary, 
                          background: "transparent",
                          border: "none",
                          cursor: downloadingId === index ? "wait" : "pointer",
                          display: "flex", 
                          alignItems: "center" 
                        }}
                        title="Download Payslip"
                        disabled={downloadingId === index}
                      >
                        {downloadingId === index ? (
                          <div style={{width: 18, height: 18, border: `2px solid ${theme.muted}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite"}} />
                        ) : (
                          <MdFileDownload size={18} />
                        )}
                      </button>
                    ) : <span style={{fontSize: 12, color: theme.muted}}>—</span>}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: theme.muted, fontSize: 12 }}>
            No salary records found for {selectedYear}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
};

export default SalaryHistory;