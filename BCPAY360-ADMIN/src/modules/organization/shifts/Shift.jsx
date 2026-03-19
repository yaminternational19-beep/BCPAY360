import React, { useEffect, useState } from "react";
import "../../../styles/Shifts.css";
import ShiftList from "./ShiftList";
import ShiftForm from "./ShiftForm";
import { useBranch } from "../../../hooks/useBranch";
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift as apiDeleteShift,
  toggleShiftStatus,
} from "../../../api/master.api";
import { useToast } from "../../../context/ToastContext";


export default function Shift({ user }) {
  const isAdmin = user?.role === "COMPANY_ADMIN";
  const isHR = user?.role === "HR";

  const canCreate = isAdmin;
  const canEdit = isAdmin || isHR;
  const canDelete = isAdmin;

  // Use centralized branch state
  const {
    branches,
    selectedBranch,
    changeBranch,
    branchStatus,
    isLoading: branchLoading
  } = useBranch();

  const [shifts, setShifts] = useState([]);
  const [mode, setMode] = useState('list');
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();


  const loadShifts = async (branchId) => {
    // If selectedBranch is null, we fetch all branches (assuming API handles it or we pass null)
    try {
      const data = await getShifts(branchId);
      setShifts(Array.isArray(data) ? data : []);
    } catch (error) {
      setShifts([]);
    }
  };

  useEffect(() => {
    // Always fetch, whether selectedBranch is specific ID or null (All)
    loadShifts(selectedBranch);
  }, [selectedBranch]);

  const handleCreateShift = async (shiftData) => {
    if (!canCreate || !shiftData.shift_name.trim() || !shiftData.start_time || !shiftData.end_time || !selectedBranch) return;

    setLoading(true);
    try {
      await createShift({
        shift_name: shiftData.shift_name.trim(),
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        description: shiftData.description || null,
        branch_id: Number(selectedBranch),
      });
      toast.success("Shift added successfully");
      loadShifts(selectedBranch);
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create shift: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShift = async (id, shiftData) => {
    if (!canEdit) return;

    setLoading(true);
    try {
      await updateShift(id, {
        shift_name: shiftData.shift_name.trim(),
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        description: shiftData.description || null,
      });
      toast.success("Shift updated successfully");
      loadShifts(selectedBranch);
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update shift: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (id) => {
    if (!canDelete) return;
    if (!confirm("Delete this shift?")) return;

    try {
      await apiDeleteShift(id);
      toast.success("Shift removed");
      loadShifts(selectedBranch);
    } catch (error) {
      toast.error("Failed to delete shift: " + error.message);
    }
  };

  const handleToggleStatus = async (shift) => {
    try {
      await toggleShiftStatus(shift.id);
      loadShifts(selectedBranch);
    } catch (error) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const onAdd = () => {
    setMode('form');
    setCurrentShift(null);
  };

  const onEdit = (shift) => {
    setMode('form');
    setCurrentShift(shift);
  };

  const onSave = async (shiftData) => {
    if (currentShift) {
      await handleUpdateShift(currentShift.id, shiftData);
    } else {
      await handleCreateShift(shiftData);
    }
    setMode('list');
    setCurrentShift(null);
  };

  const onCancel = () => {
    if (!currentShift) {
      toast.info("Shift creation was cancelled");
    }
    setMode('list');
    setCurrentShift(null);
  };


  return (
    <div
      className="sm-page-container"
      style={mode === 'form' ? { overflowY: 'auto' } : {}}
    >
      {mode === 'list' ? (
        <ShiftList
          branches={branches}
          selectedBranch={selectedBranch}
          branchStatus={branchStatus}
          changeBranch={changeBranch}
          shifts={shifts}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={handleDeleteShift}
          onToggleStatus={handleToggleStatus}
          user={user}
        />
      ) : (
        <ShiftForm
          onSave={onSave}
          onCancel={onCancel}
          initialData={currentShift}
          selectedBranch={selectedBranch}
          user={user}
          loading={loading}
        />
      )}
    </div>
  );
}