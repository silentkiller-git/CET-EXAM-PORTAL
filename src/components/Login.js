import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin, onInstituteLogin, onSwitchToInstitute }) {
  const [userType, setUserType] = useState('student'); // 'student' or 'institute'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userType === 'student') {
      // Student login
      if (email && password) {
        const studentName = email.split('@')[0];
        onLogin({
          name: studentName.charAt(0).toUpperCase() + studentName.slice(1),
          email: email,
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        });
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-tabs">
          <button
            className={`tab-btn ${userType === 'student' ? 'active' : ''}`}
            onClick={() => setUserType('student')}
          >
            Student Login
          </button>
          <button
            className={`tab-btn ${userType === 'institute' ? 'active' : ''}`}
            onClick={() => {
              setUserType('institute');
              onSwitchToInstitute();
            }}
          >
            Institute Login
          </button>
        </div>

        <h1>CET Exam Portal</h1>
        
        {userType === 'student' && (
          <form onSubmit={handleSubmit}>
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
        )}
      </div>
    </div>
  );
}

export default Login;
