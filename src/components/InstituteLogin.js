import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/client';

function InstituteLogin({ onInstituteLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await adminLogin(email.trim(), password);
      onInstituteLogin({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user: {
          email: email.trim(),
          name: email.split('@')[0],
        },
      });
      navigate('/institute-dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="institute-login-container">
      {/* Header */}
      <div className="institute-login-header">
        <div className="institute-login-logo">
          <div className="institute-logo-circle">🏛️</div>
          <div className="institute-logo-text">
            <div className="institute-logo-brand">Winning Hub</div>
            <div className="institute-logo-tagline">EXAM MANAGEMENT SYSTEM</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="institute-login-content">
        {/* Left Section - Graphics */}
        <div className="institute-login-graphics">
          <div className="graphic-card">
            <div className="graphic-number">📊</div>
            <h3>Comprehensive Analytics</h3>
            <p>Real-time dashboards and student performance insights</p>
          </div>
          <div className="graphic-card">
            <div className="graphic-number">🎯</div>
            <h3>Exam Management</h3>
            <p>Create, configure, and manage exams with ease</p>
          </div>
          <div className="graphic-card">
            <div className="graphic-number">👥</div>
            <h3>Student Control</h3>
            <p>Manage enrollments and track student progress</p>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="institute-login-box-wrapper">
          <div className="institute-login-box">
            <div className="login-header-section">
              <h1>Institute Admin Portal</h1>
              <p>Sign in to manage your exams</p>
            </div>

            <form onSubmit={handleSubmit} className="institute-login-form">
              {/* Email Field */}
              <div className="form-group institute-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    placeholder="institute@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="institute-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group institute-form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="institute-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? '👁‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-alert">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="institute-login-btn"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <span className="spinner-mini"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>→</span>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Student Login Link */}
            <div className="institute-login-footer">
              <p>Are you a student?</p>
              <button
                type="button"
                className="student-login-link"
                onClick={() => navigate('/login')}
              >
                Student Login →
              </button>
            </div>
          </div>

          {/* Security Info */}
          <div className="security-info">
            <span className="security-icon">🔐</span>
            <p>Your credentials are securely encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstituteLogin;
