import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { AlertTriangle, Wallet, Receipt, TrendingUp } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { Card, LoadingBlock, ErrorState, formatINR, Badge } from '../components/ui';

function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)]',
    accent: 'bg-[var(--color-accent-100)] text-[var(--color-accent-600)]',
    danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-600)]',
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-soft)]">{label}</p>
        <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--color-ink)] mt-2">{value}</p>
      {sub && <p className="text-xs text-[var(--color-ink-soft)] mt-1">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { currentMembership } = useAuth();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    dashboardService
      .getSummary()
      .then((data) => {
        if (!ignore) {
          setSummary(data.summary);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.response?.data?.message);
          setStatus('error');
        }
      });
    return () => {
      ignore = true;
    };
  }, [currentMembership?.businessId]);

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error') return <ErrorState message={error} />;
  if (!summary) return null;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">
          {currentMembership?.name ? `${currentMembership.name} — Dashboard` : 'Dashboard'}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">Here's how business is going today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Receipt} label="Today's sales" value={formatINR(summary.today.total)} sub={`${summary.today.count} bills`} />
        <StatCard icon={TrendingUp} label="This week" value={formatINR(summary.week.total)} sub={`${summary.week.count} bills`} tone="accent" />
        <StatCard icon={Wallet} label="Outstanding khatta" value={formatINR(summary.outstandingKhatta.total)} sub={`${summary.outstandingKhatta.count} customers`} tone="accent" />
        <StatCard icon={AlertTriangle} label="Low stock items" value={summary.lowStockCount} sub="Need reordering" tone="danger" />
      </div>

      {summary.salesTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 lg:col-span-2">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Sales — last 14 days</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={summary.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => formatINR(v)} labelFormatter={(l) => `Date: ${l}`} />
                <Line type="monotone" dataKey="total" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Top products this month</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary.topProducts} layout="vertical" margin={{ left: 12 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => formatINR(v)} />
                <Bar dataKey="revenue" fill="var(--color-accent-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">Recent bills</p>
        {summary.recentBills.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)] py-4 text-center">No bills yet today.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {summary.recentBills.map((bill) => (
              <div key={bill._id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">{bill.invoiceNumber}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {bill.customer?.name || 'Walk-in'} • {bill.cashier?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={bill.paymentMethod === 'khatta' ? 'accent' : 'neutral'}>{bill.paymentMethod}</Badge>
                  <span className="font-semibold">{formatINR(bill.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
