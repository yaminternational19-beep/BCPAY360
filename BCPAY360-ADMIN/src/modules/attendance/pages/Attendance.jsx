import { useEffect, useState } from "react";
import "../../../styles/Attendance.css";

/* Components */
import AttendanceHeader from "../components/AttendanceHeader";
import AttendanceSummary from "../components/AttendanceSummary";
import DailyAttendanceTable from "../components/DailyAttendanceTable";
import MonthlyAttendanceTable from "../components/MonthlyAttendanceTable";
import HistoryAttendanceDrawer from "../components/HistoryAttendanceDrawer";
import NoBranchState from "../../../components/NoBranchState";
import { useBranch } from "../../../hooks/useBranch";
import { useToast } from "../../../context/ToastContext";

/* API */
import {
  fetchDailyAttendance,
  fetchHistoryAttendance,
  fetchMonthlyAttendance
} from "../../../api/master.api";

/* EXPORT UTILS */
import { exportDailyExcel } from "../../../utils/export/exportDailyExcel";
import { exportDailyPDF } from "../../../utils/export/exportDailyPDF";
import { exportMonthlyExcel } from "../../../utils/export/exportMonthlyExcel";
import { exportMonthlyPDF } from "../../../utils/export/exportMonthlyPDF";
import { exportHistoryExcel } from "../../../utils/export/exportHistoryExcel";
import { exportHistoryPDF } from "../../../utils/export/exportHistoryPDF";

