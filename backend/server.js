import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import { register, login, getAuthUrl, googleCallback } from './controllers/authController.js';
import { bookAppointment, completeAppointment } from './controllers/appointmentController.js';
import { upsertDoctorProfile, setDoctorLeave } from './controllers/adminController.js';
import { protect } from './middleware/auth.js';
import { initBackgroundJobs } from './services/cronService.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Auth Endpoints
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/google', getAuthUrl);
app.get('/api/auth/google/callback', googleCallback);

// Booking Endpoints
app.post('/api/appointments/book', protect(['patient']), bookAppointment);
app.post('/api/appointments/complete', protect(['doctor']), completeAppointment);

// Admin Configuration Endpoints
app.post('/api/admin/doctor-profile', protect(['admin']), upsertDoctorProfile);
app.post('/api/admin/doctor-leave', protect(['admin']), setDoctorLeave);

// Expose list of available doctors
app.get('/api/doctors', protect(['patient']), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name _id');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// To retriecve appointments
app.get('/api/doctor/appointments', protect(['doctor']), async (req, res) => {
  try {
    // Find all booked appointments for the currently logged-in doctor
    const appointments = await Appointment.find({ doctorId: req.user.id, status: 'booked' })
      .populate('patientId', 'name email');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve Active Credentials of doctor
app.get('/api/doctor/status', protect(['doctor']), async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    // Return true if googleTokens object exists and has an access_token
    const isLinked = !!(doctor.googleTokens && doctor.googleTokens.access_token);
    res.json({ isLinked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback Status Target route
app.get('/', (req, res) => res.send('Healthcare API Operational'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Engine Verified Connection.");
    initBackgroundJobs();
    app.listen(process.env.PORT || 5000, () => console.log(`Active server: port ${process.env.PORT || 5000}`));
  })
  .catch(err => console.log(err));