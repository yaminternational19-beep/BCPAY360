import React from "react";
import { FaSearch } from "react-icons/fa";

const FiltersBar = ({ search, onSearchChange, children }) => {
    return (
        <div className="filters-container">
            <div className="search-wrapper">

                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="filters-group">
                {children}
            </div>
        </div>
    );
};

export default FiltersBar;
