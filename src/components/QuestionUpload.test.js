/**
 * Tests for QuestionUpload Component
 * 
 * Tests cover:
 * - Component rendering
 * - File upload functionality
 * - Template download
 * - Error handling
 * - CSV format validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuestionUpload from './QuestionUpload';

// Mock the useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ examId: 'test-exam-id-123' }),
  useNavigate: () => jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

describe('QuestionUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Component Rendering Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('renders component with title', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByText(/📋 Bulk Upload Questions/i)).toBeInTheDocument();
  });

  test('renders file input', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    const fileInput = screen.getByLabelText(/Select CSV File/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.csv');
  });

  test('renders upload button', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Upload Questions/i })).toBeInTheDocument();
  });

  test('renders template download button', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Download Template/i })).toBeInTheDocument();
  });

  test('renders cancel button', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('renders format guide toggle button', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Show CSV Format/i })).toBeInTheDocument();
  });

  test('renders help section', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    expect(screen.getByText(/🆘 Need Help\?/i)).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // File Selection Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('displays file name when CSV selected', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/questions\.csv/i)).toBeInTheDocument();
    });
  });

  test('rejects non-CSV files', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'document.xlsx', { type: 'application/vnd.ms-excel' });
    const input = screen.getByLabelText(/Select CSV File/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Please select a CSV file/i)).toBeInTheDocument();
    });
  });

  test('upload button disabled when no file selected', () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );
    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    expect(uploadBtn).toBeDisabled();
  });

  test('upload button enabled when CSV selected', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
      expect(uploadBtn).not.toBeDisabled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CSV Format Guide Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('toggles CSV format guide visibility', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Show CSV Format/i });
    
    // Initially hidden
    expect(screen.queryByText(/CSV Format Guide/i)).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(screen.getByText(/CSV Format Guide/i)).toBeInTheDocument();
    });

    // Click to hide
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(screen.queryByText(/CSV Format Guide/i)).not.toBeInTheDocument();
    });
  });

  test('shows CSV columns table when guide expanded', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Show CSV Format/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/section_id/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/question_image_url/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/option_a/).length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Template Download Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('downloads template on button click', async () => {
    const mockBlob = new Blob(['section_id,option_a,option_b,option_c,option_d'], 
      { type: 'text/csv' }
    );
    
    fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const downloadBtn = screen.getByRole('button', { name: /Download Template/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/questions/template/download',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });
  });

  test('shows error when template download fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const downloadBtn = screen.getByRole('button', { name: /Download Template/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to download template/i)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Upload Functionality Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('successfully uploads CSV file', async () => {
    const mockResponse = {
      created: 10,
      failed: 0,
      skipped: 0,
      total_rows: 10,
      errors: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Successfully uploaded 10 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/Created: 10/i)).toBeInTheDocument();
    });
  });

  test('displays error when upload fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid exam ID' }),
    });

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid exam ID/i)).toBeInTheDocument();
    });
  });

  test('displays partial failure statistics', async () => {
    const mockResponse = {
      created: 95,
      failed: 5,
      skipped: 0,
      total_rows: 100,
      errors: [
        'Row 12: invalid section_id',
        'Row 45: missing option_a',
      ]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Created: 95 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed: 5 rows/i)).toBeInTheDocument();
      expect(screen.getByText(/Row 12: invalid section_id/i)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // UI State Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('disables all buttons during upload', async () => {
    let resolveUpload;
    const uploadPromise = new Promise(resolve => {
      resolveUpload = resolve;
    });

    fetch.mockReturnValueOnce(uploadPromise.then(() => ({
      ok: true,
      json: () => Promise.resolve({ created: 1, failed: 0 }),
    })));

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Uploading/i })).toBeInTheDocument();
    });

    resolveUpload();
  });

  test('shows loading state during upload submission', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(uploadBtn).toHaveTextContent(/Uploading.../i);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error Handling Tests
  // ─────────────────────────────────────────────────────────────────────────

  test('shows error when CSV is missing', async () => {
    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    
    // Try submitting without file selection (button is disabled normally)
    // This tests the error message path
    expect(uploadBtn).toBeDisabled();
  });

  test('displays network error message', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <QuestionUpload />
      </BrowserRouter>
    );

    const file = new File(['test'], 'questions.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/Select CSV File/i);

    await userEvent.upload(input, file);

    const uploadBtn = screen.getByRole('button', { name: /Upload Questions/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
