import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import JobQueue from '../models/JobQueue.js';
import { generatePreVisitSummary, generatePostVisitSummary } from '../services/geminiService.js';
import { createCalendarEvent, deleteCalendarEvent } from '../services/integrationService.js';

export const bookAppointment = async (req, res) => {
  const { doctorId, date, slot, symptoms } = req.body;
  const patientId = req.user.id;

  try {
    // 1. Strict validation Check for Leaves with Defensive Guard
    const profile = await DoctorProfile.findOne({ doctorId });
    
    // If the admin hasn't set up the profile details yet, we handle it safely
    if (profile && profile.leaveDays && profile.leaveDays.includes(date)) {
      return res.status(400).json({ error: "Doctor is on leave on this date." });
    }

    // 2. Run AI generation in parallel to optimize payload setup
    const preVisitSummary = await generatePreVisitSummary(symptoms);

    // 3. Persist transaction safely
    const appointment = new Appointment({
      patientId, doctorId, date, slot, symptoms, preVisitSummary
    });
    await appointment.save();

    // 4. Integrations
    const doctor = await User.findById(doctorId);
    const patient = await User.findById(patientId);

    let eventId = null;
    try {
      eventId = await createCalendarEvent(doctor, patient, appointment);
      if (eventId) {
        appointment.googleCalendarEventId = eventId;
        await appointment.save();
      }
    } catch (gErr) { console.error("Calendar link failed gracefully", gErr); }

    // Queue system transaction alerts safely
    await JobQueue.create({
      type: 'email',
      payload: { to: patient.email, subject: "Booking Confirmed", html: `<h3>Your appointment is confirmed for ${date} at ${slot}.</h3>` }
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Double booking collision! This slot was just reserved." });
    }
    res.status(500).json({ error: error.message });
  }
};

export const completeAppointment = async (req, res) => {
  const { appointmentId, clinicalNotes } = req.body;
  try {
    const summary = await generatePostVisitSummary(clinicalNotes);
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      clinicalNotes,
      postVisitSummary: summary,
      status: 'completed'
    }, { new: true });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};