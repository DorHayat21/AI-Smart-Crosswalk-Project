import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  crosswalkId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Crosswalk', 
    required: true 
  },
  imageUrl: { type: String },
  description: { type: String },
  
  // Metrics from AI
  detectionDistance: { type: Number },
  detectedObjectsCount: { type: Number, default: 1 },
  
  // System Logs
  ledActivated: { type: Boolean, default: false },
  isHazard: { type: Boolean, default: true },
  
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });


export default mongoose.model('Alert', alertSchema);