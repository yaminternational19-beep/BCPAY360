import "../../../styles/Attendance.css";
import MonthlyAttendanceForm from "./MonthlyAttendanceForm";
import { X } from "lucide-react";

const statusLabelMap = {
  PRESENT: "Present",
  ABSENT: "Absent",
  CHECKED_IN: "Checked In",
  UNMARKED: "Unmarked",
  LEAVE: "Leave",
  H: "Holiday",
  "-": "N/A"
};

const getStatusClass = (status) => {
  if (!status) return "neutral";
  if (status === "-") return "neutral";
  if (status === "H") return "holiday";
  return status.toLowerCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const HistoryAttendanceDrawer = ({ data, loading, onRefresh, onClose }) => {
  if (!data && !loading) return null;

  const employee = data?.employee || {};
  const rows = data?.data || [];

  return (
    <div className={`history-drawer ${loading ? 'opacity-50' : ''}`}>
      {/* ===========================
          HEADER SECTION
      =========================== */}
      <div className="history-header-new">
        <div className="profile-section">
          <div className="profile-avatar-wrapper">
            <img
              src={employee.profile_photo_url || employee.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || "User")}&background=EFF6FF&color=3B82F6&bold=true`}
              alt={employee.name}
              className="employee-avatar-large"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || "User")}&background=F1F5F9&color=64748B&bold=true`;
              }}
            />
            <span className={`status-pill-floating ${employee.status?.toUpperCase() === "ACTIVE" ? "pill-active" : "pill-inactive"}`}>
              {employee.status}
            </span>
          </div>

          <div className="profile-info-main">
            <h2>{employee.name}</h2>
            <span className="code-badge">{employee.code}</span>
            <div className="quick-meta">
              <span><strong>Dept:</strong> {employee.department}</span>
              <span><strong>Shift:</strong> {employee.shift}</span>
            </div>
          </div>
        </div>

        <div className="history-controls">
          <div className="filter-card">
            <div className="filter-card-label">View History For</div>
            <MonthlyAttendanceForm
              onChange={(range) => {
                if (onRefresh) {
                  onRefresh(range.fromDate, range.toDate);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ===========================
          TABLE
      =========================== */}
      <div className="attendance-table-container" style={{ marginTop: '20px' }}>
        <div className="history-table-wrapper" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 }}>
          {loading && <div className="drawer-table-overlay">Loading...</div>}
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="text-center">Date</th>
                <th className="text-center">Shift</th>
                <th className="text-center">Status</th>
                <th className="text-center">Check In</th>
                <th className="text-center">Check Out</th>
                <th className="text-center">Late (min)</th>
                <th className="text-center">Early Out (min)</th>
                <th className="text-center">Overtime (min)</th>
              </tr>
            </thead>

            <tbody>
              {rows?.length ? (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center" title={row.date}>
                      {formatDate(row.date)}
                    </td>

                    <td className="text-center">
                      <div className="shift-cell">
                        <span>{row.shift_name}</span>
                        {row.shift_start_time && row.shift_end_time && (
                          <small>
                            {row.shift_start_time} – {row.shift_end_time}
                          </small>
                        )}
                      </div>
                    </td>

                    <td className="text-center">
                      <span
                        className={`status-badge ${getStatusClass(row.status)}`}
                        title={statusLabelMap[row.status] || row.status}
                      >
                        {statusLabelMap[row.status] || row.status}
                      </span>
                    </td>

                    <td className="text-center">{row.check_in_time || "-"}</td>
                    <td className="text-center">{row.check_out_time || "-"}</td>

                    <td className="text-center">{row.late_minutes || 0}</td>
                    <td className="text-center">{row.early_checkout_minutes || 0}</td>
                    <td className="text-center">{row.overtime_minutes || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="table-empty text-center">
                    No attendance history available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer" style={{ borderTop: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <div className="footer-left">
            Showing {rows?.length ? 1 : 0} – {rows?.length || 0} of {rows?.length || 0} records
          </div>
          <div className="pagination">
            <button disabled={true} title="First Page">{"<<"}</button>
            <button disabled={true} title="Previous">{"<"}</button>
            <span className="page-info">1 / 1</span>
            <button disabled={true} title="Next">{">"}</button>
            <button disabled={true} title="Last Page">{">>"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryAttendanceDrawer;
