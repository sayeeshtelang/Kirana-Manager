import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportService } from '../services/reportService';
import { Card, PageHeader, Select, Input, ErrorState, LoadingBlock, EmptyState, formatINR } from '../components/ui';

const PIE_COLORS = ['#12805c', '#eba33d', '#4b5a52', '#c0392b', '#0e6a4b'];

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [groupBy, setGroupBy] = useState('day');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = () => {
    setStatus('loading');
    const params = { from, to };
    Promise.all([
      reportService.sales({ ...params, groupBy }),
      reportService.products(params),
      reportService.paymentMethods(params),
    ])
      .then(([s, p, pm]) => {
        setSales(s.report);
        setProducts(p.products);
        setPaymentBreakdown(pm.breakdown);
        setStatus('success');
      })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, [groupBy]);

  const totalSales = sales.reduce((s, r) => s + r.totalSales, 0);

  return (
    <div>
      <PageHeader title="Sales Reports" subtitle="Analyze performance across any date range." />

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="day">Day</option>
            <option value="month">Month</option>
          </Select>
          <button onClick={load} className="px-4 py-2 rounded-lg bg-[var(--color-brand-500)] text-white text-sm font-medium hover:bg-[var(--color-brand-600)]">
            Apply
          </button>
        </div>
      </Card>

      {status === 'loading' && <LoadingBlock />}
      {status === 'error' && <ErrorState message={error} />}

      {status === 'success' && (
        <>
          <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            Total sales in this range: <strong className="text-[var(--color-ink)]">{formatINR(totalSales)}</strong>
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-2">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Sales over time</p>
              {sales.length === 0 ? <EmptyState title="No sales in this range" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v) => formatINR(v)} />
                    <Bar dataKey="totalSales" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Payment methods</p>
              {paymentBreakdown.length === 0 ? <EmptyState title="No data" /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={paymentBreakdown} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={(d) => d.method}>
                      {paymentBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card className="p-4 mt-4">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Product performance</p>
            {products.length === 0 ? <EmptyState title="No product sales in this range" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Quantity sold</th>
                      <th className="px-3 py-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{p.name}</td>
                        <td className="px-3 py-2">{p.quantitySold}</td>
                        <td className="px-3 py-2">{formatINR(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
