import { FormattedMedication, MedicationStatus } from '../types/medication';

export const mockMedications: FormattedMedication[] = [
  {
    id: 'med-1',
    display: 'Paracetamol 500mg',
    status: MedicationStatus.Active,
    dosage: {
      value: 1,
      unit: 'tablet',
    },
    route: 'Oral',
    frequency: '1 time(s) per day',
    duration: '7 day(s)',
    prescribedDate: '2023-01-01T10:00:00Z',
    provider: 'Dr. Test',
    reason: 'Fever',
    notes: ['Take after food'],
    administrationInstructions: 'Take with water',
  },
  {
    id: 'med-2',
    display: 'Ibuprofen 400mg',
    status: MedicationStatus.Completed,
    dosage: {
      value: 1,
      unit: 'tablet',
    },
    route: 'Oral',
    frequency: '2 time(s) per day',
    duration: '5 day(s)',
    prescribedDate: '2023-01-02T10:00:00Z',
    provider: 'Dr. Test',
    reason: 'Pain',
    notes: ['Take after food'],
    administrationInstructions: 'Take with water',
  },
  {
    id: 'med-3',
    display: 'Amoxicillin 250mg',
    status: MedicationStatus.OnHold,
    dosage: {
      value: 1,
      unit: 'capsule',
    },
    route: 'Oral',
    frequency: '3 time(s) per day',
    duration: '10 day(s)',
    prescribedDate: '2023-01-03T10:00:00Z',
    provider: 'Dr. Test',
    reason: 'Bacterial infection',
    notes: ['Take with or without food'],
    administrationInstructions: 'Complete the full course',
  },
  {
    id: 'med-4',
    display: 'Aspirin 75mg',
    status: MedicationStatus.Stopped,
    dosage: {
      value: 1,
      unit: 'tablet',
    },
    route: 'Oral',
    frequency: '1 time(s) per day',
    duration: '30 day(s)',
    prescribedDate: '2023-01-04T10:00:00Z',
    provider: 'Dr. Test',
    reason: 'Blood thinning',
    notes: ['Take with food to avoid stomach upset'],
    administrationInstructions: 'Take in the morning',
  },
];

export const mockMedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'test-med-request',
  status: MedicationStatus.Active,
  intent: 'order',
  medicationCodeableConcept: {
    text: 'Test Medication',
    coding: [{ display: 'Test Med Coding' }],
  },
  subject: { reference: 'Patient/test-patient-uuid' },
  authoredOn: '2023-01-01T10:00:00Z',
  requester: { display: 'Dr. Test' },
  reasonCode: [{ text: 'Test Reason' }],
  note: [{ text: 'Test Note' }],
  dosageInstruction: [
    {
      text: 'Take with water',
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'day',
        },
      },
      route: { text: 'Oral' },
      doseAndRate: [
        {
          doseQuantity: {
            value: 1,
            unit: 'tablet',
          },
        },
      ],
    },
  ],
  dispenseRequest: {
    validityPeriod: {
      start: '2023-01-01T00:00:00Z',
      end: '2023-01-08T00:00:00Z',
    },
  },
};

export const mockMedicationRequestBundle = {
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
