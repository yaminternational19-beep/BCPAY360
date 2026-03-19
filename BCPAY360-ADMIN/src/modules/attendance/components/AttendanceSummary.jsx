import { Users, UserCheck, UserX, Clock, Calendar, HelpCircle, Palmtree } from "lucide-react";
import "../../../styles/Attendance.css";

const AttendanceSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="stats-grid-premium">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card-premium" style={{ opacity: 0.6 }}>
            <div className="stat-icon-wrapper" style={{ background: '#f1f5f9' }}></div>
            <div className="stat-content-premium">
              <span className="stat-label-premium">Loading...</span>
              <span className="stat-value-premium">-</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [];

  // 1. Total
  if ("total" in summary || "total_employees" in summary) {
    stats.push({
      label: "Employees",
      value: summary.total || summary.total_employees || 0,
      icon: <Users size={20} />,
      class: "total"
    });
  }

  // 2. Present
  if ("present" in summary || "checked_in" in summary) {
    const presentVal = (summary.present || 0) + (summary.checked_in || 0);
    stats.push({
      label: "Present",
      value: presentVal,
      icon: <UserCheck size={20} />,
      class: "active"
    });
  }

  // 3. Absent
  if ("absent" in summary) {
    stats.push({
      label: "Absent",
      value: summary.absent,
      icon: <UserX size={20} />,
      class: "inactive"
    });
  }

  // 4. Leave
  if ("leave" in summary || "leave_count" in summary) {
    stats.push({
      label: "Leave",
      value: summary.leave || summary.leave_count || 0,
      icon: <Palmtree size={20} />,
      class: "purple"
    });
  }

  // 5. Unmarked
  if ("unmarked" in summary) {
    stats.push({
      label: "Unmarked",
      value: summary.unmarked,
      icon: <Clock size={20} />,
      class: "orange"
    });
  }

  // 6. Holiday
  if ("holiday" in summary || "holiday_count" in summary) {
    stats.push({
      label: "Holiday",
      value: summary.holiday || summary.holiday_count || 0,
      icon: <Calendar size={20} />,
      class: "warning"
    });
  }

  return (
    <div className="stats-grid-premium">
      {stats.map((stat, idx) => (
        <div key={idx} className={`stat-card-premium ${stat.class}`}>
          <div className="stat-icon-wrapper">
            {stat.icon}
          </div>
          <div className="stat-content-premium">
            <span className="stat-label-premium">{stat.label}</span>
            <span className="stat-value-premium">{stat.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};


export default AttendanceSummary;
