import { useEffect, useState, useCallback } from "react";
import {
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveHistory
} from "../../../api/master.api.js";

export default function useLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMeta, setPendingMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [historyMeta, setHistoryMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const fetchPending = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPendingLeaveRequests(params.page || 1, params.limit || 10, params);
      if (res?.success) {
        setRequests(res.data);
        if (res.meta) setPendingMeta(res.meta);
      } else {
        setError(res.message || "Failed to load pending requests");
      }
    } catch (err) {
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLeaveHistory(params.page || 1, params.limit || 10, params);
      if (res?.success) {
        setHistory(res.data);
        if (res.meta) setHistoryMeta(res.meta);
      } else {
        setError(res.message || "Failed to load leave history");
      }
    } catch (err) {
      setError("Failed to load leave history");
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (id, refreshParams = {}) => {
    try {
      const res = await approveLeaveRequest(id);
      if (res.success) {
        await fetchPending(refreshParams);
        await fetchHistory(refreshParams);
      } else {
        setError(res.message || "Failed to approve request");
      }
      return res;
    } catch (err) {
      setError("Failed to approve request");
    }
  }, [fetchPending, fetchHistory]);

  const reject = useCallback(async (id, remarks, refreshParams = {}) => {
    try {
      const res = await rejectLeaveRequest(id, remarks);
      if (res.success) {
        await fetchPending(refreshParams);
        await fetchHistory(refreshParams);
      } else {
        setError(res.message || "Failed to reject request");
      }
      return res;
    } catch (err) {
      setError("Failed to reject request");
    }
  }, [fetchPending, fetchHistory]);

  return {
    requests,
    history,
    loading,
    error,
    approve,
    reject,
    fetchPending,
    fetchHistory,
    pendingMeta,
    historyMeta
  };
}
