import { useEffect, useState } from "react";

const buildMonthRange = (year, month) => {
  const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  return { fromDate, toDate };
};

export default function MonthlyAttendanceForm({ value, onChange }) {
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    const range = buildMonthRange(year, month);
    onChange({
      year,
      month,
      ...range
    });
  }, [year, month]);

  const years = [];
  for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }
  const MONTHS = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  return (
    <div className="monthly-range-form">
      <span>Month</span>

      <select
        value={month}
        onChange={e => setMonth(+e.target.value)}
        className="filter-select date-select"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={year}
        onChange={e => setYear(+e.target.value)}
        className="filter-select year-select"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
