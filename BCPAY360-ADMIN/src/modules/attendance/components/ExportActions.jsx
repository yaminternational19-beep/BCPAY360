import { FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useToast } from "../../../context/ToastContext";

export default function ExportActions({
  context,          // DAILY | MONTHLY | HISTORY
  onExport,
  isSelectionEmpty = true
}) {
  const { error, success } = useToast();

  const handleExportClick = (type) => {
    if (isSelectionEmpty && context !== "HISTORY") {
      error("Please select employees to export");
      return;
    }
    success(`Generating ${type} report...`);
    onExport({ type, context });
  };
  return (
    <div className="export-actions" style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => handleExportClick("EXCEL")}
        title={`Export ${context} to Excel`}
        className="btn-export-excel"
      >
        <FileSpreadsheet size={16} />
        <span>Excel</span>
      </button>

      <button
        onClick={() => handleExportClick("PDF")}
        title={`Export ${context} to PDF`}
        className="btn-export-pdf"
      >
        <FileText size={16} />
        <span>PDF</span>
      </button>
    </div>
  );
}
