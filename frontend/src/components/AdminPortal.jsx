import { useState } from 'react';

export default function AdminPortal({ token }) {
  const [doctorId, setDoctorId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  
  const [leaveDocId, setLeaveDocId] = useState('');
  const [leaveDate, setLeaveDate] = useState('');

  const handleProfileUpsert = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/doctor-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId, specialization, workingHours: { start, end } })
      });
      if (res.ok) alert('Doctor profile updated successfully.');
    } catch (err) { alert(err.message); }
  };

  const handleLeaveSetup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/doctor-leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId: leaveDocId, date: leaveDate })
      });
      const data = await res.json();
      if (res.ok) alert(`Leave configured. Cleaned up and alerted ${data.absoluteCleanups} conflicting patients.`);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="grid">
      <div className="card">
        <h3>Doctor Profile Configurations</h3>
        <form onSubmit={handleProfileUpsert}>
          <div className="form-group">
            <label>Doctor Account ID Reference</label>
            <input type="text" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Medical Specialization Field</label>
            <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required placeholder="e.g. Cardiology" />
          </div>
          <div className="form-group">
            <label>Duty Active Start (HH:MM)</label>
            <input type="text" value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Duty Active End (HH:MM)</label>
            <input type="text" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Upsert Doctor Profile</button>
        </form>
      </div>

      <div className="card">
        <h3>Configure Interruption Leaves</h3>
        <form onSubmit={handleLeaveSetup}>
          <div className="form-group">
            <label>Doctor Account ID</label>
            <input type="text" value={leaveDocId} onChange={(e) => setLeaveDocId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Interruption Date Target</label>
            <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn-danger">Enforce Leave Schedule Override</button>
        </form>
      </div>
    </div>
  );
}