import { useState, useCallback, useEffect } from 'react';
import { FhirAllergyIntolerance } from '@types/allergy';
import { useNotification } from './useNotification';
import { getAllergies } from '@services/allergyService';
import { getFormattedError } from '@utils/common';

interface UseAllergiesResult {
  allergies: FhirAllergyIntolerance[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient allergies
 * @param patientUUID - The UUID of the patient
 * @returns Object containing allergies, loading state, error state, and refetch function
 */
export const useAllergies = (
  patientUUID: string | null,
): UseAllergiesResult => {
  const [allergies, setAllergies] = useState<FhirAllergyIntolerance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchAllergies = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error('Invalid patient UUID'));
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      return;
    }

    try {
      setLoading(true);
      const allergies = await getAllergies(patientUUID);
      setAllergies(allergies);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchAllergies();
  }, [patientUUID, fetchAllergies]);

  return {
    allergies: allergies,
    loading: loading,
    error: error,
    refetch: fetchAllergies,
  };
};
