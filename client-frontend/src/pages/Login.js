import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/auth/login', form);
      const { token, role, username } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);

      // Remember Me Logic
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success(`Welcome, ${username}!`);

      if (role === 'admin') navigate('/admin');
      else if (role === 'employee') navigate('/user');
      else {
        toast.error('Unknown role. Contact administrator.');
        localStorage.clear();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Password reset email sent!');
      setShowForgot(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center vh-100"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=1350&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <h1 className="text-white mb-4 fw-bold text-center">Complaint Management System</h1>

      <div className="card p-4 shadow-lg rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-3">
          <img
            src="https://img.icons8.com/ios-filled/100/007BFF/user-male-circle.png"
            alt="User Icon"
            width="60"
            className="mb-2"
          />
          <h4 className="fw-bold text-primary">Employee Login</h4>
          <p className="text-muted small">Please enter your credentials</p>
        </div>

        {!showForgot ? (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              className="form-control mb-3"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="input-group mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <span
                className="input-group-text bg-light"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </span>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input shadow-none focus-ring-0"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label " htmlFor="rememberMe">
                Remember Me
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
            <div className="text-center mt-3">
              <button type="button" className="btn btn-link p-0" onClick={() => setShowForgot(true)}>
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgot}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
              />
            </div>
            <button className="btn btn-primary w-100 mb-2">Send Reset Link</button>
            <div className="text-center">
              <button type="button" className="btn btn-link p-0" onClick={() => setShowForgot(false)}>
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-3">
          <small className="text-muted">
            © {new Date().getFullYear()} Complaint Management System
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
