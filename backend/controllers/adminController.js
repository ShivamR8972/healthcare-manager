import DoctorProfile from '../models/DoctorProfile.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import JobQueue from '../models/JobQueue.js';
import { deleteCalendarEvent } from '../services/integrationService.js';

export const upsertDoctorProfile = async (req, res) => {
  const { doctorId, specialization, workingHours, slotDuration } = req.body;
  try {
    const profile = await DoctorProfile.findOneAndUpdate(
      { doctorId },
      { specialization, workingHours, slotDuration },
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setDoctorLeave = async (req, res) => {
  const { doctorId, date } = req.body; // date format: YYYY-MM-DD
  try {
    await DoctorProfile.findOneAndUpdate({ doctorId }, { $addToSet: { leaveDays: date } });
    
    // Query conflicting matches
    const conflicts = await Appointment.find({ doctorId, date, status: 'booked' });
    const doctor = await User.findById(doctorId);

    for (let appt of conflicts) {
      appt.status = 'cancelled';
      await appt.save();

      const patient = await User.findById(appt.patientId);

      // Trigger automatic background cancellation emails
      await JobQueue.create({
        type: 'email',
        payload: {
          to: patient.email,
          subject: 'Appointment Cancelled - Doctor Schedule Interruption',
          html: `<p>Dear ${patient.name}, your appointment on ${date} at ${appt.slot} has been cancelled due to sudden schedule modifications.</p>`
        }
      });

      // Clear event from Google Calendar asynchronously
      try {
        await deleteCalendarEvent(doctor, appt.googleCalendarEventId);
      } catch(err) { console.error("Calendar cleanup bypassed.", err); }
    }

    res.json({ message: "Leave saved. Impacted patients updated safely.", absoluteCleanups: conflicts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};