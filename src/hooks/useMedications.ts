import { useState, useEffect, useCallback } from 'react';
import {
  getMedicationRequestBundle,
  getMedicationRequests,
  formatMedications,
} from '../services/medicationService';
import { FormattedMedication } from '../types/medication';

/**
 * Hook for fetching and managing medications for a patient
 * @param patientUUID - The UUID of the patient
 * @returns Object containing medications, loading state, error state, and refetch function
 */
export function useMedications(patientUUID: string | null) {
  const [medications, setMedications] = useState<FormattedMedication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedications = useCallback(async () => {
    if (!patientUUID) {
      setMedications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bundle = await getMedicationRequestBundle(patientUUID);
      const requests = getMedicationRequests(bundle);
      const formattedMedications = formatMedications(requests);
      setMedications(formattedMedications);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch medications'));
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [patientUUID]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return {
    medications,
    loading,
    error,
    refetch: fetchMedications,
  };
}
