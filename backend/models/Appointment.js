import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  slot: { type: String, required: true }, // HH:MM
  status: { type: String, enum: ['booked', 'cancelled', 'completed'], default: 'booked' },
  symptoms: { type: String, required: true },
  
  // AI Generated Data
  preVisitSummary: {
    urgencyLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Error Processing'] },
    chiefComplaint: String,
    suggestedQuestions: [String]
  },
  clinicalNotes: String,
  postVisitSummary: {
    summaryText: String,
    medicationSchedule: String,
    followUpSteps: String
  },
  
  // Integrations
  googleCalendarEventId: String
}, { timestamps: true });

// Prevent simultaneous slot double-booking at the schema constraint layer
appointmentSchema.index({ doctorId: 1, date: 1, slot: 1 }, { unique: true, partialFilterExpression: { status: 'booked' } });

export default mongoose.model('Appointment', appointmentSchema);