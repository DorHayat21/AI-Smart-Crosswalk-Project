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
// GET /crosswalks/:id
router.get('/:id', async (req, res) => {
  try {
    // We use 'req.params.id' to get the ID from the URL
    const crosswalk = await Crosswalk.findById(req.params.id);
    
    // Check if it exists
    if (!crosswalk) {
      return res.status(404).json({ message: 'Crosswalk not found' });
    }
    
    res.status(200).json(crosswalk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;