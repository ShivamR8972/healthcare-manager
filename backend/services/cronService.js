import cron from 'node-cron';
import JobQueue from '../models/JobQueue.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendMail } from './integrationService.js';

export const initBackgroundJobs = () => {
  // Every minute: Process notification and background retries
  cron.schedule('* * * * *', async () => {
    const jobs = await JobQueue.find({ status: 'pending' });
    for (let job of jobs) {
      try {
        job.attempts += 1;
        if (job.type === 'email') {
          await sendMail(job.payload.to, job.payload.subject, job.payload.html);
        }
        job.status = 'completed';
      } catch (err) {
        job.errorLog = err.message;
        if (job.attempts >= job.maxAttempts) job.status = 'failed';
      }
      await job.save();
    }
  });

  // Every day at 08:00 AM: Send medication reminders
  cron.schedule('0 8 * * *', async () => {
    const activeAppointments = await Appointment.find({ status: 'completed' });
    for (let appt of activeAppointments) {
      if (appt.postVisitSummary && appt.postVisitSummary.medicationSchedule) {
        const patient = await User.findById(appt.patientId);
        await JobQueue.create({
          type: 'email',
          payload: {
            to: patient.email,
            subject: 'Daily Medication Reminder',
            html: `<p>Hi ${patient.name}, here is your daily medication reminder schedule: ${appt.postVisitSummary.medicationSchedule}</p>`
          }
        });
      }
    }
  });
};