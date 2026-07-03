import { useState, useEffect } from 'react';

export default function PatientPortal({ token }) {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookedAppt, setBookedAppt] = useState(null);

  // Automatically fetch doctors on load
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/doctors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDoctors(data);
        if (data.length > 0) setDoctorId(data[0]._id); // Default to first doctor
      })
      .catch(err => console.error("Error fetching doctors:", err));
  }, [token]);

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId, date, slot, symptoms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBookedAppt(data);
      alert('Appointment successfully saved and Google Calendar synced!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h3>Schedule an Appointment</h3>
        <form onSubmit={handleBooking}>
          <div className="form-group">
            <label>Select Doctor</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
              {doctors.length === 0 && <option value="">No doctors available</option>}
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} (ID: {doc._id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Preferred Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Time Slot (HH:MM)</label>
            <input type="text" value={slot} onChange={(e) => setSlot(e.target.value)} required placeholder="e.g. 10:30" />
          </div>
          <div className="form-group">
            <label>Describe Symptoms</label>
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required rows="4" placeholder="Describe symptoms fully..." />
          </div>
          <button type="submit" className="btn-success">Book Slot & Generate Intake Summary</button>
        </form>
      </div>

      <div className="card">
        <h3>Live Processing Metrics</h3>
        {bookedAppt ? (
          <div>
            <p><strong>Status:</strong> <span style={{color: 'green'}}>Confirmed & Secured</span></p>
            <p><strong>Appointment ID:</strong> <code>{bookedAppt._id}</code></p>
            <hr />
            <h4>Gemini AI Pre-Visit Diagnostic Insights[cite: 1]:</h4>
            <p><strong>Urgency Rating:</strong> <span className={`badge badge-${bookedAppt.preVisitSummary?.urgencyLevel}`}>{bookedAppt.preVisitSummary?.urgencyLevel}</span></p>
            <p><strong>Chief Complaint:</strong> {bookedAppt.preVisitSummary?.chiefComplaint}</p>
            <p><strong>Suggested Screening Questions:</strong></p>
            <ul>
              {bookedAppt.preVisitSummary?.suggestedQuestions?.map((q, idx) => <li key={idx}>{q}</li>)}
            </ul>
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No active reservation confirmation processed during this local UI session state runtime yet.</p>
        )}
      </div>
    </div>
  );
}