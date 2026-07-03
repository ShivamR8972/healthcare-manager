import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true },
  workingHours: {
    start: { type: String, required: true }, // HH:MM
    end: { type: String, required: true }   // HH:MM
  },
  slotDuration: { type: Number, default: 30 }, // in minutes
  leaveDays: [{ type: String }] // Array of ISO strings (YYYY-MM-DD)
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema);