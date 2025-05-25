import { renderHook, waitFor } from '@testing-library/react';
import { useMedications } from '../../hooks/useMedications';
import {
  getMedicationRequestBundle,
  getMedicationRequests,
  formatMedications,
} from '../../services/medicationService';
import { mockMedications, mockMedicationRequest, mockMedicationRequestBundle } from '../../__mocks__/medicationMocks';

jest.mock('../../services/medicationService');

describe('useMedications', () => {
  const mockPatientUUID = 'test-patient-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    (getMedicationRequestBundle as jest.Mock).mockResolvedValue(mockMedicationRequestBundle);
    (getMedicationRequests as jest.Mock).mockReturnValue([mockMedicationRequest]);
    (formatMedications as jest.Mock).mockReturnValue([mockMedications[0]]);
  });

  it('should fetch and format medications on mount', async () => {
    const { result } = renderHook(() => useMedications(mockPatientUUID));

    expect(result.current.loading).toBe(true);
    expect(result.current.medications).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.medications).toEqual([mockMedications[0]]);
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
