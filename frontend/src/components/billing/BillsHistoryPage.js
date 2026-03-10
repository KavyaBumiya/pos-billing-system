import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, XCircle, Search } from 'lucide-react';
import { getBills, getBill, cancelBill, getSettings } from '../../services/api';
import BillReceipt from './BillReceipt';

export default function BillsHistoryPage() {
  const [bills, setBills] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewBill, setViewBill] = useState(null);
  const [settings, setSettings] = useState({});

  const load = () => {
    getBills({ from: dateFrom || undefined, to: dateTo || undefined })
      .then(r => setBills(r.data)).catch(() => toast.error('Failed to load bills'));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); getSettings().then(r => setSettings(r.data)).catch(() => {}); }, []);

  const handleView = async (id) => {
    const r = await getBill(id);
    setViewBill(r.data);
  };

  const handleCancel = async (b) => {
    if (!window.confirm(`Cancel bill ${b.bill_number}?`)) return;
    await cancelBill(b.id);
    toast.success('Bill cancelled');
    load();
  };

  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

  const statusBadge = (s) => {
    if (s === 'paid') return <span className="badge badge-green">Paid</span>;
    if (s === 'cancelled') return <span className="badge badge-red">Cancelled</span>;
    return <span className="badge badge-yellow">{s}</span>;
  };

  return (
    <>
      <div className="page-header">
        <h1>Bill History</h1>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-control form-control-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={load} style={{ marginTop: 16 }}><Search />Search</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(load, 50); }} style={{ marginTop: 16 }}>Clear</button>
            <span style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 16 }}>{bills.length} bills</span>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Grand Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No bills found</td></tr>}
                {bills.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.bill_number}</td>
                    <td>{b.customer_name || '—'}</td>
                    <td style={{ color: 'var(--gray-500)' }}>—</td>
                    <td>{fmt(b.subtotal)}</td>
                    <td>{fmt(b.tax_total)}</td>
                    <td>{b.discount > 0 ? fmt(b.discount) : '—'}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(b.grand_total)}</td>
                    <td><span className="badge badge-blue">{b.payment_method?.toUpperCase()}</span></td>
                    <td>{statusBadge(b.status)}</td>
                    <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{b.created_at?.slice(0, 16)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleView(b.id)}><Eye /></button>
                        {b.status === 'paid' && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b)}><XCircle /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Bill Modal */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{viewBill.bill_number}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨️ Print</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setViewBill(null)}>✕</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding: 16 }}>
              <BillReceipt bill={viewBill} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
