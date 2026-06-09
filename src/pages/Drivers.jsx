import { useEffect, useState } from 'react';
import { getDrivers, approveDriver, toggleDriver, createDriver, updateDriver, deleteDriver } from '../api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { Plus, Search } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN');

const VEHICLE_TYPES = ['bike', 'three_wheeler', 'pickup_8ft', 'pickup_14ft', 'truck'];

const EMPTY_CREATE = {
  name: '', email: '', password: '', mobile: '',
  drivingLicenseNumber: '', aadharNumber: '',
  vehicleType: '', vehicleNumber: '', capacityKg: '',
};

function CreateDriverForm({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.vehicleType) { delete payload.vehicleType; delete payload.vehicleNumber; delete payload.capacityKg; }
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input required value={form.name} onChange={set('name')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input required type="email" value={form.email} onChange={set('email')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
          <input required type="password" value={form.password} onChange={set('password')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
          <input value={form.mobile} onChange={set('mobile')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Documents</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">DL Number</label>
          <input value={form.drivingLicenseNumber} onChange={set('drivingLicenseNumber')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aadhar Number</label>
          <input value={form.aadharNumber} onChange={set('aadharNumber')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Vehicle (optional)</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
          <select value={form.vehicleType} onChange={set('vehicleType')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">None</option>
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label>
          <input value={form.vehicleNumber} onChange={set('vehicleNumber')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Capacity (kg)</label>
          <input type="number" value={form.capacityKg} onChange={set('capacityKg')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Create Driver'}
        </button>
      </div>
    </form>
  );
}

function EditDriverForm({ driver, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:                 driver.userId?.name || '',
    mobile:               driver.userId?.mobile || '',
    drivingLicenseNumber: driver.drivingLicenseNumber || '',
    aadharNumber:         driver.aadharNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input value={form.name} onChange={set('name')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
          <input value={form.mobile} onChange={set('mobile')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">DL Number</label>
          <input value={form.drivingLicenseNumber} onChange={set('drivingLicenseNumber')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aadhar Number</label>
          <input value={form.aadharNumber} onChange={set('aadharNumber')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Driver'}
        </button>
      </div>
    </form>
  );
}

export default function Drivers() {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters]     = useState({ approved: '', online: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [modal, setModal]         = useState(null); // null | { type: 'create' | 'edit', driver? }

  const load = (p = 1, f = filters) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (f.approved !== '') params.approved = f.approved;
    if (f.online !== '')   params.online   = f.online;
    if (f.search)          params.search   = f.search;

    getDrivers(params)
      .then((r) => {
        setData(r.data.data.drivers);
        setPagination(r.data.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (key, val) => {
    const f = { ...filters, [key]: val };
    setFilters(f);
    setPage(1);
    load(1, f);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const f = { ...filters, search: searchInput };
    setFilters(f);
    setPage(1);
    load(1, f);
  };

  const handleApprove = async (driver, val) => {
    if (!confirm(`${val ? 'Approve' : 'Reject'} driver ${driver.userId?.name}?`)) return;
    try {
      await approveDriver(driver._id, val);
      load(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleToggle = async (driver) => {
    if (!confirm(`${driver.isApproved ? 'Disable' : 'Enable'} driver ${driver.userId?.name}?`)) return;
    try {
      await toggleDriver(driver._id);
      load(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (driver) => {
    if (!confirm(`Delete driver ${driver.userId?.name}? This cannot be undone.`)) return;
    try {
      await deleteDriver(driver._id);
      load(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreate = async (form) => {
    await createDriver(form);
    setModal(null);
    load(1, filters);
  };

  const handleUpdate = async (form) => {
    await updateDriver(modal.driver._id, form);
    setModal(null);
    load(page, filters);
  };

  const columns = [
    { key: 'userId',     label: 'Name',     render: (v) => v?.name || '—' },
    { key: 'userId',     label: 'Email',    render: (v) => v?.email || '—' },
    { key: 'userId',     label: 'Mobile',   render: (v) => v?.mobile || '—' },
    { key: 'rating',     label: 'Rating',   render: (v) => `⭐ ${v?.toFixed(1) || '0.0'}` },
    { key: 'totalTrips', label: 'Trips' },
    { key: 'isOnline',   label: 'Online',   render: (v) => <Badge value={v} label={v ? 'Online' : 'Offline'} /> },
    { key: 'isApproved', label: 'Approved', render: (v) => <Badge value={v} label={v ? 'Yes' : 'Pending'} /> },
    { key: 'createdAt',  label: 'Joined',   render: (v) => fmtDate(v) },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setModal({ type: 'edit', driver: row })}
            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
          >
            Edit
          </button>
          {!row.isApproved && (
            <>
              <button onClick={() => handleApprove(row, true)}
                className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">
                Approve
              </button>
              <button onClick={() => handleApprove(row, false)}
                className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium">
                Reject
              </button>
            </>
          )}
          {row.isApproved && (
            <button onClick={() => handleToggle(row)}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
              {row.isOnline ? 'Disable' : 'Enable'}
            </button>
          )}
          <button onClick={() => handleDelete(row)}
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Drivers</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Search
            </button>
          </form>
          <select
            value={filters.approved}
            onChange={(e) => handleFilter('approved', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Approval</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
          <select
            value={filters.online}
            onChange={(e) => handleFilter('online', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Status</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <Plus size={15} /> Add Driver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Table columns={columns} data={data} loading={loading} />
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={pagination.totalPages || 1}
            onChange={(p) => { setPage(p); load(p); }}
          />
        </div>
      </div>

      {modal?.type === 'create' && (
        <Modal title="Add Driver" onClose={() => setModal(null)} width="max-w-2xl">
          <CreateDriverForm onSave={handleCreate} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Driver" onClose={() => setModal(null)}>
          <EditDriverForm driver={modal.driver} onSave={handleUpdate} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
