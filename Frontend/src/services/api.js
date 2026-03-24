// API Base URL - relative so Vite proxy can forward to the backend
const API_BASE_URL = "";
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * Helper function to get full image URL
 * Converts relative image paths to absolute URLs pointing to backend
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a data URI, return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // Convert relative path to backend URL
  // Remove leading slash if present
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
  return `${BACKEND_BASE_URL}/${cleanPath}`;
};

/**
 * Fetch all crosswalks
 * GET /crosswalks
 */
export const fetchCrosswalks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/crosswalks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching crosswalks:', error);
    throw error;
  }
};

/**
 * Fetch all recent alerts
 * GET /alerts
 */
export const fetchAlerts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Fetch alerts for a specific crosswalk
 * GET /alerts/crosswalk/:id
 */
export const fetchAlertsByCrosswalk = async (crosswalkId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/crosswalk/${crosswalkId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching alerts for crosswalk ${crosswalkId}:`, error);
    throw error;
  }
};

/**
 * Create a new alert
 * POST /ai/alerts
 */
export const createAlert = async (alertData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};
