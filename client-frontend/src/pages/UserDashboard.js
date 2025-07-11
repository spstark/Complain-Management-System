import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const statusBadge = {
  Pending: 'secondary',
  'In Progress': 'warning',
  Resolved: 'success',
  Rejected: 'danger',
};

function UserDashboard() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      toast.error('Failed to fetch complaints');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/complaints', form);
      toast.success('Complaint submitted!');
      setForm({ title: '', description: '' });
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to submit complaint');
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Optionally handle error
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    toast.info('Logged out successfully');
    navigate('/');
  };

  return (
    <div
      className="min-vh-100"
      style={{
        background: 'linear-gradient(to right top, #e0eafc, #cfdef3)',
        paddingBottom: '60px',
      }}
    >
      <div className="container py-5">
        {/* 🔝 Header */}
        <div className="card shadow-lg border-0 rounded-4 mb-4 bg-primary text-white">
          <div className="card-body d-flex justify-content-between align-items-center p-4">
            <h4 className="mb-0 fw-bold">
              👋 Hello, Welcome {localStorage.getItem('username')}
            </h4>
            <button className="btn btn-danger shadow-none" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* 📥 Complaint Form */}
        <div className="card shadow-lg border-0 rounded-4 mb-5">
          <div className="card-body p-4">
            <h5 className="card-title text-primary mb-4">Submit a Complaint</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Title"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <textarea
                    className="form-control"
                    placeholder="Description"
                    rows="3"
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="col-12 d-grid">
                  <button type="submit" className="btn btn-primary btn-lg shadow-sm">
                    Submit Complaint
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* 📋 Complaints Table */}
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-body p-4">
            <h5 className="card-title text-success mb-4">📋 Your Complaints</h5>
            {complaints.length === 0 ? (
              <p className="text-muted">No complaints submitted yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Title</th>
                      <th scope="col">Department</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c._id}>
                        <td>{c.title}</td>
                        <td>{c.department}</td>
                        <td>{new Date(c.date).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          
                        })}</td>
                        <td>
                          <span className={`badge bg-${statusBadge[c.status]} px-3 py-2`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 📎 Footer */}
        <div className="text-center mt-5">
          <small className="text-muted">
            © {new Date().getFullYear()} Complaint Management System
          </small>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
