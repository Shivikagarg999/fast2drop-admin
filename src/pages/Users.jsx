import { useEffect, useState } from 'react';
import { getUsers, banUser, createUser, updateUser, deleteUser } from '../api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { Search, Plus } from 'lucide-react';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN');

const EMPTY_FORM = { name: '', email: '', password: '', mobile: '', role: 'customer' };

function UserForm({ initial = EMPTY_FORM, onSave, onCancel, isEdit }) {
  const [form, setForm] = useState(initial);
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={set('email')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={set('password')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
          <input
            value={form.mobile}
            onChange={set('mobile')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select
            value={form.role}
            onChange={set('role')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

export default function Users() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [query, setQuery]       = useState('');
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal]       = useState(null); // null | { type: 'create' | 'edit', user? }

  const load = (p = 1, q = query) => {
    setLoading(true);
    getUsers({ search: q, page: p, limit: 15 })
      .then((r) => {
        setData(r.data.data.users);
        setPagination(r.data.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
    setPage(1);
    load(1, search);
  };

  const handleBan = async (user) => {
    if (!confirm(`${user.isBanned ? 'Unban' : 'Ban'} ${user.name}?`)) return;
    try {
      await banUser(user._id);
      load(page, query);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    try {
      await deleteUser(user._id);
      load(page, query);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreate = async (form) => {
    await createUser(form);
    setModal(null);
    load(1, query);
  };

  const handleUpdate = async (form) => {
    const { password, ...payload } = form;
    await updateUser(modal.user._id, payload);
    setModal(null);
    load(page, query);
  };

  const columns = [
    { key: 'name',       label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'mobile',     label: 'Mobile',   render: (v) => v || '—' },
    { key: 'role',       label: 'Role',     render: (v) => <Badge value={v} label={v} /> },
    { key: 'isVerified', label: 'Verified', render: (v) => <Badge value={v} label={v ? 'Yes' : 'No'} /> },
    { key: 'isBanned',   label: 'Status',   render: (v) => <Badge value={!v} label={v ? 'Banned' : 'Active'} /> },
    { key: 'createdAt',  label: 'Joined',   render: (v) => fmtDate(v) },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setModal({ type: 'edit', user: row })}
            className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleBan(row)}
            className={`text-xs px-2 py-1 rounded font-medium ${
              row.isBanned
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            {row.isBanned ? 'Unban' : 'Ban'}
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, mobile…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
              Search
            </button>
          </form>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Table columns={columns} data={data} loading={loading} />
        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={pagination.totalPages || 1}
            onChange={(p) => { setPage(p); load(p, query); }}
          />
        </div>
      </div>

      {modal?.type === 'create' && (
        <Modal title="Add User" onClose={() => setModal(null)}>
          <UserForm onSave={handleCreate} onCancel={() => setModal(null)} isEdit={false} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit User" onClose={() => setModal(null)}>
          <UserForm
            initial={{ name: modal.user.name, email: modal.user.email, mobile: modal.user.mobile || '', role: modal.user.role, password: '' }}
            onSave={handleUpdate}
            onCancel={() => setModal(null)}
            isEdit
          />
        </Modal>
      )}
    </div>
  );
}
