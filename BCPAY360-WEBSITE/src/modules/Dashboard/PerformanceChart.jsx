import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const PerformanceChart = ({ isDarkTheme, data }) => {
  const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const safeData = WEEK_DAYS.map((day) => {
    const found = Array.isArray(data) ? data.find((d) => d.day === day) : null;
    const minutes = found?.worked_minutes ?? 0;
    const hours = Number((minutes / 60).toFixed(1));
    return {
      day: day.slice(0, 3), 
      hours: hours 
    };
  });

  const theme = {
    bg: isDarkTheme ? colors.darkDropdown : colors.surface,
    text: isDarkTheme ? colors.textLight : colors.textMain,
    grid: isDarkTheme ? colors.darkBorder : colors.border,
    line: colors.primary,
  };

  return (
    <div
      style={{
        height: "360px", // Reduced Height
        background: theme.bg,
        padding: "16px", // Compact Padding
        borderRadius: "12px",
        boxShadow: isDarkTheme ? "none" : colors.softShadow,
        border: `1px solid ${theme.grid}`,
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Updated Heading to show (Mins) instead of (Hrs) */}
      <h4 style={{ marginBottom: "16px", color: theme.text, fontFamily: typography.fontFamily, fontWeight: "700", fontSize: "14px", margin: "0 0 16px 0" }}>
        Weekly Work Hours
      </h4>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.textMuted, fontSize: 10, fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: colors.textMuted, fontSize: 10, fontWeight: 600 }} 
            />
            <Tooltip
              formatter={(value) => [`${value} hrs`, "Worked"]}
              contentStyle={{
                borderRadius: "8px",
                border: `1px solid ${theme.grid}`,
                backgroundColor: theme.bg,
                color: theme.text,
                fontSize: "11px",
                padding: "4px 8px"
              }}
              cursor={{ stroke: theme.grid, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke={theme.line}
              strokeWidth={3}
              dot={{ r: 3, fill: theme.line, strokeWidth: 2, stroke: theme.bg }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;