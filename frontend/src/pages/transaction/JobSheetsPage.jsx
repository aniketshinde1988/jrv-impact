import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api';
import { Spinner, EmptyState, Toast } from '../../components/ui';

export default function JobSheetsPage() {
  const { activeLocation } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const load = (q) => {
    setLoading(true);
    api.getJobSheets(activeLocation?.id, q).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [activeLocation]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const remove = async (item) => {
    if (!window.confirm(`Delete Job Sheet ${item.code}?`)) return;
    try {
      await api.deleteJobSheet(item.id);
      showToast('Deleted');
      load(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Job Sheet</h1>
      </div>

      <div className="search-bar">
        <input className="form-input" placeholder="Search by code, company or receiver…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No Job Sheets yet. Generate one from a Pre Job Sheet.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Date</th><th>Company</th><th>Receiver</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="code-chip">{item.code}</span></td>
                  <td className="mono">{item.sheetDate}</td>
                  <td>{item.companyName}</td>
                  <td>{item.receiverName || '—'}</td>
                  <td>₹{item.totalAmount}</td>
                  <td><span className={`badge ${item.isEdited ? 'badge-edited' : 'badge-clean'}`}>{item.isEdited ? 'Edited ⚠' : 'Clean'}</span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-cancel btn-small" onClick={() => navigate(`/transaction/job-sheets/${item.id}`)}>Open</button>{' '}
                    <button className="btn btn-danger btn-small" onClick={() => remove(item)}>Delete</button>
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
