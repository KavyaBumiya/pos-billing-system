import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, Printer, RotateCcw, User } from 'lucide-react';
import { searchProducts, getCategories, getProducts, createBill, getSettings } from '../../services/api';
import BillReceipt from './BillReceipt';

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'credit'];

export default function BillingPage() {
  const [items, setItems] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catProducts, setCatProducts] = useState([]);
  const [selCat, setSelCat] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [discount, setDiscount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [settings, setSettings] = useState({});
  const [showCatPanel, setShowCatPanel] = useState(true);
  const searchRef = useRef();
  const receiptRef = useRef();

  useEffect(() => {
    getCategories().then(r => { setCategories(r.data); if (r.data[0]) setSelCat(String(r.data[0].id)); }).catch(() => {});
    getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selCat) {
      getProducts({ category_id: selCat, active: 1 })
        .then(r => setCatProducts(r.data)).catch(() => {});
    }
  }, [selCat]);

  // Search
  useEffect(() => {
    if (searchQ.trim().length < 1) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      searchProducts(searchQ).then(r => setSearchResults(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ]);

  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.product_id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        const nextQty = (parseFloat(updated[existing].quantity) || 0) + 1;
        const nextItem = { ...updated[existing], quantity: nextQty };
        const lineBase = (parseFloat(nextItem.quantity) || 0) * (parseFloat(nextItem.price_per_unit) || 0);
        const lineTax = lineBase * (parseFloat(nextItem.tax_percent) || 0) / 100;
        nextItem.final_amount = round2(lineBase + lineTax).toFixed(2);
        updated[existing] = nextItem;
        return updated;
      }
      const lineBase = (parseFloat(product.price_per_unit) || 0);
      const lineTax = lineBase * (parseFloat(product.tax_percent) || 0) / 100;
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: 1,
        price_per_unit: product.price_per_unit,
        tax_percent: product.tax_percent,
        final_amount: round2(lineBase + lineTax).toFixed(2),
      }];
    });
    setSearchQ('');
    setSearchResults([]);
  }, []);

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      const nextItem = { ...updated[idx], [field]: value };
      if (field === 'quantity') {
        const lineBase = (parseFloat(nextItem.quantity) || 0) * (parseFloat(nextItem.price_per_unit) || 0);
        const lineTax = lineBase * (parseFloat(nextItem.tax_percent) || 0) / 100;
        nextItem.final_amount = round2(lineBase + lineTax).toFixed(2);
      }
      updated[idx] = nextItem;
      return updated;
    });
  };

  const updateItemFromFinalAmount = (idx, value) => {
    setItems(prev => {
      const updated = [...prev];
      const nextItem = { ...updated[idx], final_amount: value };
      const finalAmount = parseFloat(value);
      const pricePerUnit = parseFloat(nextItem.price_per_unit) || 0;
      const taxPct = parseFloat(nextItem.tax_percent) || 0;
      if (!Number.isNaN(finalAmount) && finalAmount >= 0 && pricePerUnit > 0) {
        const baseTotal = taxPct > 0 ? (finalAmount / (1 + (taxPct / 100))) : finalAmount;
        nextItem.quantity = Number((baseTotal / pricePerUnit).toFixed(3));
      }
      updated[idx] = nextItem;
      return updated;
    });
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const calcLine = (item) => {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0);
    const tax = base * (parseFloat(item.tax_percent) || 0) / 100;
    return { base: round2(base), tax: round2(tax), total: round2(base + tax) };
  };

  const round2 = (n) => Math.round(n * 100) / 100;

  const totals = items.reduce((acc, item) => {
    const c = calcLine(item);
    return { subtotal: acc.subtotal + c.base, taxTotal: acc.taxTotal + c.tax, lineTotal: acc.lineTotal + c.total };
  }, { subtotal: 0, taxTotal: 0, lineTotal: 0 });

  const discountAmt = parseFloat(discount) || 0;
  const grandTotal = round2(totals.lineTotal - discountAmt);
  const paid = parseFloat(amountPaid) || grandTotal;
  const change = round2(paid - grandTotal);

  const fmt = (n) => `${settings.currency_symbol || '₹'}${Number(n).toFixed(2)}`;

  const handleSaveBill = async () => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    setLoading(true);
    try {
      const payload = {
        items: items.map(({ final_amount, ...i }) => ({
          ...i,
          quantity: parseFloat(i.quantity) || 0,
          price_per_unit: parseFloat(i.price_per_unit) || 0,
          tax_percent: parseFloat(i.tax_percent) || 0,
        })),
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_address: customer.address,
        discount: discountAmt,
        payment_method: payMethod,
        amount_paid: paid,
      };
      const r = await createBill(payload);
      setLastBill(r.data);
      toast.success(`Bill ${r.data.bill_number} saved!`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save bill');
    } finally { setLoading(false); }
  };

  const handleNewBill = () => {
    setItems([]); setCustomer({ name: '', phone: '', address: '' });
    setDiscount(''); setAmountPaid(''); setPayMethod('cash'); setLastBill(null);
    searchRef.current?.focus();
  };

  const handlePrint = () => {
    window.print();
  };

  if (lastBill) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header no-print">
          <h1>Bill Generated — {lastBill.bill_number}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handlePrint}><Printer />Print</button>
            <button className="btn btn-primary" onClick={handleNewBill}><Plus />New Bill</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <BillReceipt bill={lastBill} settings={settings} ref={receiptRef} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header no-print">
        <h1>New Bill</h1>
        <button className="btn btn-secondary btn-sm" onClick={handleNewBill}><RotateCcw />Clear</button>
      </div>
      <div className="page-body" style={{ padding: '12px 16px' }}>
        <div className="billing-layout">
          {/* LEFT - Items */}
          <div className="bill-left">
            {/* Search */}
            <div className="card" style={{ padding: '10px 14px', marginBottom: 10, flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', width: 16, height: 16 }} />
                <input
                  ref={searchRef}
                  className="form-control"
                  style={{ paddingLeft: 34 }}
                  placeholder="Search product by name or barcode..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--gray-200)', borderRadius: 6, zIndex: 100, boxShadow: 'var(--shadow-md)', maxHeight: 240, overflowY: 'auto' }}>
                    {searchResults.map(p => (
                      <div key={p.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)' }}
                        onMouseDown={() => addItem(p)}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.product_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{p.category_name} • {p.unit}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.price_per_unit}/{p.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category quick-add panel */}
            <div className="card" style={{ padding: '8px 12px', marginBottom: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: showCatPanel ? 10 : 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)' }}>Quick Add:</span>
                {categories.map(c => (
                  <button key={c.id} className={`btn btn-sm ${selCat === String(c.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setSelCat(String(c.id)); setShowCatPanel(true); }}>
                    {c.name}
                  </button>
                ))}
              </div>
              {showCatPanel && catProducts.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {catProducts.map(p => {
                    const basePrice = Number(p.price_per_unit || 0);
                    const taxPct = Number(p.tax_percent || 0);
                    const finalPrice = basePrice + ((basePrice * taxPct) / 100);
                    return (
                      <button key={p.id} className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => addItem(p)}>
                        <Plus style={{ width: 12, height: 12 }} />{p.name} ({fmt(finalPrice)}/{p.unit})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--gray-500)', borderBottom: '1px solid var(--gray-200)' }}>
                Change Qty to auto-update Final Amount, or change Final Amount to auto-update Qty (weight).
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th style={{ width: 90 }}>Weight</th>
                      <th style={{ width: 100 }}>Unit</th>
                      <th style={{ width: 110 }}>Rate (₹)</th>
                      <th style={{ width: 60 }}>Tax%</th>
                      <th style={{ width: 130 }}>Final Amt (₹)</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No items added. Search or click Quick Add above.</td></tr>
                    )}
                    {items.map((item, idx) => {
                      const { total } = calcLine(item);
                      return (
                        <tr key={idx}>
                          <td style={{ color: 'var(--gray-400)' }}>{idx + 1}</td>
                          <td>
                            <input className="form-control form-control-sm" value={item.product_name} onChange={e => updateItem(idx, 'product_name', e.target.value)} style={{ border: 'none', background: 'transparent', padding: '2px 4px', fontWeight: 500 }} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.001" className="form-control form-control-sm" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ width: 80 }} />
                          </td>
                          <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>{item.unit}</td>
                          <td style={{ fontWeight: 600 }}>{fmt(item.price_per_unit)}</td>
                          <td style={{ color: 'var(--gray-600)', fontWeight: 600 }}>{Number(item.tax_percent || 0).toFixed(1)}%</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={item.final_amount ?? total.toFixed(2)}
                              onChange={e => updateItemFromFinalAmount(idx, e.target.value)}
                              style={{ width: 120, fontWeight: 600 }}
                            />
                          </td>
                          <td>
                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 6px' }} onClick={() => removeItem(idx)}><Trash2 style={{ width: 14, height: 14 }} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT - Summary & Customer */}
          <div className="bill-right">
            {/* Customer */}
            <div className="card" style={{ padding: '14px 16px', marginBottom: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <User style={{ width: 14, height: 14, color: 'var(--gray-500)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer (Optional)</span>
              </div>
              <div className="form-group">
                <input className="form-control form-control-sm" placeholder="Customer name" value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="input-row">
                <div className="form-group">
                  <input className="form-control form-control-sm" placeholder="Phone" value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bill-summary-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 6, paddingBottom: 8, borderBottom: '1px solid var(--gray-200)' }}>
                Bill Summary ({items.length} items)
              </div>
              <div className="bill-total-line"><span>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
              <div className="bill-total-line"><span>Tax</span><span>{fmt(totals.taxTotal)}</span></div>
              <div className="form-group" style={{ margin: '6px 0' }}>
                <label className="form-label">Discount (₹)</label>
                <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="bill-total-line grand"><span>Grand Total</span><span>{fmt(grandTotal)}</span></div>

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Payment Method</label>
                <select className="form-control form-control-sm" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </div>
              {payMethod === 'cash' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Amount Received (₹)</label>
                    <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={grandTotal.toFixed(2)} />
                  </div>
                  {paid > grandTotal && (
                    <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 6, padding: '8px 12px', fontSize: 14, fontWeight: 700, color: 'var(--success)', textAlign: 'center' }}>
                      Change: {fmt(change)}
                    </div>
                  )}
                </>
              )}

              <button className="btn btn-success btn-lg" style={{ width: '100%', marginTop: 10 }} onClick={handleSaveBill} disabled={loading || items.length === 0}>
                {loading ? 'Saving...' : `💾 Save Bill  ${fmt(grandTotal)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
