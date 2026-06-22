import { useState } from 'react';
import * as api from '../api';
import { Toast } from '../components/ui';

export default function ReportPage() {
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState('');

  const generate = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jrv-impact-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setToast('Could not generate report');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Report</h1>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 50 }}>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          Exports Locations, Companies, Job Titles, Pre Job Sheets and Job Sheets into a single Excel workbook.
        </p>
        <button className="btn btn-accent" onClick={generate} disabled={downloading}>
          {downloading ? 'Generating…' : '📊 Generate Excel'}
        </button>
      </div>

      <Toast message={toast} />
    </div>
  );
}
