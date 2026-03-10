import React, { useState, useEffect } from 'react';
import { getBillSummary } from '../../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBillSummary()
      .then(r => setSummary(r.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
      <div className="page-body">
        {loading ? <p style={{ color: 'var(--gray-500)' }}>Loading...</p> : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Today's Sales</div>
                <div className="stat-value" style={{ color: 'var(--primary)' }}>{fmt(summary?.today?.total)}</div>
                <div className="stat-sub">{summary?.today?.count || 0} bills today</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">This Month</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{fmt(summary?.month?.total)}</div>
                <div className="stat-sub">{summary?.month?.count || 0} bills this month</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Top Products Today</span>
              </div>
              {(summary?.top_products?.length > 0) ? (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty Sold</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.top_products.map((p, i) => (
                      <tr key={i}>
                        <td>{p.product_name}</td>
                        <td>{p.total_qty}</td>
                        <td>{fmt(p.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 24 }}>No sales today yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
