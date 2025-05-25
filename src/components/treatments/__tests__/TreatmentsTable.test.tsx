import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TreatmentsTable from '../../treatments/TreatmentsTable';
import { useMedications } from '../../../hooks/useMedications';
import { usePatientUUID } from '../../../hooks/usePatientUUID';
import { FormattedMedication, MedicationStatus } from '../../../types/medication';

jest.mock('@hooks/useMedications');
jest.mock('@hooks/usePatientUUID');

describe('TreatmentsTable', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const { mockMedications } = require('../../../__mocks__/medicationMocks');

  beforeEach(() => {
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (useMedications as jest.Mock).mockReturnValue({
      medications: mockMedications,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('should render treatments table with correct headers', () => {
    render(<TreatmentsTable />);

    expect(screen.getByText('Treatments')).toBeInTheDocument();
    expect(screen.getByText('Medication')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Dosage')).toBeInTheDocument();
    expect(screen.getByText('Route')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Prescribed Date')).toBeInTheDocument();
  });

  it('should render medication data correctly', () => {
    render(<TreatmentsTable />);

    mockMedications.forEach((med: FormattedMedication) => {
      // Find the row for this medication
      const row = screen.getByText(med.display).closest('tr');
      expect(row).toBeInTheDocument();

      // Check each cell within the row
      if (row) {
        expect(row).toHaveTextContent(med.display);
        expect(row).toHaveTextContent(med.status);
        expect(row).toHaveTextContent(`${med.dosage?.value} ${med.dosage?.unit}`);
        expect(row).toHaveTextContent(med.route);
        expect(row).toHaveTextContent(med.frequency);
        expect(row).toHaveTextContent(med.duration);
      }
    });
  });

  it('should show loading state', () => {
    (useMedications as jest.Mock).mockReturnValue({
      medications: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<TreatmentsTable />);
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const error = new Error('Failed to fetch');
    (useMedications as jest.Mock).mockReturnValue({
      medications: [],
      loading: false,
      error,
      refetch: jest.fn(),
    });

    render(<TreatmentsTable />);
    expect(screen.getByText('Error: Failed to fetch')).toBeInTheDocument();
  });

  it('should show empty state when no medications', () => {
    (useMedications as jest.Mock).mockReturnValue({
      medications: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<TreatmentsTable />);
    expect(screen.getByText('No treatments found')).toBeInTheDocument();
  });

  it('should show expanded content with notes when row is expanded', async () => {
    render(<TreatmentsTable />);

    // Find and click the first expand button
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    const firstExpandButton = expandButtons[1]; // First medication's expand button
    firstExpandButton.click();

    // Wait for expanded content
    await waitFor(() => {
      // Get the first expanded row
      const expandedRow = screen.getAllByText('Take after food')[0];
      expect(expandedRow).toBeInTheDocument();

      // Get the expanded content container
      const expandedContent = expandedRow.closest('div[style*="padding: 1rem"]');
      expect(expandedContent).toBeInTheDocument();

      // Check for instructions and notes
      if (expandedContent) {
        expect(expandedContent).toHaveTextContent('Instructions:');
        expect(expandedContent).toHaveTextContent('Take with water');
        expect(expandedContent).toHaveTextContent('Notes:');
        expect(expandedContent).toHaveTextContent('Take after food');
      }
    });
  });
});
