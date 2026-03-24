/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { fetchAlerts } from "../services/api";

const AlertsContext = createContext(null);
const SOCKET_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const sortAlertsByTimestamp = (alerts) =>
  [...alerts].sort(
    (left, right) =>
      new Date(right?.timestamp || 0).getTime() -
      new Date(left?.timestamp || 0).getTime(),
  );

const upsertAlert = (alerts, incomingAlert) => {
  if (!incomingAlert) {
    return alerts;
  }

  if (!incomingAlert._id) {
    return sortAlertsByTimestamp([incomingAlert, ...alerts]);
  }

  const nextAlerts = alerts.filter((alert) => alert?._id !== incomingAlert._id);
  nextAlerts.unshift(incomingAlert);
  return sortAlertsByTimestamp(nextAlerts);
};

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const isMountedRef = useRef(true);
  const socketRef = useRef(null);

  const loadAlerts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError(null);
      const nextAlerts = await fetchAlerts();

      if (!isMountedRef.current) {
        return;
      }

      setAlerts(sortAlertsByTimestamp(nextAlerts || []));
      setLastUpdate(new Date());
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      setError(err.message || "Failed to load alerts.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadAlerts(true);

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (isMountedRef.current) {
        setConnectionStatus("connected");
      }
    });

    socket.on("disconnect", () => {
      if (isMountedRef.current) {
        setConnectionStatus("disconnected");
      }
    });

    socket.on("connect_error", () => {
      if (isMountedRef.current) {
        setConnectionStatus("error");
      }
    });

    socket.on("new_alert", (incomingAlert) => {
      if (!isMountedRef.current) {
        return;
      }

      setAlerts((currentAlerts) => upsertAlert(currentAlerts, incomingAlert));
      setLastUpdate(new Date());
      setError(null);
    });

    return () => {
      isMountedRef.current = false;

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.close();
      }
    };
  }, [loadAlerts]);

  const value = useMemo(
    () => ({
      alerts,
      loading,
      error,
      lastUpdate,
      connectionStatus,
      refetch: () => loadAlerts(true),
    }),
    [alerts, loading, error, lastUpdate, connectionStatus, loadAlerts],
  );

  return (
    <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error("useAlerts must be used within an AlertsProvider.");
  }

  return context;
};
