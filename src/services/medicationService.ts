import { get } from './api';
import { PATIENT_MEDICATION_REQUEST_URL } from '@constants/app';
import { getFormattedError } from '@utils/common';
import { notificationService } from './notificationService';
import { FHIRResourceBundle } from '../types/fhir';
import {
  FHIRMedicationRequest,
  FHIRMedication,
  FormattedMedication,
  FHIRDosageInstruction,
} from '../types/medication';

interface MedicationRequestBundle extends FHIRResourceBundle {
  entry?: ReadonlyArray<{
    fullUrl: string;
    resource: FHIRMedicationRequest | FHIRMedication;
  }>;
}

/**
 * Fetches medication requests for a patient
 * @param patientUUID - The UUID of the patient
 * @returns A bundle of medication requests and included medications
 */
export async function getMedicationRequestBundle(
  patientUUID: string,
): Promise<MedicationRequestBundle> {
  try {
    return await get<MedicationRequestBundle>(
      PATIENT_MEDICATION_REQUEST_URL(patientUUID),
    );
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    throw error;
  }
}

/**
 * Extracts medication requests from a bundle
 * @param bundle - The FHIR bundle containing medication requests
 * @returns Array of medication requests
 */
export function getMedicationRequests(
  bundle: MedicationRequestBundle,
): FHIRMedicationRequest[] {
  if (!bundle.entry) return [];
  return bundle.entry
    .filter(
      (entry): entry is { resource: FHIRMedicationRequest; fullUrl: string } =>
        entry.resource.resourceType === 'MedicationRequest',
    )
    .map((entry) => entry.resource);
}

/**
 * Gets the medication name from either CodeableConcept or Reference
 * @param request - The medication request
 * @returns The medication name
 */
function getMedicationName(request: FHIRMedicationRequest): string {
  if (request.medicationCodeableConcept?.text) {
    return request.medicationCodeableConcept.text;
  }
  if (request.medicationCodeableConcept?.coding?.[0]?.display) {
    return request.medicationCodeableConcept.coding[0].display;
  }
  if (request.medicationReference?.display) {
    return request.medicationReference.display;
  }
  return 'Unknown Medication';
}

/**
 * Gets the formatted frequency string from dosage instructions
 * @param dosageInstruction - The dosage instruction
 * @returns Formatted frequency string
 */
function getFrequencyString(
  dosageInstruction?: ReadonlyArray<FHIRDosageInstruction>,
): string {
  if (!dosageInstruction?.[0]?.timing?.repeat) return '';

  const { frequency, period, periodUnit } = dosageInstruction[0].timing.repeat;
  if (!frequency || !period || !periodUnit) return '';

  return `${frequency} time(s) per ${period} ${periodUnit.toLowerCase()}`;
}

/**
 * Gets the duration string from dispense request
 * @param request - The medication request
 * @returns Formatted duration string
 */
function getDurationString(request: FHIRMedicationRequest): string {
  const validityPeriod = request.dispenseRequest?.validityPeriod;
  if (!validityPeriod?.start || !validityPeriod.end) return '';

  const start = new Date(validityPeriod.start);
  const end = new Date(validityPeriod.end);
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  return `${days} day(s)`;
}

/**
 * Formats medication requests for display
 * @param requests - Array of medication requests
 * @returns Array of formatted medications
 */
export function formatMedications(
  requests: FHIRMedicationRequest[],
): FormattedMedication[] {
  try {
    if (!Array.isArray(requests)) {
      throw new Error('Invalid medication requests data');
    }
    return requests.map((request) => {
      if (!request || typeof request !== 'object' || !request.id || !request.status) {
        throw new Error('Invalid medication request format');
      }
      const dosageInstruction = request.dosageInstruction?.[0];
      const doseQuantity = dosageInstruction?.doseAndRate?.[0]?.doseQuantity;

      return {
        id: request.id,
        display: getMedicationName(request),
        status: request.status,
        dosage: doseQuantity
          ? {
              value: doseQuantity.value,
              unit: doseQuantity.unit,
            }
          : undefined,
        route: dosageInstruction?.route?.text,
        frequency: getFrequencyString(request.dosageInstruction),
        duration: getDurationString(request),
        prescribedDate: request.authoredOn,
        provider: request.requester?.display,
        reason: request.reasonCode?.[0]?.text,
        notes: request.note?.map((note) => note.text),
        administrationInstructions: dosageInstruction?.text,
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
