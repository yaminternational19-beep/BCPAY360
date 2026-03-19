import React from "react";

const SummaryCards = ({ cards }) => {
    return (
        <div className="summary-grid">
            {cards.map((card, index) => (
                <div key={index} className="stats-card">
                    <div className={`stats-card-icon ${card.color || "blue"}`}>
                        {card.icon}
                    </div>
                    <div className="card-info">
                        <span className="stats-label">{card.label}</span>
                        <h3 className="stats-value">{card.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SummaryCards;