const AttendancePage = () => {
  const { info, success, error } = useToast();
  const { canProceed, isLoading: branchLoading, selectedBranch } = useBranch();
  const today = new Date().toISOString().slice(0, 10);

  const [viewType, setViewType] = useState("DAILY");
  const [attendanceMode, setAttendanceMode] = useState("DAILY");

  const [date, setDate] = useState(today);
  const [rows, setRows] = useState([]);

  const [monthRange, setMonthRange] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_records: 0
  });
  const [loading, setLoading] = useState(false);

  const [historyData, setHistoryData] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    shiftId: "",
    status: "",
    page: 1,
    limit: 20
  });

  const [selectedIds, setSelectedIds] = useState([]);

  /* AUTO INIT MONTH */
  useEffect(() => {
    if (attendanceMode === "MONTHLY" && !monthRange) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const fromDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const toDate = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;
      setMonthRange({ fromDate, toDate });
    }
  }, [attendanceMode, monthRange]);

  /* LOAD DAILY */
  useEffect(() => {
    if (viewType === "DAILY" && attendanceMode === "DAILY") {
      setLoading(true);
      fetchDailyAttendance({ date, ...filters, branch_id: selectedBranch })
        .then(res => {
          setRows(res.data);
          setSummary(res.summary);
          setPagination(res.pagination || { page: 1, limit: 20, total_records: res.data?.length || 0 });
          setSelectedIds([]); // Reset selection on new fetch
        })
        .finally(() => setLoading(false));
    }
  }, [date, attendanceMode, filters, viewType, selectedBranch]);

  /* LOAD MONTHLY */
  useEffect(() => {
    if (viewType === "DAILY" && attendanceMode === "MONTHLY" && monthRange) {
      setLoading(true);
      fetchMonthlyAttendance({ ...monthRange, ...filters, branch_id: selectedBranch })
        .then(res => {
          setMonthlyData(res.data);
          setSummary(res.summary); // Ensure summary is set for monthly too
          setPagination(res.pagination || { page: 1, limit: 20, total_records: res.data?.length || 0 });
          setSelectedIds([]); // Reset selection on new fetch
        })
        .finally(() => setLoading(false));
    }
  }, [attendanceMode, monthRange, filters, viewType, selectedBranch]);

  /* LOAD HISTORY */
  const loadHistoryAttendance = async (employeeId, fromDate, toDate) => {
    setSelectedEmployeeId(employeeId);

    // Default to last 30 days if no range provided
    const from = fromDate || new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .slice(0, 10);
    const to = toDate || today;

    setLoading(true);
    try {
      const res = await fetchHistoryAttendance({
        employeeId,
        from,
        to
      });
      setHistoryData(res);
      setViewType("HISTORY");
    } finally {
      setLoading(false);
    }
  };

  /* EXPORT HANDLER (THIS MAKES DOWNLOAD WORK) */
  const handleExport = ({ type, context }) => {
    // Helper to filter by selection
    const filterData = (data, idKey = 'employee_id') => {
      if (selectedIds.length > 0) {
        return data.filter(item => selectedIds.includes(item[idKey]));
      }
      return data; // Export all if nothing selected? Or restrict? 
      // User said "select export", usually implies "export what is selected".
      // But typically if none selected, button is disabled in UI based on my implementation below.
      // However, if I allow "Export All" when none selected, I should return data.
      // Current Plan: Pass disabled state to Header, so this runs only when selectedIds > 0 (or if we default to all).
      // Let's assume we export ONLY selected if selected > 0. If 0 selected, Header disables buttons.
      return data;
    };

    if (context === "DAILY") {
      const dataToExport = filterData(rows);
      if (!dataToExport.length) return alert("No data to export");

      type === "EXCEL"
        ? exportDailyExcel(dataToExport, date)
        : exportDailyPDF(dataToExport, date);
    }

    if (context === "MONTHLY") {
      const dataToExport = filterData(monthlyData);
      if (!dataToExport.length) return alert("No data to export");

      type === "EXCEL"
        ? exportMonthlyExcel(dataToExport, monthRange.fromDate, monthRange.toDate)
        : exportMonthlyPDF(dataToExport, monthRange.fromDate, monthRange.toDate);
    }

    if (context === "HISTORY" && historyData?.data?.length) {
      const name = historyData.employee_name || "Employee";
      type === "EXCEL"
        ? exportHistoryExcel(historyData.data, name)
        : exportHistoryPDF(historyData.data, name);
    }
  };

  /* ===================================================================================
     RENDER
     =================================================================================== */
  if (branchLoading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!canProceed) {
    return (
      <div className="attendance-page">
        <h1 className="page-title">Attendance Management</h1>
        <NoBranchState moduleName="Attendance" />
      </div>
    );
  }

  // Handle Selection Toggle
  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids) => {
    setSelectedIds(ids);
  };

  return (
    <div className="attendance-container">
      {viewType === "DAILY" && (
        <AttendanceSummary summary={summary} loading={loading} />
      )}

      <AttendanceHeader
        viewType={viewType}
        attendanceMode={attendanceMode}
        date={date}
        monthRange={monthRange}
        filters={filters}
        onDateChange={setDate}
        onMonthChange={setMonthRange}
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))}
        onExport={handleExport}
        isSelectionEmpty={selectedIds.length === 0}
        onBack={() => {
          setViewType("DAILY");
          setHistoryData(null);
        }}
        onModeChange={(mode) => {
          setAttendanceMode(mode);
          setSummary(null);
          setSelectedIds([]);
          if (mode === "DAILY") {
            setMonthlyData([]);
            info("Switched to Daily View");
          }
          if (mode === "MONTHLY") {
            setRows([]);
            info("Switched to Monthly View");
          }
        }}
      />

      {viewType === "DAILY" && attendanceMode === "DAILY" && (
        <DailyAttendanceTable
          rows={rows}
          loading={loading}
          onViewHistory={loadHistoryAttendance}
          selectedIds={selectedIds}
          onSelectOne={handleSelectOne}
          onSelectAll={handleSelectAll}
          pagination={pagination}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
        />
      )}

      {viewType === "DAILY" && attendanceMode === "MONTHLY" && (
        <>
          {/* Optional: Add Monthly Summary here if API supports it, 
              or keep it consistent with Daily after swapping header */}
          <MonthlyAttendanceTable
            data={monthlyData}
            loading={loading}
            selectedIds={selectedIds}
            onSelectOne={handleSelectOne}
            onSelectAll={handleSelectAll}
            pagination={pagination}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        </>
      )}


      {viewType === "HISTORY" && historyData && (
        <HistoryAttendanceDrawer
          data={historyData}
          loading={loading}
          onRefresh={(from, to) => loadHistoryAttendance(selectedEmployeeId, from, to)}
          onClose={() => {
            setViewType("DAILY");
            setHistoryData(null);
            setSelectedEmployeeId(null);
          }}
        />
      )}
    </div>
  );
};

export default AttendancePage;
