import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api';
import { Spinner } from '../../components/ui';

const emptyItem = { jobTitleId: '', itemName: '', unit: '', qty: 1, rate: 0 };

export default function PreJobSheetFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { activeLocation } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactName, setContactName] = useState('');
  const [mobile, setMobile] = useState('');
  const [sheetDate, setSheetDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [items, setItems] = useState([{ ...emptyItem }]);

  useEffect(() => {
    Promise.all([
      api.getCompanies(),
      api.getJobTitles(),
      isEdit ? api.getPreJobSheet(id) : Promise.resolve(null)
    ]).then(([cos, jts, sheet]) => {
      setCompanies(cos);
      setJobTitles(jts);
      if (sheet) {
        setCompanyId(sheet.companyId);
        setContactId(sheet.contactId || '');
        setContactName(sheet.contactName);
        setMobile(sheet.mobile);
        setSheetDate(sheet.sheetDate);
        setPaymentMode(sheet.paymentMode);
        setItems(sheet.items.map((i) => ({ jobTitleId: i.jobTitleId || '', itemName: i.itemName, unit: i.unit, qty: i.qty, rate: i.rate })));
      }
      setLoading(false);
    });
  }, [id]);

  const selectedCompany = companies.find((c) => c.id === Number(companyId));

  const onCompanyChange = (val) => {
    setCompanyId(val);
    setContactId('');
    setContactName('');
    setMobile('');
  };

  const onContactChange = (val) => {
    setContactId(val);
    const contact = selectedCompany?.contacts.find((c) => c.id === Number(val));
    if (contact) {
      setContactName(contact.name);
      setMobile(contact.mobile);
    }
  };

  const onJobTitleChange = (idx, jtId) => {
    const jt = jobTitles.find((j) => j.id === Number(jtId));
    const next = [...items];
    next[idx] = {
      ...next[idx],
      jobTitleId: jtId,
      itemName: jt?.name || next[idx].itemName,
      unit: jt?.unit || next[idx].unit,
      rate: jt?.rate ?? next[idx].rate
    };
    setItems(next);
  };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subTotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const gst = paymentMode === 'Cash' ? 0 : Math.round(subTotal * 0.18 * 100) / 100;
  const total = subTotal + gst;

  const save = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyId) return setError('Select a company');
    if (!contactName.trim()) return setError('Reference person / contact name is required');
    if (items.length === 0 || items.some((i) => !i.itemName.trim() || Number(i.qty) <= 0))
      return setError('Add at least one valid line item');

    setSaving(true);
    const payload = {
      locationId: activeLocation.id,
      companyId: Number(companyId),
      contactId: contactId ? Number(contactId) : null,
      contactName,
      mobile,
      sheetDate,
      paymentMode,
      items: items.map((i) => ({
        jobTitleId: i.jobTitleId ? Number(i.jobTitleId) : null,
        itemName: i.itemName,
        unit: i.unit,
        qty: Number(i.qty),
        rate: Number(i.rate)
      }))
    };

    try {
      if (isEdit) await api.updatePreJobSheet(id, payload);
      else await api.createPreJobSheet(payload);
      navigate('/transaction/pre-job-sheets');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit' : 'New'} Pre Job Sheet</h1>
      </div>

      <form onSubmit={save} className="card">
        <div className="form-row">
          <div className="field">
            <label>Company</label>
            <select className="form-input" value={companyId} onChange={(e) => onCompanyChange(e.target.value)} required>
              <option value="">Select company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input className="form-input" type="date" value={sheetDate} onChange={(e) => setSheetDate(e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Reference Person</label>
            {selectedCompany?.contacts.length ? (
              <select className="form-input" value={contactId} onChange={(e) => onContactChange(e.target.value)}>
                <option value="">Select / type below…</option>
                {selectedCompany.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : null}
            <input className="form-input" style={{ marginTop: 6 }} placeholder="Contact name"
              value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Mobile</label>
            <input className="form-input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Payment Mode</label>
          <select className="form-input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="GPay">GPay</option>
            <option value="Invoice">Invoice</option>
          </select>
        </div>

        <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
          Line Items
        </label>
        <div className="line-items">
          <div className="line-item-row header">
            <div>Item</div><div>Unit</div><div>Qty</div><div>Rate</div><div>Amount</div><div></div>
          </div>
          {items.map((item, idx) => (
            <div className="line-item-row" key={idx}>
              <div>
                <select className="form-input" value={item.jobTitleId} onChange={(e) => onJobTitleChange(idx, e.target.value)} style={{ marginBottom: 4 }}>
                  <option value="">Custom item…</option>
                  {jobTitles.map((jt) => <option key={jt.id} value={jt.id}>{jt.name}</option>)}
                </select>
                <input className="form-input" placeholder="Item name" value={item.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} required />
              </div>
              <input className="form-input" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} placeholder="Unit" />
              <input className="form-input" type="number" step="0.01" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
              <input className="form-input" type="number" step="0.01" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} />
              <div className="mono">₹{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}</div>
              <button type="button" className="btn btn-cancel btn-small" onClick={() => removeItem(idx)}>✕</button>
            </div>
          ))}
          <div className="totals-box">
            <div className="line"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="line"><span>GST {paymentMode === 'Cash' ? '(N/A - Cash)' : '@18%'}</span><span>₹{gst.toFixed(2)}</span></div>
            <div className="grand">Total: ₹{total.toFixed(2)}</div>
          </div>
        </div>
        <button type="button" className="btn btn-cancel btn-small" onClick={addItem} style={{ marginBottom: 16 }}>+ Add Line Item</button>

        {error && <div className="error-text">{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
          <button className="btn btn-cancel" type="button" onClick={() => navigate('/transaction/pre-job-sheets')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
