import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { Spinner } from '../components/ui';

export default function LocationSelectPage() {
  const { chooseLocation, signOut } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLocations().then((data) => {
      setLocations(data);
      setLoading(false);
    });
  }, []);

  const pick = (loc) => {
    chooseLocation(loc);
    navigate('/dashboard');
  };

  return (
    <div className="center-screen">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: '1.8rem' }}>Select Working <span>Location</span></h1>
        <div className="tagline">Transactions you create will be tagged to this location</div>

        {loading ? (
          <Spinner />
        ) : locations.length === 0 ? (
          <div className="empty-state">
            No locations set up yet.
            <br />
            <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={() => navigate('/master/locations')}>
              Set one up first
            </button>
          </div>
        ) : (
          <div className="location-grid">
            {locations.map((loc) => (
              <button key={loc.id} className="location-tile" onClick={() => pick(loc)}>
                <div className="loc-badge">{loc.shortCode}</div>
                <div className="loc-name">{loc.name}</div>
              </button>
            ))}
          </div>
        )}

        <button className="icon-btn" style={{ color: 'var(--ink)', borderColor: 'var(--border)', marginTop: 20 }} onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
