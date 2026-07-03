import { useState } from 'react';

export default function AuthPanel({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    const payload = isRegistering ? { name, email, password, role } : { email, password };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication action processing error');

      if (isRegistering) {
        alert('Registration complete! Please log in.');
        setIsRegistering(false);
      } else {
        onAuthSuccess(data.token, data.user);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-card">
      <h2>{isRegistering ? 'Create Healthcare Account' : 'Portal Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {isRegistering && (
          <div className="form-group">
            <label>Portal Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="patient">Patient Portal</option>
              <option value="doctor">Doctor Portal</option>
              <option value="admin">Administrator Portal</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn-primary">
          {isRegistering ? 'Register Account' : 'Sign In'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        {isRegistering ? 'Already have an account?' : 'Need an account?'}
        <span 
          style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? 'Sign In' : 'Register Here'}
        </span>
      </p>
    </div>
  );
}