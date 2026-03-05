import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ManageSlots({ institute }) {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [slotData, setSlotData] = useState({
    testName: '',
    date: '',
    startTime: '',
    endTime: '',
    maxStudents: 100,
    location: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSlotData({
      ...slotData,
      [name]: name === 'maxStudents' ? parseInt(value) : value,
    });
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    const newSlot = {
      id: 'SLOT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      ...slotData,
      registeredStudents: 0,
      status: 'scheduled',
    };
    setSlots([...slots, newSlot]);
    setSlotData({
      testName: '',
      date: '',
      startTime: '',
      endTime: '',
      maxStudents: 100,
      location: '',
    });
    setShowForm(false);
    alert('Exam slot created successfully!');
  };

  const handleDeleteSlot = (id) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      setSlots(slots.filter(slot => slot.id !== id));
    }
  };

  return (
    <div className="form-container">
      <div className="form-box">
        <h1>Manage Exam Slots</h1>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          + Add New Slot
        </button>

        {showForm && (
          <form onSubmit={handleAddSlot} className="slot-form">
            <h3>Create Exam Slot</h3>
            
            <div className="form-group">
              <label htmlFor="testName">Test Name</label>
              <input
                type="text"
                id="testName"
                name="testName"
                placeholder="Enter test name"
                value={slotData.testName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Exam Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={slotData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={slotData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={slotData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxStudents">Max Students</label>
                <input
                  type="number"
                  id="maxStudents"
                  name="maxStudents"
                  min="1"
                  value={slotData.maxStudents}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Exam center location"
                  value={slotData.location}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="create-btn">
                Create Slot
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="slots-list">
          <h3>Scheduled Exam Slots ({slots.length})</h3>
          {slots.length === 0 ? (
            <p>No exam slots created yet.</p>
          ) : (
            <table className="slots-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.testName}</td>
                    <td>{slot.date}</td>
                    <td>{slot.startTime} - {slot.endTime}</td>
                    <td>{slot.location}</td>
                    <td>{slot.maxStudents}</td>
                    <td>{slot.registeredStudents}</td>
                    <td><span className="status-badge">{slot.status}</span></td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button className="back-btn" onClick={() => navigate('/institute-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ManageSlots;
