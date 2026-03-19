import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Loading = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

// New Unified Page
const EmployeeFormsPage = lazy(() => import("./pages/EmployeeFormsPage"));

const FormsRouter = () => {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Redirect default to PF */}
                <Route index element={<Navigate to="pf" replace />} />

                {/* Unified Parameterized Route */}
                <Route path=":formType" element={<EmployeeFormsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="pf" replace />} />
            </Routes>
        </Suspense>
    );
};

export default FormsRouter;
