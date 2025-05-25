import {
  getMedicationRequestBundle,
  getMedicationRequests,
  formatMedications,
} from '../../services/medicationService';
import { get } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { MedicationStatus, FHIRMedicationRequest } from '../../types/medication';
import { PATIENT_MEDICATION_REQUEST_URL } from '../../constants/app';

jest.mock('../../services/api');
jest.mock('../../services/notificationService');

describe('medicationService', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const {
    mockMedicationRequest,
    mockMedicationRequestBundle,
  } = require('../../__mocks__/medicationMocks');

  const mockBundle = mockMedicationRequestBundle;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedicationRequestBundle', () => {
    it('should fetch medication request bundle successfully', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getMedicationRequestBundle(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        PATIENT_MEDICATION_REQUEST_URL(mockPatientUUID),
      );
      expect(result).toEqual(mockMedicationRequestBundle);
    });

    it('should handle errors and show notification', async () => {
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        getMedicationRequestBundle(mockPatientUUID),
      ).rejects.toThrow();
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('getMedicationRequests', () => {
    it('should extract medication requests from bundle', () => {
      const result = getMedicationRequests(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMedicationRequest);
    });

    it('should handle empty bundle', () => {
      const emptyBundle = { ...mockBundle, entry: undefined };
      const result = getMedicationRequests(emptyBundle);

      expect(result).toEqual([]);
    });
  });

  describe('formatMedications', () => {
    it('should format medication requests correctly', () => {
      const result = formatMedications([mockMedicationRequest]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockMedicationRequest.id,
        display: mockMedicationRequest.medicationCodeableConcept.text,
        status: mockMedicationRequest.status,
        dosage: {
          value: 1,
          unit: 'tablet',
        },
        route: 'Oral',
        frequency: '1 time(s) per 1 day',
        duration: '7 day(s)',
        prescribedDate: mockMedicationRequest.authoredOn,
        provider: mockMedicationRequest.requester.display,
        reason: mockMedicationRequest.reasonCode[0].text,
        notes: ['Test Note'],
        administrationInstructions: 'Take with water',
      });
    });

    it('should handle missing optional fields', () => {
      const minimalRequest: FHIRMedicationRequest = {
        resourceType: 'MedicationRequest',
        id: 'minimal-request',
        status: MedicationStatus.Active,
        intent: 'order',
        subject: { reference: `Patient/${mockPatientUUID}` },
      };

      const result = formatMedications([minimalRequest]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: minimalRequest.id,
        display: 'Unknown Medication',
        status: minimalRequest.status,
        dosage: undefined,
        route: undefined,
        frequency: '',
        duration: '',
        prescribedDate: undefined,
        provider: undefined,
        reason: undefined,
        notes: undefined,
        administrationInstructions: undefined,
      });
    });

    it('should handle errors during formatting', () => {
      const invalidRequest = {} as any;

      formatMedications([invalidRequest]);

      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
