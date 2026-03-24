import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for real-time updates using polling
 * @param {Function} fetchFunction - The function to call for fetching data
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @returns {Object} { data, loading, error, refetch, lastUpdate }
 */
export const useRealTimeUpdates = (fetchFunction, interval = 5000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const startupTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!isMountedRef.current || inFlightRef.current) return;
    
    try {
      inFlightRef.current = true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const result = await fetchFunction();
      
      if (isMountedRef.current) {
        setData(result);
        setLastUpdate(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'שגיאה בטעינת נתונים');
        setLoading(false);
        console.error('Real-time update error:', err);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [fetchFunction]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch is scheduled asynchronously to avoid sync setState in effect body.
    startupTimeoutRef.current = setTimeout(() => {
      fetchData(true);
    }, 0);

    // Setup polling if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't show loading on background updates
      }, interval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdate
  };
};

/**
 * Hook for showing update notification
 */
export const useUpdateNotification = (lastUpdate) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      const showTimer = setTimeout(() => {
        setShowNotification(true);
      }, 0);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 2000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(timer);
      };
    }
  }, [lastUpdate]);

  return showNotification;
};

