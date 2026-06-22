import { forwardRef } from 'react';

const fieldClass = (sheet, field) => (sheet.editedFields?.includes(field) ? 'edited-field' : undefined);
const itemClass = (item, field) => (item.editedFields?.includes(field) ? 'edited-field' : undefined);

const ShareCard = forwardRef(function ShareCard({ sheet }, ref) {
  if (!sheet) return null;

  return (
    <div
      ref={ref}
      style={{
        width: 480,
        background: '#f5f0e8',
        color: '#0f0f0f',
        fontFamily: "'DM Sans', sans-serif",
        padding: 24,
        position: 'fixed',
        left: -9999,
        top: 0
      }}
    >
      <div style={{ background: '#0f0f0f', color: '#f5f0e8', padding: '14px 18px', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.03em' }}>
          JRV <span style={{ color: '#c8391a' }}>IMPACT</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.8 }}>JOB SHEET</div>
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: '#ece8df', padding: '6px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 14 }}>
        {sheet.code}
      </div>

      <table style={{ width: '100%', fontSize: 13, marginBottom: 14, borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Date</td><td style={{ textAlign: 'right' }}>{sheet.sheetDate}</td></tr>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Company</td><td style={{ textAlign: 'right' }}>{sheet.companyName}</td></tr>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Reference Person</td><td className={fieldClass(sheet, 'contactName')} style={{ textAlign: 'right' }}>{sheet.contactName}</td></tr>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Mobile</td><td className={fieldClass(sheet, 'mobile')} style={{ textAlign: 'right' }}>{sheet.mobile}</td></tr>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Payment Mode</td><td className={fieldClass(sheet, 'paymentMode')} style={{ textAlign: 'right' }}>{sheet.paymentMode}</td></tr>
          <tr><td style={{ color: '#7a7265', padding: '3px 0' }}>Receiver</td><td style={{ textAlign: 'right' }}>{sheet.receiverName}</td></tr>
        </tbody>
      </table>

      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 14 }}>
        <thead>
          <tr style={{ background: '#0f0f0f', color: '#f5f0e8' }}>
            <td style={{ padding: '6px 8px' }}>Item</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Qty</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Rate</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</td>
          </tr>
        </thead>
        <tbody>
          {sheet.items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #d4cfc4' }}>
              <td style={{ padding: '6px 8px' }}>{item.itemName}</td>
              <td className={itemClass(item, 'qty')} style={{ padding: '6px 8px', textAlign: 'right' }}>{item.qty}</td>
              <td className={itemClass(item, 'rate')} style={{ padding: '6px 8px', textAlign: 'right' }}>{item.rate}</td>
              <td className={itemClass(item, 'amount')} style={{ padding: '6px 8px', textAlign: 'right' }}>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', fontSize: 13 }}>
        <div>Sub Total: {sheet.subTotal}</div>
        <div>GST: {sheet.gstAmount}</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, marginTop: 4 }}>
          Total: ₹{sheet.totalAmount}
        </div>
      </div>

      {sheet.isEdited && (
        <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#c8391a' }}>
          ⚠ Fields in red were edited after the original Pre Job Sheet
        </div>
      )}
    </div>
  );
});

export default ShareCard;
