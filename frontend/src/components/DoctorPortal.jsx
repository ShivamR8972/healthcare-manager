import { useState, useEffect } from 'react';

export default function DoctorPortal({ token, userId }) {
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [completedAppt, setCompletedAppt] = useState(null);
  const [isCalendarLinked, setIsCalendarLinked] = useState(false);

  // Unified effect to pull active queue and check calendar link status
  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        // 1. Fetch appointments queue
        const apptRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const apptData = await apptRes.json();
        if (apptRes.ok) setAppointments(apptData);

        // 2. Fetch Google Calendar status
        const statusRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statusData = await statusRes.json();
        if (statusRes.ok) setIsCalendarLinked(statusData.isLinked);

      } catch (err) {
        console.error("Error synchronizing dashboard data:", err);
      }
    };

    if (token) {
      loadDoctorData();
    }
  }, [token]);

  const triggerGoogleOAuth = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google?doctorId=${userId}`);
      const data = await res.json();
      if (data.url) {
        // Open the consent screen
        const oauthWindow = window.open(data.url, '_blank');
        
        // Poll every 3 seconds to auto-refresh the button status once they finish signing in
        const timer = setInterval(async () => {
          if (oauthWindow.closed) {
            clearInterval(timer);
            const statusRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const statusData = await statusRes.json();
            if (statusRes.ok) setIsCalendarLinked(statusData.isLinked);
          }
        }, 3000);
      }
    } catch{
      alert('Could not generate OAuth url link.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId, clinicalNotes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCompletedAppt(data);
      alert('Checkout finalized and patient metrics translated by Gemini!');
      setAppointmentId('');
      setClinicalNotes('');
      
      // Refresh active queue list
      const apptRes = await fetch(`${import.meta.env.VITE_API_URL}/api/doctor/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const apptData = await apptRes.json();
      if (apptRes.ok) setAppointments(apptData);

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h3>Google Calendar Integration</h3>
        {isCalendarLinked ? (
          <div style={{
            padding: '10px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '6px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            ✓ Google Calendar Workspace Connected Successfully
          </div>
        ) : (
          <button type="button" onClick={triggerGoogleOAuth} className="btn-primary" style={{ marginBottom: '2rem' }}>
            Link Google Calendar Workspace
          </button>
        )}

        <h3>Active Patient Queue</h3>
        {appointments.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No pending scheduled visits found.</p>
        ) : (
          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '2rem' }}>
            {appointments.map((appt) => (
              <div 
                key={appt._id} 
                onClick={() => setAppointmentId(appt._id)}
                style={{
                  padding: '10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: appointmentId === appt._id ? '#e0f2fe' : 'var(--bg)'
                }}
              >
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Patient: {appt.patientId?.name || 'Unknown'}</p>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>
                  Slot: <strong>{appt.date}</strong> at <strong>{appt.slot}</strong>
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>Symptoms: "{appt.symptoms}"</p>
              </div>
            ))}
          </div>
        )}

        <h3>Finalize Patient Session Checkout</h3>
        <form onSubmit={handleCheckout}>
          <div className="form-group">
            <label>Selected Appointment Document ID</label>
            <input 
              type="text" 
              value={appointmentId} 
              onChange={(e) => setAppointmentId(e.target.value)} 
              required 
              placeholder="Click a patient card above or paste ID manually" 
            />
          </div>
          <div className="form-group">
            <label>Clinical Treatment Logs & Prescriptions</label>
            <textarea 
              value={clinicalNotes} 
              onChange={(e) => setClinicalNotes(e.target.value)} 
              required 
              rows="4" 
              placeholder="Write formal session documentation & dosing steps here..." 
            />
          </div>
          <button type="submit" className="btn-primary">Generate Summary via Gemini</button>
        </form>
      </div>

      <div className="card">
        <h3>Gemini Patient-Friendly Output Translation[cite: 1]</h3>
        {completedAppt ? (
          <div>
            <p><strong>Status:</strong> <span style={{ color: 'blue', fontWeight: 'bold' }}>Completed</span></p>
            <hr />
            <p><strong>Summary Text:</strong> {completedAppt.postVisitSummary?.summaryText}</p>
            <p><strong>Medication Schedule:</strong> {completedAppt.postVisitSummary?.medicationSchedule}</p>
            <p><strong>Follow-up Action Steps:</strong> {completedAppt.postVisitSummary?.followUpSteps}</p>
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>Select an active record and submit checkout notes to view AI translation variables.</p>
        )}
      </div>
    </div>
  );
}