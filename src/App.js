import React, { useState } from 'react';
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

function App() {
  const [student, setStudent] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loginType, setLoginType] = useState('student'); // 'student' or 'institute'

  const handleSwitchToInstitute = () => {
    setLoginType('institute');
  };

  const handleSwitchToStudent = () => {
    setLoginType('student');
  };

  return (
    <Router>
      <Routes>
        {loginType === 'student' ? (
          <>
            <Route 
              path="/" 
              element={
                <Login 
                  onLogin={setStudent} 
                  onSwitchToInstitute={handleSwitchToInstitute}
                />
              } 
            />
            <Route
              path="/dashboard"
              element={student ? <Dashboard student={student} /> : <Navigate to="/" />}
            />
            <Route
              path="/instructions"
              element={student ? <Instructions student={student} /> : <Navigate to="/" />}
            />
            <Route
              path="/test"
              element={student ? <TestPage student={student} /> : <Navigate to="/" />}
            />
            <Route
              path="/submitted"
              element={student ? <TestSubmitted student={student} /> : <Navigate to="/" />}
            />
          </>
        ) : (
          <>
            <Route 
              path="/" 
              element={
                <InstituteLogin 
                  onInstituteLogin={setInstitute}
                  onSwitchToStudent={handleSwitchToStudent}
                />
              } 
            />
            <Route
              path="/institute-dashboard"
              element={institute ? <InstituteDashboard institute={institute} /> : <Navigate to="/" />}
            />
            <Route
              path="/create-test"
              element={institute ? <CreateTest institute={institute} /> : <Navigate to="/" />}
            />
            <Route
              path="/manage-slots"
              element={institute ? <ManageSlots institute={institute} /> : <Navigate to="/" />}
            />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
