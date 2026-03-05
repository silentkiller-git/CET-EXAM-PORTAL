import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function InstituteLogin({ onInstituteLogin, onSwitchToStudent }) {
  const [instituteName, setInstituteName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock authentication
    if (instituteName && email && password) {
      onInstituteLogin({
        name: instituteName,
        email: email,
        id: 'INST-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        role: 'institute',
      });
      navigate('/institute-dashboard');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Institute Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="institute">Institute Name</label>
            <input
              type="text"
              id="institute"
              placeholder="Enter institute name"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
          </div>
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <p className="switch-login">
          <button
            type="button"
            className="switch-btn"
            onClick={onSwitchToStudent}
          >
            Student Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default InstituteLogin;
