import mongoose from 'mongoose';

const jobQueueSchema = new mongoose.Schema({
  type: { type: String, enum: ['email', 'reminder'], required: true },
  payload: { type: Object, required: true },
  status: { type: String, enum: ['pending', 'failed', 'completed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  errorLog: String
}, { timestamps: true });

export default mongoose.model('JobQueue', jobQueueSchema);