import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getBranches } from "../api/master.api";

// Create Branch Context
const BranchContext = createContext(null);

// BranchProvider Component
export function BranchProvider({ children }) {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null); // null = ALL
    const [isSingleBranch, setIsSingleBranch] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [branchStatus, setBranchStatus] = useState("LOADING");
    // LOADING | NO_BRANCH | SINGLE | MULTIPLE | ERROR

    const refreshBranches = useCallback(async () => {
        try {
            setIsLoading(true);
            setBranchStatus((prev) => (prev === "ERROR" ? "LOADING" : prev));

            const res = await getBranches();

            // 1. Normalize API Response
            const branchList = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : [];

            setBranches(branchList);

            // 🚫 NO BRANCH
            if (branchList.length === 0) {
                setBranchStatus("NO_BRANCH");
                setSelectedBranch(null);
                setIsSingleBranch(false);
                localStorage.removeItem("selected_branch");
                return;
            }

            // ✅ SINGLE BRANCH → auto select
            if (branchList.length === 1) {
                const id = branchList[0].id;
                setBranchStatus("SINGLE");
                setSelectedBranch(id);
                setIsSingleBranch(true);
                localStorage.setItem("selected_branch", String(id));
                return;
            }

            // 🔀 MULTIPLE BRANCHES
            setBranchStatus("MULTIPLE");
            setIsSingleBranch(false);

            // 3. Auto-correct invalid selectedBranch
            const saved = localStorage.getItem("selected_branch");
            const savedId = saved ? Number(saved) : null;

            // Prioritize current state if valid, then localStorage, else default to null (ALL)
            // But usually we just want to validate what we *intend* to select.
            // Let's validate the persisted 'savedId' first since that's our source of truth across reloads.

            if (savedId && branchList.some(b => b.id === savedId)) {
                setSelectedBranch(savedId);
            } else {
                // Invalid or missing -> Default to ALL
                setSelectedBranch(null);
                localStorage.removeItem("selected_branch");
            }

        } catch (err) {
            console.error("Branch fetch failed", err);
            setBranchStatus("ERROR");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshBranches();
    }, [refreshBranches]);

    const changeBranch = (branchId) => {
        // null = ALL branches
        if (branchId === null) {
            setSelectedBranch(null);
            localStorage.removeItem("selected_branch");
            return;
        }

        const id = Number(branchId);
        if (!branches.some(b => b.id === id)) return;

        setSelectedBranch(id);
        localStorage.setItem("selected_branch", String(id));
    };

    const value = React.useMemo(() => ({
        branches,
        selectedBranch,   // number | null
        changeBranch,
        refreshBranches,  // Exposed method
        isSingleBranch,
        isLoading,
        branchStatus,
        canProceed: branches.length > 0 && branchStatus !== "ERROR"
    }), [branches, selectedBranch, isSingleBranch, isLoading, branchStatus]);

    return (
        <BranchContext.Provider value={value}>
            {children}
        </BranchContext.Provider>
    );
}

// Custom hook to use Branch Context
export function useBranch() {
    const context = useContext(BranchContext);

    if (context === null) {
        throw new Error("useBranch must be used within a BranchProvider");
    }

    return context;
}
