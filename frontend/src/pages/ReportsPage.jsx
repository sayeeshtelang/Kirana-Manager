import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportService } from '../services/reportService';
import { Card, PageHeader, Select, Input, ErrorState, LoadingBlock, EmptyState, Badge, formatINR } from '../components/ui';

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
  const [reportType, setReportType] = useState('sales');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = () => {
    setStatus('loading');
    const params = { from, to };
    Promise.all([
      reportService.sales({ ...params, groupBy }),
      reportService.products(params),
      reportService.paymentMethods(params),
      reportService.purchases(params),
    ])
      .then(([s, p, pm, pr]) => {
        setSales(s.report);
        setProducts(p.products);
        setPaymentBreakdown(pm.breakdown);
        setPurchases(pr.purchases);
        setPurchaseOrders(pr.orders);
        setStatus('success');
      })
      .catch((err) => { setError(err.response?.data?.message); setStatus('error'); });
  };

  useEffect(load, [groupBy]);

  const totalSales = sales.reduce((s, r) => s + r.totalSales, 0);
  const totalPurchases = purchases.reduce((sum, row) => sum + row.totalPurchases, 0);
  const receivedPurchases = purchases.reduce((sum, row) => sum + row.receivedPurchases, 0);
  const pendingPurchases = totalPurchases - receivedPurchases;

  return (
    <div>
      <PageHeader title={`${reportType === 'sales' ? 'Sales' : 'Purchase'} Reports`} subtitle="Analyze performance across any date range." />

      <div className="flex gap-1 p-1 mb-4 w-fit rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportType === 'sales' ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}
        >
          Sales report
        </button>
        <button
          type="button"
          onClick={() => setReportType('purchases')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${reportType === 'purchases' ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm' : 'text-[var(--color-ink-soft)]'}`}
        >
          Purchase report
        </button>
      </div>

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
          {reportType === 'sales' && <p className="text-sm text-[var(--color-ink-soft)] mb-4">
            Total sales in this range: <strong className="text-[var(--color-ink)]">{formatINR(totalSales)}</strong>
          </p>}

          {reportType === 'purchases' && <Card className="p-4 mb-4">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-4">Purchase overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="rounded-lg bg-[var(--color-surface-sunken)] p-3">
                <p className="text-xs text-[var(--color-ink-soft)]">Purchase orders</p>
                <p className="text-xl font-semibold mt-1">{purchaseOrders.length}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-sunken)] p-3">
                <p className="text-xs text-[var(--color-ink-soft)]">Total purchases</p>
                <p className="text-xl font-semibold mt-1">{formatINR(totalPurchases)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-sunken)] p-3">
                <p className="text-xs text-[var(--color-ink-soft)]">Received value</p>
                <p className="text-xl font-semibold mt-1">{formatINR(receivedPurchases)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-sunken)] p-3">
                <p className="text-xs text-[var(--color-ink-soft)]">Pending value</p>
                <p className="text-xl font-semibold mt-1">{formatINR(pendingPurchases)}</p>
              </div>
            </div>
            {purchaseOrders.length === 0 ? <EmptyState title="No purchases in this range" /> : (
              <>
                <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Supplier breakdown</p>
                <div className="overflow-x-auto mb-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                        <th className="px-3 py-2 font-medium">Supplier</th>
                        <th className="px-3 py-2 font-medium">Orders</th>
                        <th className="px-3 py-2 font-medium">Items</th>
                        <th className="px-3 py-2 font-medium text-right">Total</th>
                        <th className="px-3 py-2 font-medium text-right">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase._id} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{purchase.supplier}</td>
                          <td className="px-3 py-2">{purchase.orderCount}</td>
                          <td className="px-3 py-2">{purchase.itemQuantity}</td>
                          <td className="px-3 py-2 text-right">{formatINR(purchase.totalPurchases)}</td>
                          <td className="px-3 py-2 text-right">{formatINR(purchase.receivedPurchases)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Purchase order details</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                        <th className="px-3 py-2 font-medium">PO number</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Supplier</th>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 font-medium text-right">Quantity</th>
                        <th className="px-3 py-2 font-medium text-right">Unit cost</th>
                        <th className="px-3 py-2 font-medium text-right">Line total</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.flatMap((order) => order.items.map((item, index) => (
                        <tr key={`${order._id}-${index}`} className="border-b border-[var(--color-border)] last:border-0">
                          <td className="px-3 py-2 font-medium text-[var(--color-ink)]">{order.poNumber}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-3 py-2">{order.supplier?.name || 'Unknown supplier'}</td>
                          <td className="px-3 py-2">{item.product?.name || 'Product unavailable'}</td>
                          <td className="px-3 py-2 text-right">{item.quantity} {item.product?.unit || ''}</td>
                          <td className="px-3 py-2 text-right">{formatINR(item.unitCost)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatINR(item.total)}</td>
                          <td className="px-3 py-2"><Badge tone={order.status === 'received' ? 'brand' : order.status === 'cancelled' ? 'danger' : 'accent'}>{order.status.replace('_', ' ')}</Badge></td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>}

          {reportType === 'sales' && <>
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
          </>}
        </>
      )}
    </div>
  );
}
