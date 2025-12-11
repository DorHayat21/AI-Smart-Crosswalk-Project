import express from 'express';
import Crosswalk from '../models/Crosswalk.js'; // Import the model

const router = express.Router();

// POST /api/crosswalks
router.post('/', async (req, res) => {
  try {
    const newCrosswalk = new Crosswalk(req.body);
    const saved = await newCrosswalk.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/crosswalks
router.get('/', async (req, res) => {
  try {
    const crosswalks = await Crosswalk.find();
    res.status(200).json(crosswalks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;