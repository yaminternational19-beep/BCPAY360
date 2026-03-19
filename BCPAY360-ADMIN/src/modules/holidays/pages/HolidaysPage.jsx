import React, { useEffect, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import HolidayModal from "../components/HolidayModal";
import "../styles/Holidays.css";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaBuilding, FaCalendar } from "react-icons/fa";
import { useBranch } from "../../../hooks/useBranch";
import { useToast } from "../../../context/ToastContext";
import NoBranchState from "../../../components/NoBranchState";

import {
  getBranchHolidays,
  createBranchHolidays,
  updateBranchHolidays,
  deleteBranchHolidays,
} from "../../../api/master.api";

const HolidaysPage = () => {
  /* =========================
     STATE
  ========================= */
  const toast = useToast();
  const { branches, selectedBranch, changeBranch, isSingleBranch } = useBranch();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(0);

  const [holidays, setHolidays] = useState({}); // { YYYY-MM-DD: {id, reasonType, reasonText} }
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [isBulk, setIsBulk] = useState(false);
  const [bulkDates, setBulkDates] = useState([]);
  const [bulkLabel, setBulkLabel] = useState("");

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    setCurrentMonth(0);
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedBranch) {
      setHolidays({});
      return;
    }
    fetchHolidays();
  }, [selectedBranch, selectedYear]);

  /* =========================
     API
  ========================= */

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await getBranchHolidays({
        branch_id: selectedBranch,
        year: selectedYear,
      });

      const map = {};
      (res || []).forEach((h) => {
        map[h.holiday_date] = {
          id: h.id,
          reasonType: h.reason_type,
          reasonText: h.reason_text,
        };
      });

      setHolidays(map);
    } catch {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DATE HELPERS (LOCAL ONLY)
  ========================= */

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  // STRICT LOCAL DATE – NO toISOString
  const getWeekendsOfYear = (year) => {
    const dates = [];
    const d = new Date(year, 0, 1);

    while (d.getFullYear() === year) {
      const day = d.getDay(); // 0 = Sun, 6 = Sat
      if (day === 0 || day === 6) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        dates.push(`${y}-${m}-${da}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  /* =========================
     ACTIONS
  ========================= */

  const openDate = (day) => {
    if (!selectedBranch) {
      toast.error("Select branch first");
      return;
    }

    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");

    setSelectedDate(`${selectedYear}-${m}-${d}`);
    setIsBulk(false);
    setModalOpen(true);
  };

  const saveHoliday = async ({ reasonType, reasonText }) => {
    try {
      if (isBulk) {
        await createBranchHolidays({
          branch_id: selectedBranch,
          dates: bulkDates,
          reason_type: reasonType,
          reason_text: reasonText,
        });
      } else {
        const existing = holidays[selectedDate];
        if (existing) {
          await updateBranchHolidays({
            id: existing.id,
            reason_type: reasonType,
            reason_text: reasonText,
          });
        } else {
          await createBranchHolidays({
            branch_id: selectedBranch,
            dates: [selectedDate],
            reason_type: reasonType,
            reason_text: reasonText,
          });
        }
      }

      toast.success("Holiday saved successfully");
      setModalOpen(false);
      fetchHolidays();
    } catch {
      toast.error("Operation failed");
    }
  };

  const removeHoliday = async () => {
    const h = holidays[selectedDate];
    if (!h) return;

    await deleteBranchHolidays({ id: h.id });
    toast.success("Holiday removed");
    setModalOpen(false);
    fetchHolidays();
  };

  /* ======================================================
     BULK REMOVE WEEKENDS (MAIN FEATURE)
     ====================================================== */
  const handleClearWeekends = async () => {
    if (!selectedBranch) {
      toast.error("Select branch first");
      return;
    }

    // all weekends for year
    const allWeekendDates = getWeekendsOfYear(selectedYear);

    // only those that actually exist as holidays
    const existingWeekendHolidays = allWeekendDates.filter(
      (d) => holidays[d]
    );

    if (existingWeekendHolidays.length === 0) {
      toast.info("No weekend holidays to remove");
      return;
    }

    const confirmed = window.confirm(
      `Remove all weekend holidays for ${selectedYear}?`
    );
    if (!confirmed) return;

    try {
      await deleteBranchHolidays({
        branch_id: selectedBranch,
        year: selectedYear,
        dates: existingWeekendHolidays,
      });

      toast.success("Weekend holidays cleared");
      fetchHolidays();
    } catch {
      toast.error("Failed to clear weekend holidays");
    }
  };

  const handleClearAllHolidays = async () => {
    if (!selectedBranch) {
      toast.error("Select branch first");
      return;
    }

    const allDates = Object.keys(holidays);

    if (allDates.length === 0) {
      toast.info("No holidays to remove");
      return;
    }

    const confirmed = window.confirm(
      `DANGER: Remove ALL ${allDates.length} holidays for ${selectedYear}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteBranchHolidays({
        branch_id: selectedBranch,
        year: selectedYear,
        dates: allDates,
      });

      toast.success("All holidays cleared");
      fetchHolidays();
    } catch {
      toast.error("Failed to clear holidays");
    }
  };

  const markWeekend = (dayIndex, label) => {
    if (!selectedBranch) {
      toast.error("Select branch first");
      return;
    }

    const all = getWeekendsOfYear(selectedYear);
    const filtered = all.filter((d) => {
      const day = new Date(
        Number(d.slice(0, 4)),
        Number(d.slice(5, 7)) - 1,
        Number(d.slice(8, 10))
      ).getDay();
      return day === dayIndex;
    });

    setBulkDates(filtered);
    setBulkLabel(`${label} (${selectedYear})`);
    setIsBulk(true);
    setModalOpen(true);
  };

  /* =========================
     CALENDAR
  ========================= */

  const renderCalendar = () => {
    const days = getDaysInMonth(selectedYear, currentMonth);
    const start = getFirstDay(selectedYear, currentMonth);
    const cells = [];

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) =>
      cells.push(
        <div key={d} className="calendar-cell header">
          {d}
        </div>
      )
    );

    for (let i = 0; i < start; i++) {
      cells.push(
        <div key={`e-${i}`} className="calendar-cell empty" />
      );
    }

    for (let day = 1; day <= days; day++) {
      const m = String(currentMonth + 1).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const key = `${selectedYear}-${m}-${d}`;
      const h = holidays[key];

      cells.push(
        <div
          key={key}
          className="calendar-cell"
          onClick={() => openDate(day)}
        >
          <span className="day-number">{day}</span>
          {h && (
            <div className="holiday-marker">
              <strong>{h.reasonType}</strong>
              <span>{h.reasonText}</span>
            </div>
          )}
        </div>
      );
    }

    return <div className="calendar-grid">{cells}</div>;
  };

  /* =========================
     JSX
  ========================= */

  return (
    <div className="holidays-container">
      <PageHeader
        title="Holidays Management"
        subtitle="Branch-wise yearly holiday calendar"
        icon={<FaCalendarAlt />}
      />



      {selectedBranch ? (
        <>
          <div className="calendar-controls">
            <button className="next-prev-btn" onClick={() => setCurrentMonth((m) => (m === 0 ? 11 : m - 1))}>
              <FaChevronLeft />
            </button>

            <h2>
              {new Date(
                selectedYear,
                currentMonth
              ).toLocaleString("default", { month: "long" })}{" "}
              {selectedYear}
            </h2>

            <button className="next-prev-btn" onClick={() => setCurrentMonth((m) => (m === 11 ? 0 : m + 1))}>
              <FaChevronRight />
            </button>


        <div className="hf-select-group">
          
          <select
            className="hf-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const y = new Date().getFullYear() - 1 + i;
              return (
                <option key={y} value={y}>{y}</option>
              );
            })}
          </select>
        </div>

            <div className="bulk-actions">
              <button onClick={() => markWeekend(6, "All Saturdays")}>
                Mark Sat
              </button>
              <button onClick={() => markWeekend(0, "All Sundays")}>
                Mark Sun
              </button>
              <button className="clear-btn" onClick={handleClearWeekends}>
                Clear Weekends
              </button>
              <button className="clear-btn" onClick={handleClearAllHolidays}>
                Clear All
              </button>
            </div>
          </div>

          {renderCalendar()}
        </>
      ) : (
        <div style={{ marginTop: '40px' }}>
          <NoBranchState moduleName="Holidays" />
        </div>
      )}

      <HolidayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selectedDate}
        holidayData={!isBulk ? holidays[selectedDate] : null}
        isBulk={isBulk}
        bulkLabel={bulkLabel}
        onSave={saveHoliday}
        onRemove={removeHoliday}
      />
    </div>
  );
};

export default HolidaysPage;
