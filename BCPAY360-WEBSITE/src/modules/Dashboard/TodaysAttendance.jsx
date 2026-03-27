import { useState, useEffect } from "react";
import { MdLogin, MdLogout } from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../utils/api";
import colors from "../../styles/colors";
import typography from "../../styles/typography";

const TodaysAttendance = ({ isDarkTheme, data, onAttendanceUpdate }) => {
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [otElapsedTime, setOtElapsedTime] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  const buildTimeForToday = (timeStr) => {
    if (!timeStr) return null;
    const now = new Date();
    const [h, m, s] = timeStr.split(":").map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s || 0);
  };

  const checkInDateTime = buildTimeForToday(data?.check_in_time);
  const checkOutDateTime = buildTimeForToday(data?.check_out_time);
  const otStartDateTime = buildTimeForToday(data?.ot_start_time);

  // 🔥 UPDATED LOGIC: Agar check_in_time nahi hai, toh "Not Checked In" dikhao
  const status = data?.check_in_time 
    ? (data?.status || "Present") 
    : "Not Checked In";

  useEffect(() => {
    let interval;
    const calculateHours = (start, end) => {
      if (!start || !end) return "00:00:00";
      const diff = end - start;
      if (diff < 0) return "00:00:00";
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    if (checkInDateTime && !checkOutDateTime) {
      setElapsedTime(calculateHours(checkInDateTime, new Date()));
      interval = setInterval(() => {
        setElapsedTime(calculateHours(checkInDateTime, new Date()));
      }, 1000);
    } else if (checkInDateTime && checkOutDateTime) {
      setElapsedTime(calculateHours(checkInDateTime, checkOutDateTime));
    } else {
      setElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [checkInDateTime, checkOutDateTime]);

  useEffect(() => {
    let interval;
    const calculateHours = (start, end) => {
      if (!start || !end) return "00:00:00";
      const diff = end - start;
      if (diff < 0) return "00:00:00";
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    if (otStartDateTime && data?.is_ot_session) {
      setOtElapsedTime(calculateHours(otStartDateTime, new Date()));
      interval = setInterval(() => {
        setOtElapsedTime(calculateHours(otStartDateTime, new Date()));
      }, 1000);
    } else {
      setOtElapsedTime("00:00:00");
    }
    return () => clearInterval(interval);
  }, [otStartDateTime, data?.is_ot_session]);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Browser does not support location"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => reject(new Error("Please allow location access."))
      );
    });

  const handleAttendanceAction = async (type) => {
    setLoading(true);
    try {
      const coords = await getLocation();
      const endpoint = type === "in" ? "/attendance/check-in" : "/attendance/check-out";
      await api.post(endpoint, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        device_type: "web",
      });
      toast.success(type === "in" ? "Checked In!" : "Checked Out!");
      onAttendanceUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOvertimeAction = async (type) => {
    setLoading(true);
    try {
      const coords = await getLocation();
      const endpoint = type === "start" ? "/attendance/overtime/start" : "/attendance/overtime/stop";
      const res = await api.post(endpoint, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      toast.success(res.data.message);
      onAttendanceUpdate?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "OT Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:-- --";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const seconds = parts[2] || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  };

  const theme = {
    cardBg: isDarkTheme ? colors.darkDropdown : colors.surface,
    title: isDarkTheme ? colors.textLight : colors.textMain,
    border: isDarkTheme ? colors.darkBorder : colors.border,
    mutedText: isDarkTheme ? colors.darkMuted : colors.textMuted,
    disabledBg: isDarkTheme ? colors.darkBorder : "#e5e7eb",
    disabledText: isDarkTheme ? colors.darkMuted : "#9ca3af",
  };

  // 🔥 UPDATED COLORS: "Not Checked In" ke liye neutral grey color
  const getStatusColor = () => {
    if (status === "Not Checked In") return theme.mutedText; 
    if (status === "Late") return colors.status.late.dot;
    if (status === "Present" || status === "HALF_DAY") return colors.status.present.dot;
    if (status === "Checked Out") return colors.primary;
    return colors.status.absent.dot;
  };

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      borderRadius: "12px",
      padding: "20px 24px",
      boxShadow: isDarkTheme ? "none" : colors.softShadow,
      border: `1px solid ${theme.border}`
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        flexWrap: "wrap", 
        gap: "24px" 
      }}>
        <StatGroup label="Status" value={status} color={getStatusColor()} theme={theme} isBold />
        <StatGroup label="Check In" value={formatTime(data?.check_in_time)} theme={theme} />
        <StatGroup label="Check Out" value={formatTime(data?.check_out_time)} theme={theme} />
        <StatGroup label="Total Hrs" value={elapsedTime} theme={theme} isBold />
        
        {data?.is_ot_session && (
           <StatGroup label="OT Timer" value={otElapsedTime} color={colors.primary} theme={theme} isBold />
        )}

        <div>
          {!checkInDateTime && (
            <ActionButton onClick={() => handleAttendanceAction("in")} disabled={loading} icon={<MdLogin size={18}/>} label={loading ? "..." : "Check In"} activeColor={colors.status.present.dot} theme={theme} />
          )}
          {checkInDateTime && !checkOutDateTime && (
            <ActionButton onClick={() => handleAttendanceAction("out")} disabled={loading} icon={<MdLogout size={18}/>} label={loading ? "..." : "Check Out"} activeColor={colors.status.absent.dot} theme={theme} />
          )}
          {checkInDateTime && checkOutDateTime && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {data?.is_ot_session ? (
                <ActionButton onClick={() => handleOvertimeAction("stop")} disabled={loading} icon={<MdLogout size={18}/>} label={loading ? "..." : "Stop OT"} activeColor={colors.status.late.dot} theme={theme} />
              ) : data?.can_start_ot ? (
                <ActionButton onClick={() => handleOvertimeAction("start")} disabled={loading} icon={<MdLogin size={18}/>} label={loading ? "..." : "Start OT"} activeColor={colors.primary} theme={theme} />
              ) : (
                <div style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "700", color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: "8px" }}>
                  Completed
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatGroup = ({ label, value, color, theme, isBold }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <div style={{ fontSize: "11px", color: theme.mutedText, fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ fontWeight: isBold ? "800" : "600", color: color || theme.title, fontSize: "15px", fontFamily: typography.fontFamily }}>
      {value}
    </div>
  </div>
);

const ActionButton = ({ onClick, disabled, icon, label, activeColor, theme }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: disabled ? theme.disabledBg : activeColor,
    color: disabled ? theme.disabledText : "#fff",
    border: "none", padding: "10px 18px",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "700",
    fontSize: "13px"
  }}>
    {icon} {label}
  </button>
);

export default TodaysAttendance;