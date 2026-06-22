import { useEffect, useState } from 'react';
import * as api from '../../api';
import Modal from '../../components/Modal';
import { Spinner, EmptyState, Toast } from '../../components/ui';

const emptyForm = { shortCode: '', name: '', contacts: [{ name: '', mobile: '' }] };

export default function CompaniesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = (q) => {
    setLoading(true);
    api.getCompanies(q).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const openNew = () => { setForm(emptyForm); setError(''); setEditing({}); };
  const openEdit = (item) => {
    setForm({
      shortCode: item.shortCode,
      name: item.name,
      contacts: item.contacts.length ? item.contacts.map((c) => ({ name: c.name, mobile: c.mobile })) : [{ name: '', mobile: '' }]
    });
    setError('');
    setEditing(item);
  };
  const close = () => setEditing(null);

  const updateContact = (idx, field, value) => {
    const next = [...form.contacts];
    next[idx] = { ...next[idx], [field]: value };
    setForm({ ...form, contacts: next });
  };
  const addContact = () => setForm({ ...form, contacts: [...form.contacts, { name: '', mobile: '' }] });
  const removeContact = (idx) => setForm({ ...form, contacts: form.contacts.filter((_, i) => i !== idx) });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { ...form, contacts: form.contacts.filter((c) => c.name.trim()) };
    try {
      if (editing?.id) {
        await api.updateCompany(editing.id, payload);
        showToast('Company updated');
      } else {
        await api.createCompany(payload);
        showToast('Company created');
      }
      close();
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete company "${item.name}"?`)) return;
    try {
      await api.deleteCompany(item.id);
      showToast('Company deleted');
      load(search);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Companies</h1>
        <button className="btn btn-accent" onClick={openNew}>+ New Company</button>
      </div>

      <div className="search-bar">
        <input className="form-input" placeholder="Search by name or code…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState>No companies yet. Create your first one.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Reference Persons</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="code-chip">{item.code}</span></td>
                  <td>{item.name}</td>
                  <td>{item.contacts.map((c) => c.name).join(', ') || '—'}</td>
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
        <Modal title={editing?.id ? 'Edit Company' : 'New Company'} onClose={close} width={560}>
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field">
                <label>Short Code (e.g. HT)</label>
                <input className="form-input" value={form.shortCode} maxLength={10}
                  onChange={(e) => setForm({ ...form, shortCode: e.target.value.toUpperCase() })} required />
              </div>
              <div className="field">
                <label>Name</label>
                <input className="form-input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>

            <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Reference Persons
            </label>
            {form.contacts.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="form-input" placeholder="Name" value={c.name} onChange={(e) => updateContact(idx, 'name', e.target.value)} />
                <input className="form-input" placeholder="Mobile" value={c.mobile} onChange={(e) => updateContact(idx, 'mobile', e.target.value)} />
                <button type="button" className="btn btn-cancel btn-small" onClick={() => removeContact(idx)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-cancel btn-small" onClick={addContact}>+ Add Reference Person</button>

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
