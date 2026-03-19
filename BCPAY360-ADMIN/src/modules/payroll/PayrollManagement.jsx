import React from "react";
import { Routes, Route } from "react-router-dom";
import PayrollList from "./components/PayrollList";
import PayrollConfirm from "./components/PayrollConfirm";

const PayrollManagement = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<PayrollList />}
      />
      <Route path="/confirm" element={<PayrollConfirm />} />
    </Routes>
  );
};

export default PayrollManagement;