import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaClipboardList, FaChartPie, FaSignOutAlt, FaBug, FaEdit, FaTrash } from 'react-icons/fa';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function AdminDashboard() {
  const [form, setForm] = useState({ username: '', email: '', password: '', department: '' });
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState({ status: '', department: '', date: '' });
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeSection, setActiveSection] = useState('user');
  const navigate = useNavigate();

  const statusBadge = {
    Pending: 'secondary',
    'In Progress': 'warning',
    Resolved: 'success',
    Rejected: 'danger',
  };

  useEffect(() => {
    fetchUsers();
    fetchComplaints();
    fetchLogs();
    fetchStats();

    // Socket.IO for real-time logs
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
    socket.on('log_update', (newLog) => {
      setLogs((prevLogs) => [newLog.trim(), ...prevLogs.slice(0, 19)]); // keep max 20 logs
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to fetch users');
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await API.get('/complaints');
      setComplaints(res.data);
    } catch {
      toast.error('Failed to fetch complaints');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get('/admin/logs');
      setLogs(res.data?.logs || []);
    } catch {
      toast.error('Failed to fetch logs');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data || {});
    } catch {
      toast.error('Failed to fetch analytics');
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Optionally handle error
    }
    localStorage.clear();
    toast.info('Logged out successfully');
    navigate('/');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/create-user', form);
      toast.success(`User '${form.username}' created`);
      setForm({ username: '', email: '', password: '', department: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    try {
      await API.put(`/admin/users/${editUser._id}`, editUser);
      toast.success('User updated');
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.patch(`/complaints/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchComplaints();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await API.delete(`/complaints/${id}`);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch {
      toast.error('Failed to delete complaint');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const statusMatch = filter.status ? c.status === filter.status : true;
    const deptMatch = filter.department ? c.department === filter.department : true;
    const dateMatch = filter.date
      ? (c.date && new Date(c.date).toISOString().slice(0, 10) === filter.date)
      : true;
    const searchMatch = search
      ? (c.title?.toLowerCase().includes(search.toLowerCase()))
      : true;
    return statusMatch && deptMatch && dateMatch && searchMatch;
  });

  // Get unique departments for dropdown
  const departmentOptions = Array.from(new Set(complaints.map(c => c.department))).filter(Boolean);

  // Sidebar items (exclude logout)
  const sidebarItems = [
    { key: 'user', label: 'User Management', icon: <FaUserPlus /> },
    { key: 'analytics', label: 'Analytics Overview', icon: <FaChartPie /> },
    { key: 'logs', label: 'Recent Logs', icon: <FaClipboardList /> },
    { key: 'complaints', label: 'Complaint Management', icon: <FaBug /> },
  ];

  return (
    <div className="container-fluid min-vh-100 bg-light">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-2 d-none d-md-block bg-white sidebar border-end min-vh-100 p-0" style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="position-sticky pt-4">
              <h4 className="text-center text-primary mb-4">Complaint Admin</h4>
              <ul className="nav flex-column">
                {sidebarItems.map(item => (
                  <li className="nav-item mb-2" key={item.key}>
                    <button
                      className={`nav-link w-100 text-start ${activeSection === item.key ? 'active bg-primary text-white' : 'text-dark'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: 'none' }}
                      onClick={() => setActiveSection(item.key)}
                    >
                      <span style={{ fontSize: 18 }}>{item.icon}</span> <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mb-4 d-flex justify-content-center">
            <button className="btn btn-danger w-100" onClick={handleLogout} style={{ maxWidth: 180 }}>
              <FaSignOutAlt className="me-2" /> Logout
            </button>
          </div>
        </nav>
        {/* Main Content */}
        <main className="col-md-10 ms-sm-auto px-md-5 py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="text-primary"><FaChartPie className="me-2" />Admin Dashboard</h3>
          </div>
          {/* User Management Panel */}
          {activeSection === 'user' && (
            <div className="card shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h5 className="text-success mb-4"><FaUserPlus className="me-2" />User Management</h5>
                <form onSubmit={handleAddUser} className="row g-2 mb-3">
                  <div className="col-md-3"><input className="form-control" placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="col-md-3"><input type="password" className="form-control" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                  <div className="col-md-2"><select className="form-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                    <option value="">Department</option>
                    <option value="IT">IT</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="General">General</option>
                  </select></div>
                  <div className="col-md-1 d-grid"><button className="btn btn-primary">Add</button></div>
                </form>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle rounded">
                    <thead className="table-light">
                      <tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id}>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.role === 'admin' ? 'Admin' : 'Employee'}</td>
                          <td>
                            {user.role !== 'admin' && (
                              <button className="btn btn-info btn-sm me-2 text-white" onClick={() => setEditUser(user)}><FaEdit /></button>
                            )}
                            {user.role !== 'admin' && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user._id)}><FaTrash /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {editUser && (
                  <div className="mt-3 border-top pt-3">
                    <h6>Edit User</h6>
                    <div className="row g-2">
                      <div className="col-md-4"><input className="form-control" value={editUser.username} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })} /></div>
                      <div className="col-md-4"><input className="form-control" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} /></div>
                      <div className="col-md-2 d-grid"><button className="btn btn-primary" onClick={handleEditUser}>Update</button></div>
                      <div className="col-md-2 d-grid"><button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Analytics Overview Panel */}
          {activeSection === 'analytics' && stats && (
            <div className="card shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h5 className="text-primary mb-4"><FaChartPie className="me-2" />Analytics Overview</h5>
                {/* Charts */}
                <div className="row mb-4">
                  <div className="col-md-6 mb-4 mb-md-0">
                    <h6 className="text-center">Complaints by Status</h6>
                    <Pie
                      data={{
                        labels: Object.keys(stats.statusCounts || {}),
                        datasets: [
                          {
                            data: Object.values(stats.statusCounts || {}),
                            backgroundColor: [
                              '#f59e42', // Pending
                              '#fbbf24', // In Progress
                              '#22c55e', // Resolved
                              '#ef4444', // Rejected
                              '#64748b', // Other
                            ],
                          },
                        ],
                      }}
                      options={{ plugins: { legend: { position: 'bottom' } } }}
                    />
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-center">Complaints by Department</h6>
                    <Bar
                      data={{
                        labels: Object.keys(stats.departmentCounts || {}),
                        datasets: [
                          {
                            label: 'Complaints',
                            data: Object.values(stats.departmentCounts || {}),
                            backgroundColor: '#2563eb',
                          },
                        ],
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { precision:0 } } },
                      }}
                    />
                  </div>
                </div>
                {/* Existing analytics content */}
                <div className="row mb-3 text-center">
                  <div className="col-md-3">
                    <div className="bg-light p-3 rounded shadow-sm">
                      <h6>Total Complaints</h6>
                      <h4>{stats.totalComplaints}</h4>
                    </div>
                  </div>
                  {Object.entries(stats.statusCounts || {}).map(([status, count]) => (
                    <div className="col-md-2" key={status}>
                      <div className={`text-white p-3 rounded shadow-sm bg-${statusBadge[status] || 'secondary'}`}
                        style={{ fontWeight: 500 }}>
                        <h6>{status}</h6>
                        <h5>{count}</h5>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-muted">By Department</h6>
                    <ul className="list-group">
                      {Object.entries(stats.departmentCounts || {}).map(([dept, count]) => (
                        <li key={dept} className="list-group-item d-flex justify-content-between align-items-center">
                          {dept} <span className="badge bg-dark rounded-pill">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted">Top Users</h6>
                    <ul className="list-group">
                      {(stats.mostActiveUsers || []).map((user) => (
                        <li key={user.username} className="list-group-item d-flex justify-content-between align-items-center">
                          {user.username} <span className="badge bg-info rounded-pill">{user.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Logs Panel */}
          {activeSection === 'logs' && (
            <div className="card shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h5 className="mb-4"><FaClipboardList className="me-2" />Recent Logs</h5>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <ul className="list-group">
                    {logs.length > 0 ? logs.map((line, idx) => (
                      <li key={idx} className="list-group-item small text-monospace">{line}</li>
                    )) : (
                      <li className="list-group-item">No logs found.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* Complaint Management Panel */}
          {activeSection === 'complaints' && (
            <div className="card shadow-sm rounded-4 mb-4">
              <div className="card-body">
                <h5 className="text-danger mb-4"><FaBug className="me-2" />Complaint Management</h5>
                {/* Search Bar and Filters */}
                <div className="row mb-3">
                  <div className="col-md-4 mb-2 mb-md-0">
                    <input
                      className="form-control"
                      placeholder="Search complaints by title..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <select className="form-select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                      <option value="">Filter by Status</option>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select className="form-select" value={filter.department} onChange={e => setFilter({ ...filter, department: e.target.value })}>
                      <option value="">Filter by Department</option>
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="date"
                      className="form-control"
                      value={filter.date}
                      onChange={e => setFilter({ ...filter, date: e.target.value })}
                      placeholder="Filter by Date"
                    />
                  </div>
                </div>
                {(filter.status || filter.department || filter.date) && (
                  <div className="alert alert-info d-flex justify-content-between align-items-center">
                    <div>
                      {filter.status && <span>Status: <strong>{filter.status}</strong> </span>}
                      {filter.department && <span>Department: <strong>{filter.department}</strong></span>}
                      {filter.date && <span>Date: <strong>{filter.date}</strong></span>}
                    </div>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => setFilter({ status: '', department: '', date: '' })}>Clear Filters</button>
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover text-center align-middle rounded">
                    <thead className="table-light">
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>User</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c) => (
                        <tr key={c._id}>
                          <td>{c.title}</td>
                          <td>{c.description}</td>
                          <td>{c.department}</td>
                          <td>{new Date(c.date).toLocaleDateString('en-GB')}</td>
                          <td><span className={`badge bg-${statusBadge[c.status] || 'secondary'}`}>{c.status}</span></td>
                          <td>{c.createdBy?.username || 'N/A'}</td>
                          <td>
                            <select className="form-select mb-2" value={c.status} onChange={(e) => handleStatusChange(c._id, e.target.value)}>
                              {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <button className="btn btn-outline-danger btn-sm w-100" onClick={() => handleDeleteComplaint(c._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredComplaints.length === 0 && <p className="text-muted text-center">No complaints found.</p>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
