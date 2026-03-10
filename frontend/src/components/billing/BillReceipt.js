import React from 'react';

const BillReceipt = React.forwardRef(({ bill, settings }, ref) => {
  const fmt = (n) => `${settings?.currency_symbol || '₹'}${Number(n || 0).toFixed(2)}`;
  const shopName = settings?.shop_name || 'Bumiya Milk Suppliers';
  const showTax = settings?.show_tax_on_bill !== 'false';

  return (
    <div ref={ref} className="bill-receipt" style={{ maxWidth: 420, margin: '0 auto', fontFamily: 'monospace', fontSize: 13, background: 'white', padding: '20px 24px', boxShadow: 'var(--shadow-md)', borderRadius: 8 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px dashed #ccc', paddingBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>🥛 {shopName}</div>
        {settings?.shop_address && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{settings.shop_address}</div>}
        {settings?.shop_phone && <div style={{ fontSize: 12, color: '#555' }}>📞 {settings.shop_phone}</div>}
        {settings?.shop_gstin && <div style={{ fontSize: 11, color: '#888' }}>GSTIN: {settings.shop_gstin}</div>}
      </div>

      {/* Bill Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
        <div>
          <strong>Bill #:</strong> {bill.bill_number}
        </div>
        <div style={{ color: '#555' }}>{bill.created_at?.slice(0, 16)}</div>
      </div>

      {bill.customer_name && (
        <div style={{ fontSize: 12, marginBottom: 10, background: '#f9f9f9', padding: '6px 10px', borderRadius: 4 }}>
          <strong>Customer:</strong> {bill.customer_name}
          {bill.customer_phone && <span> | 📞 {bill.customer_phone}</span>}
        </div>
      )}

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #ccc' }}>
            <th style={{ textAlign: 'left', padding: '4px 4px 4px 0', fontWeight: 600 }}>Item</th>
            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>Before Tax</th>
            {showTax && <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>Tax %</th>}
            {showTax && <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>Tax Amt</th>}
            <th style={{ textAlign: 'right', padding: '4px 0 4px 4px', fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.items?.map((item, i) => {
            const beforeTax = Number(item.quantity || 0) * Number(item.price_per_unit || 0);
            return (
              <tr key={i} style={{ borderBottom: '1px dotted #eee' }}>
                <td style={{ padding: '5px 4px 5px 0' }}>
                  <div>{item.product_name}</div>
                  <div style={{ color: '#888', fontSize: 11 }}>{item.quantity} {item.unit} x {fmt(item.price_per_unit)}</div>
                </td>
                <td style={{ textAlign: 'right', padding: '5px 0' }}>{fmt(beforeTax)}</td>
                {showTax && <td style={{ textAlign: 'right', padding: '5px 0' }}>{Number(item.tax_percent || 0).toFixed(1)}%</td>}
                {showTax && <td style={{ textAlign: 'right', padding: '5px 0' }}>{fmt(item.tax_amount)}</td>}
                <td style={{ textAlign: 'right', padding: '5px 4px 5px 4px', fontWeight: 600 }}>{fmt(item.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
          <span>Total Before Tax:</span><span>{fmt(bill.subtotal)}</span>
        </div>
        {showTax && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: '#666' }}>
            <span>Total Tax:</span><span>{fmt(bill.tax_total)}</span>
          </div>
        )}
        {bill.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3, color: 'green' }}>
            <span>Discount:</span><span>-{fmt(bill.discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: '2px solid #333', marginTop: 6, paddingTop: 6 }}>
          <span>TOTAL:</span><span>{fmt(bill.grand_total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6, color: '#555' }}>
          <span>Payment: {bill.payment_method?.toUpperCase()}</span>
          {bill.change_amount > 0 && <span>Change: {fmt(bill.change_amount)}</span>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 16, borderTop: '2px dashed #ccc', paddingTop: 12, fontSize: 12, color: '#888' }}>
        {settings?.footer_message || 'Thank you for your business!'}
      </div>
    </div>
  );
});

export default BillReceipt;
