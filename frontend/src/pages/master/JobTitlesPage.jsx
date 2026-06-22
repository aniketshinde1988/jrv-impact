import { useEffect, useState } from 'react';
import * as api from '../../api';
import Modal from '../../components/Modal';
import { Spinner, EmptyState, Toast } from '../../components/ui';

const emptyForm = { shortCode: '', name: '', unit: '', rate: '', typeTag: 'SRV' };

export default function JobTitlesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = (q) => {
    setLoading(true);
    api.getJobTitles(q).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const openNew = () => { setForm(emptyForm); setError(''); setEditing({}); };
  const openEdit = (item) => {
    setForm({ shortCode: item.shortCode, name: item.name, unit: item.unit, rate: item.rate, typeTag: item.typeTag });
    setError('');
    setEditing(item);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, rate: Number(form.rate) || 0 };
    try {
      if (editing?.id) {
        await api.updateJobTitle(editing.id, payload);
        showToast('Job Title updated');
      } else {
        await api.createJobTitle(payload);
        showToast('Job Title created');
      }
      close();
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete job title "${item.name}"?`)) return;
    try {
      await api.deleteJobTitle(item.id);
      showToast('Job Title deleted');
      load(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Job Titles</h1>
        <button className="btn btn-accent" onClick={openNew}>+ New Job Title</button>
      </div>

      <div className="search-bar">
        <input className="form-input" placeholder="Search by name or code…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No job titles yet. Create your first one.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Unit</th><th>Rate</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="code-chip">{item.code}</span></td>
                  <td>{item.name}</td>
                  <td>{item.unit}</td>
                  <td>₹{item.rate}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-cancel btn-small" onClick={() => openEdit(item)}>Edit</button>{' '}
                    <button className="btn btn-danger btn-small" onClick={() => remove(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <Modal title={editing?.id ? 'Edit Job Title' : 'New Job Title'} onClose={close}>
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Short Code (e.g. FSI)</label>
                <input className="form-input" value={form.shortCode} maxLength={10}
                  onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })} required />
              </div>
              <div className="field">
                <label>Type Tag (e.g. PRD / SRV)</label>
                <input className="form-input" value={form.typeTag} maxLength={10}
                  onChange={(e) => setForm({ ...form, typeTag: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="field">
              <label>Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Unit (e.g. Nos / Hrs)</label>
                <input className="form-input" value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
              </div>
              <div className="field">
                <label>Rate</label>
                <input className="form-input" type="number" step="0.01" value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
              </div>
            </div>
            {error && <div className="error-text">{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" type="submit">Save</button>
              <button className="btn btn-cancel" type="button" onClick={close}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      <Toast message={toast} />
    </div>
  );
}
