import mongoose from 'mongoose';

const crosswalkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { 
    type: String, 
    enum: ['active', 'maintenance', 'inactive'], 
    default: 'active' 
  },
  ledSystemUrl: { type: String }
}, { versionKey: false });

export default mongoose.model('Crosswalk', crosswalkSchema);