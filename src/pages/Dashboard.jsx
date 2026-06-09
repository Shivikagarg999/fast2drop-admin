import { useEffect, useState } from 'react';
import { getDashboard, getRevenueAnalytics } from '../api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Package, Users, Truck, AlertCircle } from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function Dashboard() {
  const [dash, setDash]       = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [period, setPeriod]   = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboard(), getRevenueAnalytics(period)])
      .then(([d, r]) => {
        setDash(d.data.data);
        setRevenue(r.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;

  const revenueByDay = (revenue?.byDay || []).map((d) => ({
    day: d._id?.slice(5),
    revenue: d.revenue,
  }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Bookings Today"
          value={dash.today.bookings}
          sub={`${dash.today.completed} completed · ${dash.today.cancelled} cancelled`}
          color="indigo"
          icon={Package}
        />
        <StatCard
          label="Revenue Today"
          value={fmt(dash.today.revenue)}
          color="green"
          icon={Package}
        />
        <StatCard
          label="Active Drivers"
          value={dash.totals.activeDrivers}
          sub={`${dash.totals.drivers} total registered`}
          color="blue"
          icon={Truck}
        />
        <StatCard
          label="Pending Approvals"
          value={dash.totals.pendingDriverApprovals}
          sub="new driver docs to review"
          color="amber"
          icon={AlertCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Revenue by Day</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByDay} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => fmt(v)} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Bookings by Vehicle Type</h2>
          {dash.bookingsByVehicleType?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dash.bookingsByVehicleType}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {dash.bookingsByVehicleType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 text-sm py-10">No data</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Recent Bookings</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Booking ID', 'Customer', 'Vehicle', 'Fare', 'Payment', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dash.recentBookings || []).map((b) => (
              <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{b.booking_id || b._id?.slice(-6)}</td>
                <td className="py-2.5 px-3">{b.customerId?.name || '—'}</td>
                <td className="py-2.5 px-3 capitalize">{b.vehicleType?.replace('_', ' ')}</td>
                <td className="py-2.5 px-3">{fmt(b.estimatedFare)}</td>
                <td className="py-2.5 px-3"><Badge value={b.paymentMethod} /></td>
                <td className="py-2.5 px-3"><Badge value={b.status} /></td>
                <td className="py-2.5 px-3 text-gray-400">{fmtDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
