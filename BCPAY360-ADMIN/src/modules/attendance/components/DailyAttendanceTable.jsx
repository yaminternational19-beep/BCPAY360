import React, { useState, useEffect } from "react";
import "../../../styles/Attendance.css";
import { FaHistory } from "react-icons/fa";

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
    const timer = setTimeout(fetchAddress, 300);
    return () => clearTimeout(timer);
  }, [coords]);

  return (
    <div title={coords} style={{ fontSize: '11px', lineHeight: '1.2' }}>
      {address === "Loading..." || address === "-" ? (
        <span>{address}</span>
      ) : (
        <>
          <div style={{ fontWeight: '700', color: '#1e293b' }}>
            {address.split(',')[0]}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {address.split(',').slice(1).join(',')}
          </div>
        </>
      )}
    </div>
  );
};


const formatMinutes = (minutes) => {
  // If it's already a string with 'h' or 'm', return as is
  if (typeof minutes === 'string' && (minutes.includes('h') || minutes.includes('m'))) {
    return minutes;
  }
  
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const DailyAttendanceTable = ({
  rows = [],
  loading,
  onViewHistory,
  selectedIds = [],
  onSelectOne,
  onSelectAll,
  pagination = { page: 1, limit: 20, total_records: 0 },
  onPageChange
}) => {
  if (loading) {
    return (
      <div className="attendance-table-wrapper">
        <p className="table-loading">Loading attendance...</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="attendance-table-wrapper">
        <p className="table-empty">No attendance data found</p>
      </div>
    );
  }

  const isAllSelected = rows.length > 0 && rows.every(row => selectedIds.includes(row.employee_id));

  const totalPages = Math.ceil(pagination.total_records / pagination.limit) || 1;
  const employeesShowingStart = rows.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0;
  const employeesShowingEnd = Math.min(pagination.page * pagination.limit, pagination.total_records);

  return (
    <div className="attendance-table-container">
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              {onSelectAll && (
                <th className="checkbox-cell" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked ? rows.map(r => r.employee_id) : [])}
                  />
                </th>
              )}
              <th className="col-profile">Profile</th>
              <th className="col-name">Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Shift</th>
              <th className="text-center">Status</th>
              <th className="text-center">Check In</th>
              <th className="text-center">In Loc</th>
              <th className="text-center">Check Out</th>
              <th className="text-center">Out Loc</th>
              <th className="text-center">Late</th>
              <th className="text-center">Overtime</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => {
              const isSelected = selectedIds.includes(row.employee_id);
              return (
                <tr key={row.employee_id} className={isSelected ? 'row-selected' : ''}>
                  {onSelectOne && (
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOne(row.employee_id)}
                      />
                    </td>
                  )}

                  {/* Profile */}
                  <td className="col-profile">
                    <img
                      src={row.profile_photo_url || row.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=EFF6FF&color=3B82F6&bold=true`}
                      alt={row.name}
                      className="attendance-avatar-sm"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=F1F5F9&color=64748B&bold=true`;
                      }}
                    />
                  </td>

                  {/* Name */}
                  <td className="col-name">
                    <div className="employee-info">
                      <span className="employee-name">{row.name}</span>
                      <span className="employee-code">{row.employee_code}</span>
                    </div>
                  </td>

                  <td className="col-dept">{row.department}</td>
                  <td>{row.designation}</td>

                  {/* Shift */}
                  <td>
                    <div className="shift-cell">
                      <span>{row.shift_name}</span>
                      {row.shift_start_time && row.shift_end_time && (
                        <small>
                          {row.shift_start_time} – {row.shift_end_time}
                        </small>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="text-center">
                    <span className={`status-badge ${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>

                  <td className="text-center">{row.check_in_time || "-"}</td>
                  <td className="text-center" style={{ minWidth: '100px' }}>
                    <LocationText coords={row.check_in_location} />
                  </td>

                  <td className="text-center">{row.check_out_time || "-"}</td>
                  <td className="text-center" style={{ minWidth: '100px' }}>
                    <LocationText coords={row.check_out_location} />
                  </td>

                  <td className="text-center">{formatMinutes(row.late_minutes)}</td>
                  <td className="text-center">{formatMinutes(row.overtime_minutes)}</td>

                  {/* Action */}
                  <td className="text-center">
                    <button
                      className="btn-history"
                      onClick={() => onViewHistory(row.employee_id)}
                    >
                      View History
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="footer-left">
          Showing {employeesShowingStart} – {employeesShowingEnd} of {pagination.total_records}
        </div>
        <div className="pagination">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(1)} title="First Page">{"<<"}</button>
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} title="Previous">{"<"}</button>
          <span className="page-info">{pagination.page} / {totalPages}</span>
          <button disabled={pagination.page >= totalPages} onClick={() => onPageChange(pagination.page + 1)} title="Next">{">"}</button>
          <button disabled={pagination.page >= totalPages} onClick={() => onPageChange(totalPages)} title="Last Page">{">>"}</button>
        </div>
      </div>
    </div>
  );
};

export default DailyAttendanceTable;
