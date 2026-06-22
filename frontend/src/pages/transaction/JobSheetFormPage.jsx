import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../api';
import { resolveAsset } from '../../api/client';
import { Spinner, Toast } from '../../components/ui';
import ShareCard from '../../components/ShareCard';
import { shareJobSheetToWhatsApp } from '../../utils/shareImage';

export default function JobSheetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [contactName, setContactName] = useState('');
  const [mobile, setMobile] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [items, setItems] = useState([]);

  const load = () => {
    setLoading(true);
    api.getJobSheet(id).then((data) => {
      setSheet(data);
      setContactName(data.contactName);
      setMobile(data.mobile);
      setPaymentMode(data.paymentMode);
      setReceiverName(data.receiverName || '');
      setItems(data.items);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const uploadPhoto = async (item, file) => {
    try {
      const res = await api.uploadJobSheetPhoto(id, item.id, file);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, photoUrl: res.photoUrl } : i)));
      showToast('Photo uploaded');
    } catch {
      showToast('Photo upload failed');
    }
  };

  const subTotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const gst = paymentMode === 'Cash' ? 0 : Math.round(subTotal * 0.18 * 100) / 100;
  const total = subTotal + gst;

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!receiverName.trim()) return setError('Receiver Name is mandatory before submitting');
    if (items.some((i) => !i.photoUrl)) return setError('Upload a photo for every line item before submitting');

    setSaving(true);
    try {
      const updated = await api.updateJobSheet(id, {
        contactName,
        mobile,
        paymentMode,
        receiverName,
        items: items.map((i) => ({ id: i.id, qty: Number(i.qty), rate: Number(i.rate) }))
      });
      setSheet(updated);
      setItems(updated.items);
      showToast('Saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await shareJobSheetToWhatsApp(cardRef.current, { code: sheet.code, mobile });
      if (result.method === 'manual') showToast('Image downloaded - attach it in WhatsApp');
      else if (result.method === 'share') showToast('Opened share sheet');
    } catch {
      showToast('Could not generate share image');
    } finally {
      setSharing(false);
    }
  };

  if (loading || !sheet) return <Spinner />;

  const fieldClass = (field) => (sheet.editedFields?.includes(field) ? 'edited-field' : undefined);
  const shareData = { ...sheet, contactName, mobile, paymentMode, receiverName, items, subTotal: subTotal.toFixed(2), gstAmount: gst.toFixed(2), totalAmount: total.toFixed(2) };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Job Sheet</h1>
          <div className="sub">{sheet.code}</div>
        </div>
        <button className="btn btn-blue" onClick={handleShare} disabled={sharing}>
          {sharing ? 'Preparing…' : '📤 Share on WhatsApp'}
        </button>
      </div>

      <form onSubmit={save} className="card">
        <div className="form-row">
          <div className="field">
            <label>Company</label>
            <input className="form-input" value={sheet.companyName} disabled />
          </div>
          <div className="field">
            <label>Date</label>
            <input className="form-input" value={sheet.sheetDate} disabled />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Reference Person</label>
            <input className={`form-input ${fieldClass('contactName') || ''}`} value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div className="field">
            <label>Mobile</label>
            <input className={`form-input ${fieldClass('mobile') || ''}`} value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Payment Mode</label>
            <select className={`form-input ${fieldClass('paymentMode') || ''}`} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="GPay">GPay</option>
              <option value="Invoice">Invoice</option>
            </select>
          </div>
          <div className="field">
            <label>Receiver Name (mandatory)</label>
            <input className="form-input" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required />
          </div>
        </div>

        <label style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 8px' }}>
          Line Items — photo required for each
        </label>
        <div className="line-items">
          <div className="line-item-row header">
            <div>Item</div><div>Qty</div><div>Rate</div><div>Amount</div><div>Photo</div><div></div>
          </div>
          {items.map((item, idx) => (
            <div className="line-item-row" key={item.id}>
              <div>{item.itemName}</div>
              <input className={`form-input ${item.editedFields?.includes('qty') ? 'edited-field' : ''}`} type="number" step="0.01"
                value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
              <input className={`form-input ${item.editedFields?.includes('rate') ? 'edited-field' : ''}`} type="number" step="0.01"
                value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} />
              <div className={`mono ${item.editedFields?.includes('amount') ? 'edited-field' : ''}`}>
                ₹{((Number(item.qty) || 0) * (Number(item.rate) || 0)).toFixed(2)}
              </div>
              <div>
                {item.photoUrl ? (
                  <img className="photo-thumb" src={resolveAsset(item.photoUrl)} alt="proof" />
                ) : (
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>required</span>
                )}
              </div>
              <label className="btn btn-cancel btn-small" style={{ cursor: 'pointer' }}>
                {item.photoUrl ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && uploadPhoto(item, e.target.files[0])} />
              </label>
            </div>
          ))}
          <div className="totals-box">
            <div className="line"><span>Sub Total</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="line"><span>GST</span><span>₹{gst.toFixed(2)}</span></div>
            <div className="grand">Total: ₹{total.toFixed(2)}</div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button>
          <button className="btn btn-cancel" type="button" onClick={() => navigate('/transaction/job-sheets')}>Back</button>
        </div>
      </form>

      <ShareCard ref={cardRef} sheet={shareData} />
      <Toast message={toast} />
    </div>
  );
}
