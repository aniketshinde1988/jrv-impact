import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { Spinner } from '../components/ui';

export default function DashboardPage() {
  const { activeLocation } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!activeLocation) return;
    api.getDashboardStats(activeLocation.id).then(setStats);
  }, [activeLocation]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">{activeLocation?.name}</div>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/transaction/pre-job-sheets/new')}>
          + New Pre Job Sheet
        </button>
      </div>

      {!stats ? (
        <Spinner />
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>PENDING PRE JOB SHEETS · {activeLocation?.shortCode}</div>
            <div className="display" style={{ fontSize: '3rem', color: 'var(--accent)' }}>{stats.pendingPreJobSheets}</div>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">Total Companies</div>
              <div className="value">{stats.totalCompanies}</div>
            </div>
            <div className="stat-card">
              <div className="label">Job Sheets Done</div>
              <div className="value">{stats.jobSheetsDone}</div>
            </div>
            <div className="stat-card">
              <div className="label">Job Titles</div>
              <div className="value">{stats.totalJobTitles}</div>
            </div>
            <div className="stat-card">
              <div className="label">Pending GST</div>
              <div className="value">₹{stats.pendingGstAmount}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
