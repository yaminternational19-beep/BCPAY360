import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const AttendanceOverview = ({ isDarkTheme, data }) => {

  const attendanceData = [
    { name: "Present", value: Number(data?.present_days) || 0 },
    { name: "Late", value: Number(data?.late_days) || 0 },
    { name: "Absent", value: Number(data?.absent_days) || 0 },
    { name: "Over Time", value: Number(data?.overtime_days) || 0 },
  ];

const total = Number(data?.total_days) || 0;
// console.log("Attendance Overview Data:", data);
// console.log("Total Days:", total);
// console.log("Attendance Overview Data:", attendanceData);

  const CHART_COLORS = [
    colors.status.present.dot,
    colors.status.late.dot,
    colors.status.absent.dot,
    colors.status.halfDay.dot,
  ];

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : "#ffffff",
    text: isDarkTheme ? colors.textLight : "#111827",
    subText: colors.textMuted,
    border: isDarkTheme ? colors.darkBorder : "#e5e7eb",
  };

  return (
    <div style={{
      height: "360px",
      background: theme.bg,
      borderRadius: "24px",
      padding: "28px",
      border: `1px solid ${theme.border}`,
      boxShadow: "0 15px 40px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>

      <div>
        <h4 style={{
          margin: 0,
          fontFamily: typography.fontFamily,
          fontWeight: "800",
          fontSize: "18px",
          color: theme.text
        }}>
          Attendance Overview
        </h4>
        <p style={{
          margin: "4px 0 0",
          fontSize: "12px",
          color: theme.subText
        }}>
          Monthly attendance breakdown
        </p>
      </div>

      <div style={{ position: "relative", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={attendanceData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={55}
              paddingAngle={4}
              stroke="none"
            >
              {attendanceData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "28px",
            fontWeight: "800",
            color: theme.text,
            fontFamily: typography.fontFamily
          }}>
            {total}
          </div>
          <div style={{
            fontSize: "11px",
            color: theme.subText,
            marginTop: "2px"
          }}>
            Total Days
          </div>
        </div>
      </div>

      {/* Modern Legend */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px 16px",
        marginTop: "10px"
      }}>
        {attendanceData.map((item, index) => (
          <div key={item.name} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDarkTheme ? colors.darkBg : "#f9fafb",
            padding: "8px 12px",
            borderRadius: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: CHART_COLORS[index]
              }} />
              <span style={{
                fontSize: "12px",
                fontWeight: "600",
                color: theme.text
              }}>
                {item.name}
              </span>
            </div>
            <span style={{
              fontSize: "12px",
              fontWeight: "700",
              color: theme.subText
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceOverview;
