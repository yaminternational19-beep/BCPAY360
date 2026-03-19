import "../../../styles/Attendance.css";

const statusClassMap = {
  P: "status-present",
  A: "status-absent",
  U: "status-unmarked",
  H: "status-holiday",
  "-": "status-unmarked"
};

const statusLabelMap = {
  P: "Present",
  A: "Absent",
  U: "Unmarked",
  H: "Holiday",
  "-": "N/A"
};

const MonthlyAttendanceTable = ({
  data = [],
  loading,
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

  if (!data.length) {
    return (
      <div className="attendance-table-wrapper">
        <p className="table-empty">No attendance data found</p>
      </div>
    );
  }

  const days = Object.keys(data[0].days || {});
  const isAllSelected = data.length > 0 && data.every(emp => selectedIds.includes(emp.employee_id));
  const totalPages = Math.ceil(pagination.total_records / pagination.limit) || 1;
  const employeesShowingStart = data.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0;
  const employeesShowingEnd = Math.min(pagination.page * pagination.limit, pagination.total_records);

  return (
    <div className="attendance-table-container">
      <div className="attendance-table-wrapper monthly">
        <table className="attendance-table">
          <thead>
            <tr>
              {onSelectAll && (
                <th className="checkbox-cell" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked ? data.map(d => d.employee_id) : [])}
                  />
                </th>
              )}
              <th className="col-profile">Profile</th>
              <th className="col-name">Employee</th>
              <th>Department</th>
              <th>Shift</th>

              {/* DAY HEADERS */}
              {days.map(day => {
                const paddedDay = String(day).padStart(2, "0");
                return (
                  <th
                    key={day}
                    className="day-col"
                  >
                    {paddedDay}
                  </th>
                );
              })}

              {/* TOTAL HEADERS */}
              <th className="text-center">Present</th>
              <th className="text-center">Absent</th>
              <th className="text-center">Unmarked</th>
              <th className="text-center">Holidays</th>
            </tr>
          </thead>

          <tbody>
            {data.map((emp, index) => {
              const isSelected = selectedIds.includes(emp.employee_id);
              return (
                <tr key={emp.employee_id || index} className={isSelected ? 'row-selected' : ''}>
                  {onSelectOne && (
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOne(emp.employee_id)}
                      />
                    </td>
                  )}

                  <td className="col-profile">
                    <img
                      src={emp.profile_photo_url || emp.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=EFF6FF&color=3B82F6&bold=true`}
                      alt={emp.name}
                      className="attendance-avatar-sm"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=F1F5F9&color=64748B&bold=true`;
                      }}
                    />
                  </td>
                  <td className="col-name">
                    <div className="employee-info">
                      <span className="employee-name">{emp.name}</span>
                      <span className="employee-code">{emp.employee_code}</span>
                    </div>
                  </td>

                  <td className="col-dept">{emp.department}</td>
                  <td>{emp.shift}</td>

                  {/* DAY CELLS */}
                  {days.map(day => {
                    const value = emp.days[day];
                    return (
                      <td
                        key={day}
                        className={`day-cell ${statusClassMap[value] || ""}`}
                        title={statusLabelMap[value] || "Unknown"}
                      >
                        {value}
                      </td>
                    );
                  })}

                  {/* TOTALS */}
                  <td className="text-center total-present" title="Total Present Days">
                    {emp.totals.present}
                  </td>
                  <td className="text-center total-absent" title="Total Absent Days">
                    {emp.totals.absent}
                  </td>
                  <td className="text-center total-unmarked" title="Total Unmarked Days">
                    {emp.totals.unmarked}
                  </td>
                  <td className="text-center total-holiday" title="Total Holidays">
                    {emp.totals.holiday}
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

export default MonthlyAttendanceTable;
