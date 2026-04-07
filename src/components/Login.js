import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentLogin } from '../api/client';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await studentLogin(username.trim(), password);
      onLogin({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          username: username.trim(),
          name: username.trim(),
        },
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-header">
        <div className="student-login-logo">
          <div className="logo-icon">🔒</div>
          <div className="logo-text">
            <div className="logo-brand">Winning Hub</div>
            <div className="logo-subtitle">SECURE EXAM PORTAL</div>
          </div>
        </div>
      </div>
      
      <div className="student-login-content">
        <div className="student-login-box">
          <h1>Student Login</h1>
          <p className="login-subtitle">Enter your credentials to access the exam</p>

          <form onSubmit={handleSubmit} className="student-login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="student-login-btn" disabled={loading}>
              {loading ? '⏳ Logging in...' : 'LOGIN TO EXAM'}
            </button>
          </form>

          <div className="login-footer">
            <p>Are you an institute admin? 
              <button
                type="button"
                className="switch-to-admin-btn"
                onClick={() => navigate('/admin/login')}
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
