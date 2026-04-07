import React, { useMemo, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import InstituteLogin from './components/InstituteLogin';
import Dashboard from './components/Dashboard';
import InstituteDashboard from './components/InstituteDashboard';
import Instructions from './components/Instructions';
import TestPage from './components/TestPage';
import TestSubmitted from './components/TestSubmitted';
import CreateTest from './components/CreateTest';
import ManageSlots from './components/ManageSlots';
import QuestionUpload from './components/QuestionUpload';
import SingleQuestionUpload from './components/SingleQuestionUpload';
import ExamSetupWizard from './components/ExamSetupWizard';
import SectionSetup from './components/SectionSetup';
import { clearAuthState, getAuthState, setAuthState } from './api/client';

function App() {
  const [auth, setAuth] = useState(() => getAuthState());

  // Validate auth state on mount to prevent stale tokens
  useEffect(() => {
    if (auth?.access_token) {
      // Check if token looks expired (JWT might be old)
      try {
        const parts = auth.access_token.split('.');
        if (parts.length === 3) {
          // Decode JWT payload to check expiration
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000; // Convert to milliseconds
          if (Date.now() > exp) {
            // Token expired, clear it
            console.log('[Auth] Token expired, clearing auth state');
            clearAuthState();
            setAuth(null);
          }
        }
      } catch (err) {
        console.error('[Auth] Error validating token:', err);
        clearAuthState();
        setAuth(null);
      }
    }
  }, [auth?.access_token]);

  const handleStudentLogin = (loginPayload) => {
    const next = {
      ...loginPayload,
      role: 'student',
    };
    setAuth(next);
    setAuthState(next);
  };

  const handleAdminLogin = (loginPayload) => {
    const next = {
      ...loginPayload,
      role: 'admin',
    };
    setAuth(next);
    setAuthState(next);
  };

  const handleLogout = () => {
    clearAuthState();
    setAuth(null);
  };

  const isStudent = auth?.role === 'student';
  const isAdmin = auth?.role === 'admin';

  const homeRedirect = useMemo(() => {
    if (isStudent) return '/dashboard';
    if (isAdmin) return '/institute-dashboard';
    return '/login';
  }, [isStudent, isAdmin]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={homeRedirect} replace />} />
        <Route
          path="/login"
          element={
            isStudent ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleStudentLogin} />
            )
          }
        />
        <Route
          path="/admin/login"
          element={
            isAdmin ? (
              <Navigate to="/institute-dashboard" replace />
            ) : (
              <InstituteLogin onInstituteLogin={handleAdminLogin} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={isStudent ? <Dashboard student={auth.user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/instructions"
          element={isStudent ? <Instructions student={auth.user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/test"
          element={isStudent ? <TestPage student={auth.user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/submitted"
          element={isStudent ? <TestSubmitted student={auth.user} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/institute-dashboard"
          element={isAdmin ? <InstituteDashboard institute={auth.user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/create-test"
          element={isAdmin ? <CreateTest institute={auth.user} /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/manage-slots"
          element={isAdmin ? <ManageSlots institute={auth.user} /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/upload-questions/:examId"
          element={isAdmin ? <QuestionUpload /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/upload-single-question/:examId"
          element={isAdmin ? <SingleQuestionUpload /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/exam-setup/:examId"
          element={isAdmin ? <ExamSetupWizard /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/exam-sections/:examId"
          element={isAdmin ? <SectionSetup /> : <Navigate to="/admin/login" replace />}
        />

        <Route path="*" element={<Navigate to={homeRedirect} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
