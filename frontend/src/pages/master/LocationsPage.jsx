import { useEffect, useState } from 'react';
import * as api from '../../api';
import Modal from '../../components/Modal';
import { Spinner, EmptyState, Toast } from '../../components/ui';

const emptyForm = { shortCode: '', name: '' };

export default function LocationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = (q) => {
    setLoading(true);
    api.getLocations(q).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openNew = () => { setForm(emptyForm); setError(''); setEditing({}); };
  const openEdit = (item) => { setForm({ shortCode: item.shortCode, name: item.name }); setError(''); setEditing(item); };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing?.id) {
        await api.updateLocation(editing.id, form);
        showToast('Location updated');
      } else {
        await api.createLocation(form);
        showToast('Location created');
      }
      close();
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete location "${item.name}"?`)) return;
    try {
      await api.deleteLocation(item.id);
      showToast('Location deleted');
      load(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Locations</h1>
        <button className="btn btn-accent" onClick={openNew}>+ New Location</button>
      </div>

      <div className="search-bar">
        <input
          className="form-input"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No locations yet. Create your first one.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Short Code</th><th>Name</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="code-chip">{item.code}</span></td>
                  <td className="mono">{item.shortCode}</td>
                  <td>{item.name}</td>
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
        <Modal title={editing?.id ? 'Edit Location' : 'New Location'} onClose={close}>
          <form onSubmit={save}>
            <div className="field">
              <label>Short Code (used in transaction codes, e.g. MB)</label>
              <input className="form-input" value={form.shortCode} maxLength={10}
                onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })} required />
            </div>
            <div className="field">
              <label>Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
