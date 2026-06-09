import { useEffect, useState } from 'react';
import { getPayments, markCODPaid, refundPayment } from '../api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

const fmt   = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Payments() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters]   = useState({ method: '', status: '', from: '', to: '' });

  const fetch = (p = 1, f = filters) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (f.method) params.method = f.method;
    if (f.status) params.status = f.status;
    if (f.from)   params.from   = f.from;
    if (f.to)     params.to     = f.to;

    getPayments(params)
      .then((r) => {
        setData(r.data.data.payments);
        setPagination(r.data.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const setFilter = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    setPage(1);
    fetch(1, f);
  };

  const handleMarkPaid = async (payment) => {
    if (!confirm(`Mark COD payment of ${fmt(payment.amount)} as collected?`)) return;
    try {
      await markCODPaid(payment._id);
      fetch(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleRefund = async (payment) => {
    const amtStr = prompt(`Refund amount in ₹ (leave blank for full refund of ${fmt(payment.amount)}):`);
    if (amtStr === null) return;
    const amt = amtStr.trim() ? Number(amtStr) : null;
    if (amtStr.trim() && (!amt || amt <= 0)) { alert('Invalid amount'); return; }
    try {
      await refundPayment(payment._id, amt);
      fetch(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Refund failed');
    }
  };

  const columns = [
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (v) => <span className="font-mono text-xs">{v?.booking_id || v?._id?.slice(-6) || '—'}</span>,
    },
    { key: 'customerId', label: 'Customer',  render: (v) => v?.name || '—' },
    { key: 'amount',     label: 'Amount',    render: (v) => fmt(v) },
    { key: 'method',     label: 'Method',    render: (v) => <Badge value={v} /> },
    { key: 'status',     label: 'Status',    render: (v) => <Badge value={v} /> },
    { key: 'razorpayPaymentId', label: 'Razorpay ID', render: (v) => v ? <span className="font-mono text-xs text-gray-400">{v.slice(-10)}</span> : '—' },
    { key: 'createdAt',  label: 'Date',      render: (v) => <span className="text-xs">{fmtDt(v)}</span> },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          {row.method === 'cod' && row.status === 'pending' && (
            <button
              onClick={() => handleMarkPaid(row)}
              className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium"
            >
              Mark Paid
            </button>
          )}
          {row.method === 'razorpay' && row.status === 'paid' && (
            <button
              onClick={() => handleRefund(row)}
              className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium"
            >
              Refund
            </button>
          )}
        </div>
      ),
    },
  ];

  const selClass = "text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Payments</h1>

      <div className="flex flex-wrap gap-3">
        <select className={selClass} value={filters.method} onChange={(e) => setFilter('method', e.target.value)}>
          <option value="">All Methods</option>
          <option value="cod">COD</option>
          <option value="razorpay">Razorpay</option>
        </select>
        <select className={selClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {['pending', 'paid', 'failed', 'refunded'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" className={selClass} value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
        <input type="date" className={selClass} value={filters.to}   onChange={(e) => setFilter('to', e.target.value)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Table columns={columns} data={data} loading={loading} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={pagination.totalPages || 1} onChange={(p) => { setPage(p); fetch(p); }} />
        </div>
      </div>
    </div>
  );
}
