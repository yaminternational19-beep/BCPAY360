import { useEffect, useState, useCallback } from "react";
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  toggleLeaveTypeStatus
} from "../../../api/master.api.js";

export default function useLeaveMaster() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ============================
     FETCH
  ============================ */
  const fetchLeaveTypes = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const res = await getLeaveTypes();
      if (!res?.success) {
        throw new Error(res?.message || "Failed to load leave types");
      }

      setLeaveTypes(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load leave types");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /* ============================
     CREATE
  ============================ */
  const addLeaveType = async (payload) => {
    try {
      setLoading(true);
      const res = await createLeaveType(payload);

      if (!res?.success) {
        throw new Error(res?.message || "Create failed");
      }

      await fetchLeaveTypes(true);
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     UPDATE
  ============================ */
  const editLeaveType = async (id, payload) => {
    const previous = leaveTypes;

    setLeaveTypes(prev =>
      prev.map(l => (l.id === id ? { ...l, ...payload } : l))
    );

    try {
      const res = await updateLeaveType(id, payload);
      if (!res?.success) {
        throw new Error(res?.message || "Update failed");
      }
      return res;
    } catch (err) {
      setLeaveTypes(previous);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  /* ============================
     DELETE
  ============================ */
  const removeLeaveType = async (id) => {
    const previous = leaveTypes;

    setLeaveTypes(prev => prev.filter(l => l.id !== id));

    try {
      const res = await deleteLeaveType(id);
      if (!res?.success) {
        throw new Error(res?.message || "Delete failed");
      }
      return res;
    } catch (err) {
      setLeaveTypes(previous);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  /* ============================
     TOGGLE STATUS
  ============================ */
  const toggleStatus = async (id, isActive) => {
    const previous = leaveTypes;

    setLeaveTypes(prev =>
      prev.map(l =>
        l.id === id ? { ...l, is_active: isActive } : l
      )
    );

    try {
      const res = await toggleLeaveTypeStatus(id, isActive);
      if (!res?.success) {
        throw new Error(res?.message || "Status update failed");
      }
      return res;
    } catch (err) {
      setLeaveTypes(previous);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  /* ============================
     INITIAL LOAD
  ============================ */
  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  return {
    leaveTypes,
    loading,
    error,

    // CRUD
    addLeaveType,
    editLeaveType,
    removeLeaveType,
    toggleStatus,

    refresh: fetchLeaveTypes
  };
}
