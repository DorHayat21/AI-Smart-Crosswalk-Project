import express from 'express';
import Alert from '../models/Alert.js'; // Import the model

const router = express.Router();

// POST /api/ai/alerts
router.post('/', async (req, res) => {
  try {
    const { 
        crosswalkId, imageUrl, description, 
        detectionDistance, detectedObjectsCount, ledActivated 
    } = req.body;

    const newAlert = new Alert({
        crosswalkId, imageUrl, description,
        detectionDistance, detectedObjectsCount, ledActivated
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
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().populate('crosswalkId').sort({ timestamp: -1 });
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;