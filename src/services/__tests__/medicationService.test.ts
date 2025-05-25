import { getMedicationRequestBundle, getMedicationRequests, formatMedications } from '../medicationService';
import { get } from '../api';
import { notificationService } from '../notificationService';
import { MedicationStatus } from '@types/medication';

jest.mock('../api');
jest.mock('../notificationService');

describe('medicationService', () => {
  const mockPatientUUID = 'test-patient-uuid';
  const mockMedicationRequest = {
    resourceType: 'MedicationRequest',
    id: 'test-med-request',
    status: MedicationStatus.Active,
    intent: 'order',
    medicationCodeableConcept: {
      text: 'Test Medication',
      coding: [{ display: 'Test Med Coding' }]
    },
    subject: { reference: `Patient/${mockPatientUUID}` },
    authoredOn: '2023-01-01T10:00:00Z',
    requester: { display: 'Dr. Test' },
    reasonCode: [{ text: 'Test Reason' }],
    note: [{ text: 'Test Note' }],
    dosageInstruction: [{
      text: 'Take with water',
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'day'
        }
      },
      route: { text: 'Oral' },
      doseAndRate: [{
        doseQuantity: {
          value: 1,
          unit: 'tablet'
        }
      }]
    }],
    dispenseRequest: {
      validityPeriod: {
        start: '2023-01-01T00:00:00Z',
        end: '2023-01-08T00:00:00Z'
      }
    }
  };

  const mockBundle = {
    resourceType: 'Bundle',
    id: 'test-bundle',
    type: 'searchset',
    total: 1,
    entry: [{
      fullUrl: 'test-url',
      resource: mockMedicationRequest
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedicationRequestBundle', () => {
    it('should fetch medication request bundle successfully', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getMedicationRequestBundle(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(expect.stringContaining(mockPatientUUID));
      expect(result).toEqual(mockBundle);
    });

    it('should handle errors and show notification', async () => {
      const error = new Error('Network error');
      (get as jest.Mock).mockRejectedValueOnce(error);

      await expect(getMedicationRequestBundle(mockPatientUUID)).rejects.toThrow();
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
          unit: 'tablet'
        },
        route: 'Oral',
        frequency: '1 time(s) per 1 day',
        duration: '7 day(s)',
        prescribedDate: mockMedicationRequest.authoredOn,
        provider: mockMedicationRequest.requester.display,
        reason: mockMedicationRequest.reasonCode[0].text,
        notes: ['Test Note'],
        administrationInstructions: 'Take with water'
      });
    });

    it('should handle missing optional fields', () => {
      const minimalRequest = {
        resourceType: 'MedicationRequest',
        id: 'minimal-request',
        status: MedicationStatus.Active,
        intent: 'order',
        subject: { reference: `Patient/${mockPatientUUID}` }
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
        administrationInstructions: undefined
      });
    });

    it('should handle errors during formatting', () => {
      const invalidRequest = {} as any;

      formatMedications([invalidRequest]);

      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
