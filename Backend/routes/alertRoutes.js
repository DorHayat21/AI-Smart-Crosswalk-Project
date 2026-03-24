import express from "express";
import Alert from "../models/Alert.js"; // Import the model

const router = express.Router();

/**
 * Normalize image URLs to ensure they use relative paths or correct backend port
 * Converts old URLs with incorrect ports to proper paths
 */
const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  // If it's a Cloudinary URL or external URL, return as-is
  if (
    imageUrl.includes("cloudinary") ||
    (imageUrl.includes("http://") && !imageUrl.includes("localhost")) ||
    imageUrl.includes("https://")
  ) {
    return imageUrl;
  }

  // If it's a localhost URL, extract the path and return as relative
  if (imageUrl.includes("localhost")) {
    try {
      const url = new URL(imageUrl);
      return url.pathname; // Return as relative path like /output_images/...
    } catch {
      return imageUrl; // If parsing fails, return original
    }
  }

  // Already a relative path
  return imageUrl;
};

/**
 * Normalize alerts array for consistent image URLs
 */
const normalizeAlerts = (alerts) => {
  if (Array.isArray(alerts)) {
    return alerts.map((alert) => ({
      ...(alert.toObject ? alert.toObject() : alert),
      imageUrl: normalizeImageUrl(alert.imageUrl),
    }));
  }
  return alerts;
};

// POST /api/ai/alerts
router.post("/", async (req, res) => {
  try {
    const {
      crosswalkId,
      imageUrl,
      description,
      detectionDistance,
      detectedObjectsCount,
      ledActivated,
    } = req.body;

    const newAlert = new Alert({
      crosswalkId,
      imageUrl,
      description,
      detectionDistance,
      detectedObjectsCount,
      ledActivated,
    });

    const savedAlert = await newAlert.save();
    // Log solely for server monitoring
    console.log(`[ALERT LOGGED] Crosswalk ID: ${crosswalkId}`);

    res.status(201).json(savedAlert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/alerts
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate("crosswalkId")
      .sort({ timestamp: -1 });
    const normalizedAlerts = normalizeAlerts(alerts);
    res.status(200).json(normalizedAlerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /alerts/crosswalk/:id - Get all alerts belonging to a specific crosswalk
router.get("/crosswalk/:id", async (req, res) => {
  try {
    // Find alerts where 'crosswalkId' matches the ID in the URL
    const alerts = await Alert.find({ crosswalkId: req.params.id })
      .populate("crosswalkId")
      .sort({ timestamp: -1 });

    const normalizedAlerts = normalizeAlerts(alerts);
    res.status(200).json(normalizedAlerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
