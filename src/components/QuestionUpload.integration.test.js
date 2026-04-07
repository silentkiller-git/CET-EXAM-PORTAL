import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import InstituteDashboard from './InstituteDashboard';
import QuestionUpload from './QuestionUpload';

function mockJsonResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: {
      get: () => 'application/json',
    },
    json: () => Promise.resolve(payload),
  };
}

function renderUploadPage() {
  return render(
    <MemoryRouter initialEntries={['/upload-questions/test-exam-id-123']}>
      <Routes>
        <Route path="/upload-questions/:examId" element={<QuestionUpload />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Question Upload Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('renders upload page through router path', async () => {
    renderUploadPage();
    expect(screen.getByText(/Bulk Upload Questions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select CSV File/i)).toBeInTheDocument();
  });

  test('dashboard shows upload questions action when exams are loaded', async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockJsonResponse([
          { id: 'exam-1', name: 'JEE Main 2024', status: 'draft' },
        ])
      )
      .mockResolvedValueOnce(mockJsonResponse({ total_enrolled: 10, in_progress: 1, completed: 0, not_started: 9, completion_pct: 0 }));

    render(
      <MemoryRouter>
        <InstituteDashboard institute={{ name: 'Admin' }} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/JEE Main 2024/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upload Questions/i })).toBeInTheDocument();
    });
  });

  test('downloads template from backend endpoint', async () => {
    const blob = new Blob(['a,b,c'], { type: 'text/csv' });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/csv' },
      blob: () => Promise.resolve(blob),
    });
    global.URL.createObjectURL = jest.fn(() => 'blob:test');

    renderUploadPage();

    fireEvent.click(screen.getByRole('button', { name: /Download Template/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/questions/template/download',
        expect.any(Object)
      );
    });
  });

  test('uploads csv and shows success stats', async () => {
    global.fetch.mockResolvedValueOnce(
      mockJsonResponse({ created: 3, failed: 0, skipped: 0, total_rows: 3, errors: [] })
    );

    renderUploadPage();

    const file = new File(['a,b,c'], 'questions.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByLabelText(/Select CSV File/i), file);

    fireEvent.click(screen.getByRole('button', { name: /Upload Questions/i }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully uploaded 3 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/Created: 3 questions/i)).toBeInTheDocument();
    });
  });

  test('shows API error message on failed upload', async () => {
    global.fetch.mockResolvedValueOnce(
      mockJsonResponse({ detail: 'Exam not found' }, false, 404)
    );

    renderUploadPage();

    const file = new File(['a,b,c'], 'questions.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByLabelText(/Select CSV File/i), file);
    fireEvent.click(screen.getByRole('button', { name: /Upload Questions/i }));

    await waitFor(() => {
      expect(screen.getByText(/Exam not found/i)).toBeInTheDocument();
    });
  });

  test('shows network error message', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

    renderUploadPage();

    const file = new File(['a,b,c'], 'questions.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByLabelText(/Select CSV File/i), file);
    fireEvent.click(screen.getByRole('button', { name: /Upload Questions/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network timeout/i)).toBeInTheDocument();
    });
  });
});
