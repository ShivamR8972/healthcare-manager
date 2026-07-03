import { useState } from 'react';
import AuthPanel from './components/AuthPanel';
import PatientPortal from './components/PatientPortal';
import DoctorPortal from './components/DoctorPortal';
import AdminPortal from './components/AdminPortal';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleAuthSuccess = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.clear();
  };

  if (!token || !user) {
    return <AuthPanel onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="container">
      <header className="dashboard-header">
        <div>
          <h1>Clinic Control Matrix</h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            Welcome back, <strong>{user.name}</strong> ({user.role.toUpperCase()}) | ID: <code>{user.id}</code>
          </p>
        </div>
        <button onClick={handleLogout} className="btn-logout">Sign Out Session</button>
      </header>

      <main>
        {user.role === 'patient' && <PatientPortal token={token} />}
        {user.role === 'doctor' && <DoctorPortal token={token} userId={user.id} />}
        {user.role === 'admin' && <AdminPortal token={token} />}
      </main>
    </div>
  );
}