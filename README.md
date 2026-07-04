# 🏥 Healthcare Appointment & Follow-up Manager

A comprehensive healthcare management platform with dedicated role-based dashboards for **Patients**, **Doctors**, and **Administrators**. The application enables secure appointment booking with **double-booking prevention**, **Google Calendar synchronization**, **email notifications**, and **AI-powered clinical assistance** using **Google Gemini**.

---

# ✨ Features

### 👤 Patient
- Register and login securely
- Browse available doctors
- Book appointments
- View AI-generated pre-visit summaries
- Receive email notifications
- Google Calendar appointment synchronization

### 👨‍⚕️ Doctor
- View assigned appointments
- Complete appointments
- Generate patient-friendly visit summaries using Gemini AI
- Create medication schedules
- Generate follow-up instructions
- Connect Google Calendar using OAuth2

### 🛠️ Administrator
- Manage doctor profiles
- Configure doctor schedules
- Set working hours
- Manage leave dates
- Automatically cancel conflicting appointments
- Notify affected patients

---

# 🚀 Tech Stack

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| node-cron | Background Jobs |
| Nodemailer | Email Service |
| Google Calendar API | Calendar Integration |
| Google OAuth2 | Authentication |
| Gemini 1.5 Flash | AI Processing |

---

## Frontend

| Technology | Purpose |
|------------|---------|
| React.js | UI Framework |
| Vite | Build Tool |
| Vanilla CSS | Styling |
| Vercel | Deployment |

---

# 📁 Project Structure

```
Healthcare-Appointment-Manager/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── cron/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Installation

## Prerequisites

- Node.js v18+
- MongoDB
- Google Cloud Account
- Gemini API Key

---

## 1. Clone the Repository

```bash
git clone <repository-url>

cd Healthcare-Appointment-Manager
```

---

## 2. Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the **backend** directory.

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/healthcare_db

JWT_SECRET=your_super_secret_jwt_key

GEMINI_API_KEY=your_google_gemini_api_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-clinic-email@gmail.com
EMAIL_PASS=your-gmail-app-password

GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

Run the backend server.

```bash
npm run dev
```

---

## 3. Frontend Setup

Open another terminal.

```bash
cd frontend

npm install
```

Create a `.env` file.

```env
VITE_API_URL=http://localhost:5000
```

Run the frontend.

```bash
npm run dev
```

---

# 🔑 Google Calendar Setup

1. Open **Google Cloud Console**
2. Create a new project
3. Enable **Google Calendar API**
4. Configure the **OAuth Consent Screen**
5. Add yourself as a **Test User**
6. Create OAuth Credentials
7. Select **Web Application**
8. Add the redirect URI

```
http://localhost:5000/api/auth/google/callback
```

9. Copy the generated Client ID and Client Secret into the backend `.env`.

---

# 🗄️ Database Collections

## User

Stores authentication and account information.

| Field | Description |
|-------|-------------|
| name | User name |
| email | Unique email |
| password | Hashed password |
| role | patient / doctor / admin |
| googleTokens | OAuth tokens |

---

## DoctorProfile

Stores doctor-specific scheduling information.

| Field | Description |
|-------|-------------|
| doctorId | Reference to User |
| specialization | Doctor specialty |
| workingHours | Start & End times |
| slotDuration | Appointment duration |
| leaveDays | Leave dates |

---

## Appointment

Stores appointment information.

| Field | Description |
|-------|-------------|
| patientId | Patient reference |
| doctorId | Doctor reference |
| date | Appointment date |
| slot | Appointment time |
| status | booked / cancelled / completed |
| symptoms | Patient symptoms |
| preVisitSummary | AI-generated summary |
| postVisitSummary | AI-generated visit summary |
| googleCalendarEventId | Calendar event ID |

### Double Booking Prevention

Appointments are protected using a compound unique MongoDB index.

```javascript
appointmentSchema.index(
    {
        doctorId: 1,
        date: 1,
        slot: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: "booked"
        }
    }
);
```

---

## JobQueue

Stores retryable background tasks.

| Field | Description |
|-------|-------------|
| type | email / reminder |
| payload | Task data |
| status | pending / completed / failed |
| attempts | Retry count |
| maxAttempts | Maximum retries |

---

# 📡 REST API

## Authentication

### Register

```
POST /api/auth/register
```

Creates a new user.

---

### Login

```
POST /api/auth/login
```

Returns a JWT token.

---

### Google OAuth

```
GET /api/auth/google
```

Initiates Google authentication.

---

### OAuth Callback

```
GET /api/auth/google/callback
```

Stores Google access tokens.

---

## Appointment APIs

### Book Appointment

```
POST /api/appointments/book
```

- Prevents double booking
- Checks leave dates
- Generates AI pre-visit summary
- Sends email
- Syncs Google Calendar

---

### Complete Appointment

```
POST /api/appointments/complete
```

- Generates patient-friendly visit summary
- Creates medication schedule
- Generates follow-up instructions
- Schedules reminders

---

### Doctor Appointments

```
GET /api/doctor/appointments
```

Returns appointments assigned to the doctor.

---

### Get Doctors

```
GET /api/doctors
```

Returns all available doctors.

---

### Calendar Status

```
GET /api/doctor/status
```

Checks whether Google Calendar is connected.

---

## Admin APIs

### Update Doctor Profile

```
POST /api/admin/doctor-profile
```

Updates:

- Working hours
- Slot duration
- Specialization

---

### Set Doctor Leave

```
POST /api/admin/doctor-leave
```

Automatically:

- Cancels appointments
- Removes Google Calendar events
- Sends notifications

---

# 🤖 Gemini AI Integration

The project uses **Gemini 1.5 Flash** for clinical text processing.

---

## Pre-Visit Prompt

```text
Analyse these symptoms and return valid JSON data using exactly this structure:

{
  "urgencyLevel": "Low" or "Medium" or "High",
  "chiefComplaint": "Short description",
  "suggestedQuestions": ["Q1", "Q2", "Q3"]
}

Symptoms:
<symptoms>
```

Produces:

- Urgency Level
- Chief Complaint
- Suggested Questions

---

## Post-Visit Prompt

```text
Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps.

Return valid JSON only:

{
  "summaryText": "text summary",
  "medicationSchedule": "medication timing details",
  "followUpSteps": "steps to take"
}

Notes:
<notes>
```

Produces:

- Visit Summary
- Medication Schedule
- Follow-up Instructions

---

# ⚠️ Error Handling

The application gracefully handles:

- Gemini API failures
- Invalid AI responses
- Network interruptions
- Google API failures

If AI processing fails, the original clinical notes are preserved and default values are stored so the application continues functioning without interruption.

---

# 🌐 Vercel Configuration

`vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-service.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration enables:

- API proxying
- React SPA routing
- Refresh support
- Elimination of `<!DOCTYPE html>` parsing errors

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Google OAuth2
- Role-Based Access Control
- MongoDB Unique Indexes
- Secure Environment Variables

---

# 📬 Background Services

Using **node-cron**, the application automatically:

- Sends appointment confirmation emails
- Sends medication reminders
- Retries failed jobs
- Processes queued notifications

---

# 🚀 Future Improvements

- Video Consultation
- Online Payments
- Electronic Health Records (EHR)
- SMS Notifications
- Prescription PDF Generation
- Multi-language Support
- Doctor Availability Prediction
- Analytics Dashboard

---

# 📄 License

This project is intended for educational and learning purposes.