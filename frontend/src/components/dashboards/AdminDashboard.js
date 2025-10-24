import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../layouts/DashboardLayout';
import WeatherGlobalOverview from './WeatherGlobalOverview';
import WorldWeatherFleetMap from './WorldWeatherFleetMap';
import { useAuth } from '../../context/AuthContext';
import UserProfileModal from '../UserProfileModal.jsx';

// Roles supported by backend
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'ship_management', label: 'Ship Management' },
  { value: 'owner', label: 'Owner' },
  { value: 'surveyor', label: 'Surveyor' },
  { value: 'cargo_manager', label: 'Cargo Manager' },
  { value: 'user', label: 'User' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile modal state
  const [showProfile, setShowProfile] = useState(false);

  // Modal/form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null => create
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'owner', status: 'active' });

  // Simple local search + sorting
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('created_desc'); // default: newest first

  const filteredUsers = useMemo(() => {
    // Filter
    let data = users;
    if (query) {
      const q = query.toLowerCase();
      data = users.filter(u => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
    }

    // Sort helpers
    const toTime = (d) => (d ? new Date(d).getTime() : 0);
    const byRole = (a, b) => (a.role || '').localeCompare(b.role || '') || (a.name || '').localeCompare(b.name || '');
    const byActive = (a, b) => toTime(b.lastLoginAt) - toTime(a.lastLoginAt); // recent login first
    const byCreatedDesc = (a, b) => toTime(b.createdAt) - toTime(a.createdAt);
    const byCreatedAsc = (a, b) => toTime(a.createdAt) - toTime(b.createdAt);

    const sorter =
      sortKey === 'role' ? byRole :
      sortKey === 'active' ? byActive :
      sortKey === 'created_asc' ? byCreatedAsc :
      byCreatedDesc; // default

    return [...data].sort(sorter);
  }, [users, query, sortKey]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/users');
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      fetchUsers();
    }
  }, [authLoading, user]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'owner', status: 'active' });
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // optional on update
      role: user.role || 'owner',
      status: user.status || 'active'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'owner', status: 'active' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      if (editingUser) {
        // Update
        const id = editingUser._id || editingUser.id;
        const payload = { name: form.name, email: form.email, role: form.role, status: form.status };
        if (form.password) payload.password = form.password; // optional
        await axios.put(`/api/users/${id}`, payload);
        setSuccess('User updated');
      } else {
        // Create
        if (!form.password || form.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await axios.post('/api/users', form);
        setSuccess('User created');
      }
      closeModal();
      await fetchUsers();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Save failed');
    }
  };

  const deleteUser = async (user) => {
    const id = user._id || user.id;
    if (!id) return;
    if (!window.confirm(`Delete user ${user.name}?`)) return;
    try {
      setError('');
      setSuccess('');
      await axios.delete(`/api/users/${id}`);
      setSuccess('User deleted');
      await fetchUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  const formatDate = (d) => {
    try {
      if (!d) return '-';
      return new Date(d).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" description="Manage users, settings, and system analytics." onProfileClick={() => setShowProfile(s => !s)}>
      <div className="space-y-6">
        {/* Weather Intelligence Overview */}
        <WeatherGlobalOverview apiConnected={true} lastFetchLabel="2 mins ago" uptimePercent={99.8} />
        {/* Interactive World Map */}
        <WorldWeatherFleetMap
          alerts={[
            { type: 'storm', lat: 22.3, lng: 114.2, location: 'Hong Kong', severity: 'High' },
            { type: 'high-wind', lat: 35.7, lng: 139.7, location: 'Tokyo Bay', severity: 'Medium' },
            { type: 'fog', lat: 51.5, lng: -0.1, location: 'Thames Estuary', severity: 'Low' },
          ]}
          ships={[
            { id: 'v1', name: 'Blue Marlin', imo: '1234567', status: 'In Transit', lat: 37.7749, lng: -122.4194 },
            { id: 'v2', name: 'Sea Voyager', imo: '7654321', status: 'In Port', lat: 1.3521, lng: 103.8198 },
          ]}
        />

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-700">{success}</div>
        )}

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500">Manage system users and their permissions</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
              title="Sort users"
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="role">Role (A–Z)</option>
              <option value="active">Most active</option>
            </select>
            <button onClick={openCreate} disabled={user?.role !== 'admin'} className="inline-flex items-center px-3 py-2 rounded-md bg-marine-blue text-white text-sm hover:bg-marine-dark disabled:opacity-50 disabled:cursor-not-allowed">
              + Add User
            </button>
          </div>
        </div>

        {/* Profile Modal */}
        <UserProfileModal
          open={showProfile}
          onClose={() => setShowProfile(false)}
          user={{
            name: user?.name || 'Admin User',
            email: user?.email || 'admin@example.com',
            role: user?.role || 'admin',
            status: user?.status || 'active',
          }}
          variant="sidebar"
          title="My Profile"
        />

        {/* Users table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 break-all">{user._id || user.id || '-'}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-marine-blue to-marine-light flex items-center justify-center">
                            <span className="text-white font-medium">{(user.name || '?').charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {(user.role || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => openEdit(user)} className="text-marine-blue hover:text-marine-dark mr-3">Edit</button>
                        <button onClick={() => deleteUser(user)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{editingUser ? 'Edit User' : 'Add User'}</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <form onSubmit={saveUser} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password {editingUser ? <span className="text-gray-400">(leave blank to keep unchanged)</span> : null}</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
                    placeholder={editingUser ? '••••••••' : 'At least 6 characters'}
                    {...(editingUser ? {} : { required: true })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-marine-blue"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-3 py-2 text-sm rounded-md bg-marine-blue text-white hover:bg-marine-dark">
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* System settings and status sections can remain below if needed */}
      </div>
    </DashboardLayout>
  );
}