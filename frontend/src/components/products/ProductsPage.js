import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, History } from 'lucide-react';
import { getCategories, getProducts, createProduct, updateProduct, deleteProduct, bulkUpdateProducts, getAuditLog } from '../../services/api';

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'dozen', 'box'];

const EMPTY_FORM = { category_id: '', name: '', unit: 'kg', price_per_unit: '', price_after_tax: '', tax_percent: '0', hsn_code: '', barcode: '', active: true };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ price_per_unit: '', price_change_type: 'set', tax_percent: '' });
  const [auditModal, setAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  const load = () => {
    getProducts({ category_id: filterCat || undefined, active: 'all' })
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Failed to load products'));
  };

  useEffect(() => {
    getCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterCat]);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)
  );

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || '' });
    setEditId(null); setModal('form');
  };
  const openEdit = (p) => {
    const basePrice = Number(p.price_per_unit || 0);
    const taxPct = Number(p.tax_percent || 0);
    const afterTax = basePrice + ((basePrice * taxPct) / 100);
    setForm({
      category_id: p.category_id, name: p.name, unit: p.unit,
      price_per_unit: p.price_per_unit, tax_percent: p.tax_percent,
      price_after_tax: afterTax.toFixed(2),
      hsn_code: p.hsn_code || '', barcode: p.barcode || '', active: !!p.active,
    });
    setEditId(p.id); setModal('form');
  };

  const updatePriceAfterTax = (value) => {
    setForm(prev => {
      const taxPct = parseFloat(prev.tax_percent) || 0;
      const afterTax = parseFloat(value);
      const next = { ...prev, price_after_tax: value };
      if (!Number.isNaN(afterTax) && afterTax >= 0) {
        const base = taxPct > 0 ? (afterTax / (1 + (taxPct / 100))) : afterTax;
        next.price_per_unit = base.toFixed(2);
      } else {
        next.price_per_unit = '';
      }
      return next;
    });
  };

  const updateTaxPercent = (value) => {
    setForm(prev => {
      const next = { ...prev, tax_percent: value };
      const taxPct = parseFloat(value) || 0;
      const base = parseFloat(prev.price_per_unit);
      if (!Number.isNaN(base) && base >= 0) {
        const afterTax = base * (1 + (taxPct / 100));
        next.price_after_tax = afterTax.toFixed(2);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name required'); return; }
    if (!form.category_id) { toast.error('Select a category'); return; }
    setLoading(true);
    try {
      const payload = { ...form, price_per_unit: parseFloat(form.price_per_unit) || 0, tax_percent: parseFloat(form.tax_percent) || 0, active: form.active ? 1 : 0 };
      if (editId) { await updateProduct(editId, payload); toast.success('Product updated'); }
      else { await createProduct(payload); toast.success('Product added'); }
      setModal(null); load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    try { await deleteProduct(p.id); toast.success('Product deactivated'); load(); }
    catch (e) { toast.error('Failed'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));

  const handleBulkUpdate = async () => {
    if (!selected.length) { toast.error('Select products first'); return; }
    const payload = { product_ids: selected };
    if (bulkForm.price_per_unit !== '') { payload.price_per_unit = parseFloat(bulkForm.price_per_unit); payload.price_change_type = bulkForm.price_change_type; }
    if (bulkForm.tax_percent !== '') { payload.tax_percent = parseFloat(bulkForm.tax_percent); }
    if (!payload.price_per_unit && payload.tax_percent === undefined) { toast.error('Enter price or tax to update'); return; }
    setLoading(true);
    try {
      const r = await bulkUpdateProducts(payload);
      toast.success(`Updated ${r.data.updated} product(s)`);
      setBulkModal(false); setSelected([]); load();
    } catch (e) {
      toast.error('Bulk update failed');
    } finally { setLoading(false); }
  };

  const openAuditLog = async () => {
    const r = await getAuditLog();
    setAuditLog(r.data);
    setAuditModal(true);
  };

  const fmt = (n) => `₹${Number(n).toFixed(2)}`;

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={openAuditLog}><History />Price Log</button>
          {selected.length > 0 && <button className="btn btn-secondary btn-sm" onClick={() => setBulkModal(true)}><RefreshCw />Bulk Update ({selected.length})</button>}
          <button className="btn btn-primary" onClick={openAdd}><Plus />Add Product</button>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search /><input className="form-control form-control-sm" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
            </div>
            <select className="form-control form-control-sm" style={{ width: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{filtered.length} products</span>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Before Tax</th>
                  <th>After Tax</th>
                  <th>Tax %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No products found</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                    <td><strong>{p.name}</strong>{p.hsn_code && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 6 }}>HSN:{p.hsn_code}</span>}</td>
                    <td><span className="badge badge-blue">{p.category_name}</span></td>
                    <td>{p.unit}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.price_per_unit)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(Number(p.price_per_unit || 0) * (1 + (Number(p.tax_percent || 0) / 100)))}</td>
                    <td>{p.tax_percent}%</td>
                    <td><span className={`badge ${p.active ? 'badge-green' : 'badge-red'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Pencil /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}><Trash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Product' : 'Add Product'}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Full Cream Milk" autoFocus />
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select className="form-control" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Final Price per {form.unit} (After Tax) (₹) *</label>
                  <input type="number" min="0" step="0.01" className="form-control" value={form.price_after_tax} onChange={e => updatePriceAfterTax(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">Tax %</label>
                  <input type="number" min="0" max="100" step="0.1" className="form-control" value={form.tax_percent} onChange={e => updateTaxPercent(e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Base Price (Before Tax) per {form.unit} (₹)</label>
                  <input type="number" className="form-control" value={form.price_per_unit} readOnly disabled />
                </div>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">HSN Code</label>
                  <input className="form-control" value={form.hsn_code} onChange={e => setForm(p => ({ ...p, hsn_code: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Barcode</label>
                  <input className="form-control" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.active ? '1' : '0'} onChange={e => setForm(p => ({ ...p, active: e.target.value === '1' }))}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="form-group"></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {bulkModal && (
        <div className="modal-overlay" onClick={() => setBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Bulk Update — {selected.length} Products</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setBulkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 14, fontSize: 12, color: 'var(--gray-500)' }}>Leave blank to skip that field.</p>
              <div className="form-group">
                <label className="form-label">Price Change Type</label>
                <select className="form-control" value={bulkForm.price_change_type} onChange={e => setBulkForm(p => ({ ...p, price_change_type: e.target.value }))}>
                  <option value="set">Set fixed price</option>
                  <option value="percent_increase">Increase by %</option>
                  <option value="percent_decrease">Decrease by %</option>
                  <option value="amount_increase">Increase by ₹</option>
                  <option value="amount_decrease">Decrease by ₹</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price Value</label>
                <input type="number" min="0" step="0.01" className="form-control" value={bulkForm.price_per_unit} onChange={e => setBulkForm(p => ({ ...p, price_per_unit: e.target.value }))} placeholder="Leave blank to skip" />
              </div>
              <div className="form-group">
                <label className="form-label">Set Tax % (for all selected)</label>
                <input type="number" min="0" max="100" step="0.1" className="form-control" value={bulkForm.tax_percent} onChange={e => setBulkForm(p => ({ ...p, tax_percent: e.target.value }))} placeholder="Leave blank to skip" />
              </div>
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
                ⚠️ This will update {selected.length} product(s). All changes are logged in the audit trail.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBulkModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBulkUpdate} disabled={loading}>{loading ? 'Updating...' : 'Apply Update'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditModal && (
        <div className="modal-overlay" onClick={() => setAuditModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Price Audit Log</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setAuditModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="table-container" style={{ maxHeight: 400 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Old Price</th>
                      <th>New Price</th>
                      <th>Old Tax</th>
                      <th>New Tax</th>
                      <th>Changed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No changes recorded</td></tr>}
                    {auditLog.map(l => (
                      <tr key={l.id}>
                        <td>{l.product_name}</td>
                        <td>₹{Number(l.old_price).toFixed(2)}</td>
                        <td style={{ color: l.new_price > l.old_price ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{Number(l.new_price).toFixed(2)}</td>
                        <td>{l.old_tax}%</td>
                        <td>{l.new_tax}%</td>
                        <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{l.changed_at?.slice(0, 16)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAuditModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
