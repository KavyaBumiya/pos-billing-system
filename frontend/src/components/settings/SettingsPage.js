import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';
import { getSettings, updateSettings, getPrinters } from '../../services/api';

const SECTION = ({ title, children }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--gray-200)' }}>{title}</div>
    {children}
  </div>
);

export default function SettingsPage({ onSave }) {
  const [s, setS] = useState({});
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings().then(r => setS(r.data)).catch(() => toast.error('Failed to load settings'));
    getPrinters().then(r => setPrinters(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(s);
      toast.success('Settings saved!');
      if (onSave) onSave(s.shop_name);
    } catch (e) {
      toast.error('Failed to save settings');
    } finally { setLoading(false); }
  };

  const loadPrinters = () => {
    getPrinters().then(r => { setPrinters(r.data); toast.success(`${r.data.length} printer(s) found`); }).catch(() => toast.error('Could not fetch printers'));
  };

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}><Save />{loading ? 'Saving...' : 'Save Settings'}</button>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 720 }}>
          {/* Shop */}
          <SECTION title="🏪 Shop Information">
            <div className="form-group">
              <label className="form-label">Shop Name *</label>
              <input className="form-control" value={s.shop_name || ''} onChange={e => set('shop_name', e.target.value)} placeholder="Bumiya Milk Suppliers" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" value={s.shop_address || ''} onChange={e => set('shop_address', e.target.value)} placeholder="Shop address" />
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={s.shop_phone || ''} onChange={e => set('shop_phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input className="form-control" value={s.shop_gstin || ''} onChange={e => set('shop_gstin', e.target.value)} placeholder="Optional GST number" />
              </div>
            </div>
          </SECTION>

          {/* Billing */}
          <SECTION title="🧾 Billing Settings">
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Bill Prefix</label>
                <input className="form-control" value={s.bill_prefix || ''} onChange={e => set('bill_prefix', e.target.value)} placeholder="BMS" />
              </div>
              <div className="form-group">
                <label className="form-label">Bill Counter (next bill #)</label>
                <input type="number" className="form-control" value={s.bill_counter || ''} onChange={e => set('bill_counter', e.target.value)} />
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input className="form-control" value={s.currency_symbol || '₹'} onChange={e => set('currency_symbol', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Mode</label>
                <select className="form-control" value={s.tax_inclusive || 'false'} onChange={e => set('tax_inclusive', e.target.value)}>
                  <option value="false">Tax Exclusive (added on top)</option>
                  <option value="true">Tax Inclusive (in price)</option>
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Show Tax on Bill</label>
                <select className="form-control" value={s.show_tax_on_bill || 'true'} onChange={e => set('show_tax_on_bill', e.target.value)}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Footer Message</label>
              <input className="form-control" value={s.footer_message || ''} onChange={e => set('footer_message', e.target.value)} placeholder="Thank you for your business!" />
            </div>
          </SECTION>

          {/* Printer */}
          <SECTION title="🖨️ Printer Settings">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label">Printer</label>
                <select className="form-control" value={s.printer_name || ''} onChange={e => set('printer_name', e.target.value)}>
                  <option value="">Default Printer</option>
                  {printers.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary" onClick={loadPrinters}><RefreshCw />Refresh</button>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Print Copies</label>
                <input type="number" min="1" max="5" className="form-control" value={s.print_copies || '1'} onChange={e => set('print_copies', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Printer Type</label>
                <select className="form-control" value={s.printer_type || 'windows'} onChange={e => set('printer_type', e.target.value)}>
                  <option value="windows">Windows Printer (Default)</option>
                  <option value="thermal">Thermal / ESC-POS</option>
                </select>
              </div>
            </div>
          </SECTION>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={loading}><Save />{loading ? 'Saving...' : 'Save All Settings'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
