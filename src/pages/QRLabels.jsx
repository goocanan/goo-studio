import React, { useState } from 'react';
import { QrCode, Download, Printer } from 'lucide-react';
import { formatRelativeDate } from '../lib/utils';

export default function QRLabels({ spools }) {
  const [selected, setSelected] = useState([]);
  const [printHistory, setPrintHistory] = useState([]);

  const toggleSelection = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    if (selected.length === 0) return;
    const selectedSpools = spools.filter(s => selected.includes(s.id));
    setPrintHistory(prev => [{
      id: Date.now(),
      date: new Date().toISOString(),
      count: selected.length,
      spoolIds: selected.slice(),
      labels: selectedSpools.map(s => `${s.id} ${s.brand} ${s.material} ${s.colorName}`),
    }, ...prev]);
    // In real app, this would generate a PDF
    alert(`QR Labels generated for ${selected.length} spool(s)!\n\nIn production, this would download a PDF.`);
  };

  const selectedSpools = spools.filter(s => selected.includes(s.id));

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">🔖 QR Label Manager</h1>
          <p className="page-subtitle">Generate and print QR labels for your spools</p>
        </div>
      </div>

      {/* Generate Section */}
      <div className="section">
        <div className="section-header">
          <QrCode style={{ width: 16, height: 16 }} />
          <span>Generate Labels</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Select spools to generate QR labels:
          </div>

          <div className="checkbox-list" style={{ marginBottom: '1.25rem' }}>
            {spools.map(spool => (
              <label
                key={spool.id}
                className={`checkbox-item ${selected.includes(spool.id) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(spool.id)}
                  onChange={() => toggleSelection(spool.id)}
                />
                <div className="spool-color-dot" style={{ background: spool.colorHex, width: 10, height: 10 }} />
                <span style={{ fontWeight: 600 }}>{spool.id}</span>
                <span className="text-dim">{spool.brand} {spool.material} {spool.colorName} {spool.version}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-dim" style={{ fontSize: '0.85rem' }}>
              {selected.length} spool(s) selected
            </span>
            <button
              className="btn btn-primary"
              disabled={selected.length === 0}
              onClick={handlePrint}
              style={selected.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <Download style={{ width: 16, height: 16 }} />
              Download PDF (A4 Grid)
            </button>
          </div>
        </div>
      </div>

      {/* QR Preview */}
      {selectedSpools.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span>👁️</span>
            <span>Preview</span>
          </div>

          <div className="qr-grid">
            {selectedSpools.map(spool => (
              <div key={spool.id} className="qr-card">
                <div className="qr-placeholder">
                  <div style={{ textAlign: 'center' }}>
                    <QrCode style={{ width: 48, height: 48, marginBottom: '0.5rem', opacity: 0.5 }} />
                    <div style={{ fontSize: '0.7rem' }}>QR Code</div>
                  </div>
                </div>
                <div className="qr-card-label">{spool.id}</div>
                <div className="qr-card-sub">{spool.brand} {spool.material}</div>
                <div className="qr-card-sub">{spool.colorName} {spool.version}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print History */}
      <div className="section">
        <div className="section-header">
          <Printer style={{ width: 16, height: 16 }} />
          <span>Print History</span>
        </div>

        <div className="glass-card" style={{ padding: '0.5rem 0' }}>
          {printHistory.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Printer style={{ width: 40, height: 40 }} />
              <p>Belum ada label yang dicetak</p>
            </div>
          ) : (
            printHistory.map(entry => (
              <div key={entry.id} className="history-item">
                <div>
                  <div className="history-date">{formatRelativeDate(entry.date)}</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    {entry.count} label · {entry.spoolIds.join(', ')}
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>
                  Reprint
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
