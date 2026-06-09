import { useEffect, useState } from 'react';
import { getBookings, cancelBookingApi, assignDriver, exportBookings } from '../api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import { Download } from 'lucide-react';

const fmt   = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Bookings() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters]   = useState({ status: '', vehicleType: '', paymentMethod: '', from: '', to: '' });

  const fetch = (p = 1, f = filters) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (f.status)        params.status        = f.status;
    if (f.vehicleType)   params.vehicleType   = f.vehicleType;
    if (f.paymentMethod) params.paymentMethod = f.paymentMethod;
    if (f.from)          params.from          = f.from;
    if (f.to)            params.to            = f.to;

    getBookings(params)
      .then((r) => {
        setData(r.data.data.bookings);
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

  const handleCancel = async (b) => {
    const reason = prompt(`Cancel reason for booking ${b.booking_id || b._id?.slice(-6)}:`);
    if (reason === null) return;
    try {
      await cancelBookingApi(b._id, reason);
      fetch(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleAssign = async (b) => {
    const driverId = prompt('Enter Driver ID to assign:');
    if (!driverId?.trim()) return;
    try {
      await assignDriver(b._id, driverId.trim());
      fetch(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to)   params.to   = filters.to;
      if (filters.status) params.status = filters.status;

      const res = await exportBookings(params);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `bookings_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  };

  const columns = [
    { key: 'booking_id',   label: 'Booking ID', render: (v, r) => <span className="font-mono text-xs">{v || r._id?.slice(-6)}</span> },
    { key: 'customerId',   label: 'Customer',   render: (v) => v?.name || '—' },
    { key: 'vehicleType',  label: 'Vehicle',    render: (v) => <span className="capitalize">{v?.replace('_', ' ')}</span> },
    { key: 'pickupAddress', label: 'Pickup',    render: (v) => <span className="text-xs max-w-xs truncate block">{v}</span> },
    { key: 'distanceKm',   label: 'Dist (km)' },
    { key: 'estimatedFare', label: 'Fare',      render: (v) => fmt(v) },
    { key: 'paymentMethod', label: 'Payment',   render: (v) => <Badge value={v} /> },
    { key: 'paymentStatus', label: 'Pay Status', render: (v) => <Badge value={v} /> },
    { key: 'status',       label: 'Status',     render: (v) => <Badge value={v} /> },
    { key: 'createdAt',    label: 'Date',       render: (v) => <span className="text-xs">{fmtDt(v)}</span> },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          {['pending', 'accepted'].includes(row.status) && (
            <>
              <button
                onClick={() => handleAssign(row)}
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
              >
                Assign
              </button>
              <button
                onClick={() => handleCancel(row)}
                className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const selClass = "text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className={selClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {['pending', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className={selClass} value={filters.vehicleType} onChange={(e) => setFilter('vehicleType', e.target.value)}>
          <option value="">All Vehicles</option>
          {['bike', 'three_wheeler', 'pickup_8ft', 'pickup_14ft', 'truck'].map((v) => (
            <option key={v} value={v}>{v.replace('_', ' ')}</option>
          ))}
        </select>
        <select className={selClass} value={filters.paymentMethod} onChange={(e) => setFilter('paymentMethod', e.target.value)}>
          <option value="">All Payments</option>
          <option value="cod">COD</option>
          <option value="razorpay">Razorpay</option>
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
