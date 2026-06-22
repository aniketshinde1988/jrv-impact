import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(userCode, password);
      navigate('/select-location');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your User ID and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="auth-card">
        <h1>JRV <span>IMPACT</span></h1>
        <div className="tagline">FIELD SERVICE PLATFORM</div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>User ID</label>
            <input className="form-input" value={userCode} onChange={(e) => setUserCode(e.target.value)} autoFocus required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
