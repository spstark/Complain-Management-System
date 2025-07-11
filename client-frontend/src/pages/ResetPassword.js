import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { toast } from 'react-toastify';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Password reset successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow p-4" style={{ minWidth: 350 }}>
        <h3 className="mb-4 text-primary text-center">Reset Password</h3>
        {success ? (
          <div className="text-center">
            <p className="text-success mb-3">Your password has been reset.</p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="New password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-100" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
