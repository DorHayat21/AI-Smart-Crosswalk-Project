import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  crosswalkId: {  // Reference to the Crosswalk document
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Crosswalk', // This creates a relationship between Alert and Crosswalk collections
    required: true // Each alert must be associated with a specific crosswalk
  },
  imageUrl: { type: String }, // URL to the image captured by the AI
  description: { type: String }, // Description of the alert
  
  // Fields for AI analysis
  isHazard: { type: Boolean, default: true },
  reasons: [{ type: String }], // Reasons for hazard 
  
  // Distance from the camera to the detected hazard (estimated by AI)
  detectionDistance: { type: Number, default: 0 }, 
  
  // Fields from the system
  detectedObjectsCount: { type: Number, default: 1 },
  ledActivated: { type: Boolean, default: false },
  
  timestamp: { type: Date, default: Date.now } // Automatically set the timestamp when the alert is created
}, { versionKey: false });

export default mongoose.model('Alert', alertSchema);