import React from "react";

const DataTable = ({ columns, data, emptyState, rowClassName }) => {
    if (!data || data.length === 0) {
        return (
            <div className="empty-state-card">
                <div className="empty-state-icon-large">{emptyState?.icon || "📄"}</div>
                <h3>{emptyState?.title || "No records found"}</h3>
                <p>{emptyState?.subtitle || "Try adjusting your filters or check back later."}</p>
            </div>
        );
    }

    return (
        <div className="data-table-wrapper">
            <table className="modern-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} className={col.className}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr key={rowIdx} className={rowClassName ? rowClassName(row) : ""}>
                            {columns.map((col, colIdx) => (
                                <td key={colIdx} className={col.className}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
