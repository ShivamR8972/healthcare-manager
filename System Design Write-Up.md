# System Design Write-up: Healthcare Appointment & Follow-up Manager

## 1. Concurrency Control & Double-Booking Prevention

Race conditions manifest when multiple concurrent patient transactions attempt to reserve the identical appointment slot (same doctor, date, and time) simultaneously. Relying on application-layer validation checks (e.g., executing a read operation followed by a write operation) introduces a critical Time-of-Check to Time-of-Use (TOCTOU) vulnerability. Under high-concurrency settings, multiple threads could read an empty slot status simultaneously, pass the check, and write separate appointment records for the same slot.

To eliminate this class of race condition deterministically without sacrificing horizontal scalability, our architecture delegates strict concurrency boundaries down to the data storage layer. We employ a unique compound structural database index constraint across active reservations:

```javascript
appointmentSchema.index(
  { doctorId: 1, date: 1, slot: 1 }, 
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

```

By adding a `partialFilterExpression`, the uniqueness constraint is enforced strictly on rows where `status` equals `'booked'`. This ensures that if an appointment is subsequently canceled or rescheduled, the corresponding slot safely frees up for other prospective patients.

When concurrent network requests fire overlapping write transactions, MongoDB serialize the index modifications. The transaction that executes first secures the slot. The trailing transaction instantly violates the unique schema constraint, causing the database engine to reject the operation and throw a write violation key code (`11000`). The backend application catches this exception inside a try-catch block and returns a clean, descriptive `409 Conflict` HTTP status code to the client application without causing data corruption or thread degradation.

---

## 2. Doctor Leave Conflict Handling & Cascading Resolution

Managing unexpected calendar disruptions requires an automated workflow to clear out blocked dates while protecting the patient experience. When an administrator updates a doctor's profile to enforce a leave date, the system initiates a structured multi-phase transactional execution pattern:

```text
[Admin Sets Leave Date] 
         │
         ▼
 ┌──────────────────────────────┐
 │ Append Date to Leave Array   │
 └──────────────┬───────────────┘
                │
                ▼
 ┌──────────────────────────────┐
 │ Fetch All 'booked' Appts     │
 └──────────────┬───────────────┘
                │
                ▼
 ┌──────────────────────────────┐
 │ For Each Conflicting Appt:   │
 ├──────────────────────────────┤
 │ 1. Status -> 'cancelled'     │
 │ 2. Queue Email Job           │
 │ 3. Async Delete Cal Event    │
 └──────────────────────────────┘

```

1. **State Isolation:** The target date string (format `YYYY-MM-DD`) is atomically appended to the doctor's `leaveDays` array profile document via MongoDB's `$addToSet` operational tracker, instantly preventing any new client booking vectors from touching that date.


2. **Conflict Evaluation:** The engine queries the appointments collection to isolate all active reservations where `doctorId`, `date`, and `status: 'booked'` match the criteria.


3. **Atomic State Invalidation:** The target appointments undergo a batch state transition shifting their operational status flag from `'booked'` to `'cancelled'`.


4. **Integration Cleanup:** For every cancelled slot, the application reads the `googleCalendarEventId` saved during the booking step and passes it asynchronously to the Google Calendar API engine to purge the event from both the doctor's and the patient's digital calendars. Concurrently, cancellation notices are wrapped inside discrete transactional job rows and dispatched straight to our queue to notify patients via email.



---

## 3. Slot Hold Mechanism

To optimize high-traffic registration workflows, a transient distributed lock strategy can protect slots while users fill out lengthier input requirements, such as the Gemini AI symptom screening questionnaire.

When a patient selects an available appointment slot, the system registers a temporary lock document inside a dedicated caching layer or a TTL-indexed (Time-To-Live) collection in MongoDB before loading the intake forms. This document locks the specific `doctorId`, `date`, and `slot` combination, attributing it to the patient's session token for a strict window (e.g., 5 minutes).

If another patient attempts to interact with that slot, the system checks for an active hold and hides it from view. If the patient completes the symptom intake form within the 5-minute window, the temporary lock upgrades into a permanent index record inside the main appointments collection. If the window closes without a submission, the database engine's TTL worker automatically purges the hold record, returning the slot back to the public pool cleanly.

---

## 4. Notification Reliability & Job Queue Architecture

Relying on external infrastructure platforms like Google Cloud APIs or SMTP transactional email systems exposes the application to external network degradation, rate throttling, and transient timeouts. Performing these intensive network calls synchronously inside the main request-response thread degrades performance and risks dropping critical alerts.

To solve this, our system isolates all third-party integrations using an internal asynchronous **First-In, First-Out (FIFO) transactional job queue** pattern managed via dedicated background cron processes:

* **Decoupled Persistence:** When a transaction triggers an email or reminder, the API controller does not run the network task immediately. Instead, it writes a structured task payload directly into a persistent `JobQueue` collection with a status of `'pending'`. The user request resolves instantly without waiting for external server responses.


* **Worker Orchestration:** A background cron loop wakes up every 60 seconds to scan the queue collection for items marked `'pending'`. It passes the payloads to our integration handlers (e.g., Nodemailer).


* **Resilient Retry Policy:** If a network drop occurs, the engine increments the row's `attempts` counter and appends the system error stack trace directly to the `errorLog` field. The job remains safely in a `'pending'` or `'failed'` state until the next worker pass. If the task reaches its structural threshold (e.g., 3 failed attempts), it moves to a dead-letter state to prevent infinite execution cycles, ensuring maximum system resilience.
