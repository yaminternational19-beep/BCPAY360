import React, { useState, useEffect } from "react";
import "../../../styles/Attendance.css";
import MonthlyAttendanceForm from "./MonthlyAttendanceForm";
import { X } from "lucide-react";

const LocationText = ({ coords }) => {
  const [address, setAddress] = useState("Loading...");

  useEffect(() => {
    if (!coords) {
      setAddress("-");
      return;
    }
    const [lat, lng] = coords.split(',').map(c => c.trim());
    
    const cached = localStorage.getItem(`geo_${lat}_${lng}`);
    if (cached) {
      setAddress(cached);
      return;
    }

    const fetchAddress = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        
        // Extract meaningful parts: area, suburb, or first 2 parts
        const addrParts = data.address;
        const area = addrParts.suburb || addrParts.neighbourhood || addrParts.commercial || addrParts.road || "";
        const city = addrParts.city || addrParts.town || addrParts.state_district || "";
        
        const shortAddr = area && city ? `${area}, ${city}` : (data.display_name?.split(',').slice(0, 2).join(',') || "Unknown");
        
        setAddress(shortAddr);
        localStorage.setItem(`geo_${lat}_${lng}`, shortAddr);
      } catch (err) {
        setAddress(coords); 
      }
    };

    // Debounce/Delay to avoid hitting Nominatim too fast
    const timer = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timer);
  }, [coords]);

  return (
    <div title={coords} style={{ fontSize: '12px', lineHeight: '1.4' }}>
      {address === "Loading..." || address === "-" ? (
        <span>{address}</span>
      ) : (
        <>
          <div style={{ fontWeight: '700', color: '#334155' }}>
            {address.split(',')[0]}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {address.split(',').slice(1).join(',')}
          </div>
        </>
      )}
    </div>
  );
};

const statusLabelMap = {
  PRESENT: "Present",
  ABSENT: "Absent",
  CHECKED_IN: "Checked In",
  UNMARKED: "Unmarked",
  LEAVE: "Leave",
  LATE: "Late",
  HALF_DAY: "Half Day",
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

const formatMinutes = (mins) => {
  if (!mins || isNaN(mins) || mins === 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
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
                <th className="text-center">In Loc</th>
                <th className="text-center">Check Out</th>
                <th className="text-center">Out Loc</th>
                <th className="text-center">Worked</th>
                <th className="text-center">Late</th>
                <th className="text-center">Overtime</th>
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
                        <span className="text-center">{row.shift_name}</span>
                        {row.shift_start_time && row.shift_end_time && (
                          <small className="text-center">
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
                    <td className="text-center" style={{ color: '#64748b', minWidth: '120px' }}>
                      <LocationText coords={row.check_in_location} />
                    </td>

                    <td className="text-center">{row.check_out_time || "-"}</td>
                    <td className="text-center" style={{ color: '#64748b', minWidth: '120px' }}>
                      <LocationText coords={row.check_out_location} />
                    </td>

                    <td className="text-center">{formatMinutes(row.worked_minutes)}</td>
                    <td className="text-center">{formatMinutes(row.late_minutes)}</td>
                    <td className="text-center">{formatMinutes(row.overtime_minutes)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="table-empty text-center">
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
