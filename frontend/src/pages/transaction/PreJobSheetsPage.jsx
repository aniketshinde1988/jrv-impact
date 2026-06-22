import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api';
import { Spinner, EmptyState, Toast } from '../../components/ui';

export default function PreJobSheetsPage() {
  const { activeLocation } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const load = (q) => {
    setLoading(true);
    api.getPreJobSheets(activeLocation?.id, q).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [activeLocation]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const generate = async (item) => {
    if (!window.confirm(`Generate Job Sheet from ${item.code}?`)) return;
    try {
      const result = await api.generateJobSheet(item.id);
      showToast('Job Sheet generated');
      navigate(`/transaction/job-sheets/${result.id}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not generate');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete Pre Job Sheet ${item.code}?`)) return;
    try {
      await api.deletePreJobSheet(item.id);
      showToast('Deleted');
      load(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Pre Job Sheet</h1>
        <button className="btn btn-accent" onClick={() => navigate('/transaction/pre-job-sheets/new')}>+ New Pre Job Sheet</button>
      </div>

      <div className="search-bar">
        <input className="form-input" placeholder="Search by code, company or contact…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No Pre Job Sheets for this location yet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Date</th><th>Company</th><th>Contact</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="code-chip">{item.code}</span></td>
                  <td className="mono">{item.sheetDate}</td>
                  <td>{item.companyName}</td>
                  <td>{item.contactName}</td>
                  <td>₹{item.totalAmount}</td>
                  <td>
                    <span className={`badge ${item.status === 'Generated' ? 'badge-generated' : 'badge-pending'}`}>{item.status}</span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {item.status === 'Pending' ? (
                      <>
                        <button className="btn btn-cancel btn-small" onClick={() => navigate(`/transaction/pre-job-sheets/${item.id}`)}>Edit</button>{' '}
                        <button className="btn btn-blue btn-small" onClick={() => generate(item)}>Generate</button>{' '}
                        <button className="btn btn-danger btn-small" onClick={() => remove(item)}>Delete</button>
                      </>
                    ) : (
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Generated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
