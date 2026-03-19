export default function AttendanceModeToggle({
  mode = "DAILY",
  onChange = () => {}
}) {
  const handleChange = (nextMode) => {
    if (nextMode === mode) return; // avoid unnecessary rerender
    onChange(nextMode);
  };

  return (
    <div className="mode-toggle">
      <button
        type="button"
        className={`mode-btn ${mode === "DAILY" ? "active" : ""}`}
        onClick={() => handleChange("DAILY")}
      >
        Daily
      </button>

      <button
        type="button"
        className={`mode-btn ${mode === "MONTHLY" ? "active" : ""}`}
        onClick={() => handleChange("MONTHLY")}
      >
        Monthly
      </button>
    </div>
  );
}
