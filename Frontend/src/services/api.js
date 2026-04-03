const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * Helper function to get full image URL
 * Converts relative image paths to absolute URLs pointing to backend
 * Also normalizes old URLs with incorrect ports
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's a data URI, return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  // If it's a full URL, check if it needs port correction
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    // Fix URLs with old port (3000 or other incorrect ports)
    // Extract the path part and rebuild with correct backend URL
    const urlObj = new URL(imageUrl);

    // If the path starts with /output_images, use it with the correct backend
    if (urlObj.pathname.startsWith("/output_images")) {
      return `${BASE_URL}${urlObj.pathname}`;
    }

    // Otherwise return as-is (likely Cloudinary or other external URL)
    return imageUrl;
  }

  // Convert relative path to backend URL
  // Remove leading slash if present
  const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  return `${BASE_URL}/${cleanPath}`;
};

/**
 * Fetch all crosswalks
 * GET /crosswalks
 */
export const fetchCrosswalks = async () => {
  try {
    const response = await fetch(`${BASE_URL}/crosswalks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching crosswalks:", error);
    throw error;
  }
};

/**
 * Fetch all recent alerts
 * GET /alerts
 */
export const fetchAlerts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/alerts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error;
  }
};

/**
 * Fetch alerts for a specific crosswalk
 * GET /alerts/crosswalk/:id
 */
export const fetchAlertsByCrosswalk = async (crosswalkId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/alerts/crosswalk/${crosswalkId}`,
    );
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
    const response = await fetch(`${BASE_URL}/ai/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alertData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
};
