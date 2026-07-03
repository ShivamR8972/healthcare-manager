import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendMail = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

const getOAuth2Client = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

export const createCalendarEvent = async (doctor, patient, appointment) => {
  if (!doctor.googleTokens) return null;
  const oauth2Client = getOAuth2Client(doctor.googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const startDateTime = new Date(`${appointment.date}T${appointment.slot}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

  const event = {
    summary: `Appointment: ${patient.name}`,
    description: `Pre-visit summary urgency: ${appointment.preVisitSummary.urgencyLevel}`,
    start: { dateTime: startDateTime.toISOString(), timeZone: 'UTC' },
    end: { dateTime: endDateTime.toISOString(), timeZone: 'UTC' },
    attendees: [{ email: patient.email }, { email: doctor.email }],
  };

  const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
  return res.data.id;
};

export const deleteCalendarEvent = async (doctor, eventId) => {
  if (!doctor.googleTokens || !eventId) return;
  const oauth2Client = getOAuth2Client(doctor.googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  await calendar.events.delete({ calendarId: 'primary', eventId });
};