import { renderHook, waitFor } from '@testing-library/react';
import { useMedications } from '../useMedications';
import {
  getMedicationRequestBundle,
  getMedicationRequests,
  formatMedications,
} from '../../services/medicationService';
import { MedicationStatus } from '../../types/medication';

jest.mock('../../services/medicationService');

describe('useMedications', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const mockMedicationRequest = {
    id: 'test-med-request',
    status: MedicationStatus.Active,
    display: 'Test Medication',
    dosage: {
      value: 1,
      unit: 'tablet',
    },
    route: 'Oral',
    frequency: '1 time(s) per day',
    duration: '7 day(s)',
    prescribedDate: '2023-01-01T10:00:00Z',
    provider: 'Dr. Test',
    reason: 'Test Reason',
    notes: ['Test Note'],
    administrationInstructions: 'Take with water',
  };

  const mockBundle = {
    resourceType: 'Bundle',
    id: 'test-bundle',
    type: 'searchset',
    total: 1,
    entry: [
      {
        fullUrl: 'test-url',
        resource: mockMedicationRequest,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getMedicationRequestBundle as jest.Mock).mockResolvedValue(mockBundle);
    (getMedicationRequests as jest.Mock).mockReturnValue([mockMedicationRequest]);
    (formatMedications as jest.Mock).mockReturnValue([mockMedicationRequest]);
  });

  it('should fetch and format medications on mount', async () => {
    const { result } = renderHook(() => useMedications(mockPatientUUID));

    expect(result.current.loading).toBe(true);
    expect(result.current.medications).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual([mockMedicationRequest]);
    expect(result.current.error).toBeNull();
    expect(getMedicationRequestBundle).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should handle null patientUUID', () => {
    const { result } = renderHook(() => useMedications(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.medications).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(getMedicationRequestBundle).not.toHaveBeenCalled();
  });

  it('should handle error during fetch', async () => {
    const error = new Error('Failed to fetch');
    (getMedicationRequestBundle as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useMedications(mockPatientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.medications).toEqual([]);
  });

  it('should refetch medications when patientUUID changes', async () => {
    const newPatientUUID = 'new-patient-uuid';
    const { rerender } = renderHook(
      ({ patientUUID }) => useMedications(patientUUID),
      {
        initialProps: { patientUUID: mockPatientUUID },
      },
    );

    await waitFor(() => {
      expect(getMedicationRequestBundle).toHaveBeenCalledWith(mockPatientUUID);
    });

    rerender({ patientUUID: newPatientUUID });

    await waitFor(() => {
      expect(getMedicationRequestBundle).toHaveBeenCalledWith(newPatientUUID);
    });
  });

  it('should provide a refetch function', async () => {
    const { result } = renderHook(() => useMedications(mockPatientUUID));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    (getMedicationRequestBundle as jest.Mock).mockClear();

    // Call refetch
    result.current.refetch();

    expect(getMedicationRequestBundle).toHaveBeenCalledWith(mockPatientUUID);
  });
});
