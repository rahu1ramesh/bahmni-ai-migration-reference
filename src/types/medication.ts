import { CodeableConcept, Reference } from './fhir';

/**
 * Enum representing the status of a medication request
 */
export enum MedicationStatus {
  Active = 'active',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
  Completed = 'completed',
  Stopped = 'stopped',
  Draft = 'draft',
  Unknown = 'unknown'
}

/**
 * Interface representing a FHIR R4 Dosage Instruction
 */
export interface FHIRDosageInstruction {
  readonly sequence?: number;
  readonly text?: string;
  readonly timing?: {
    readonly repeat?: {
      readonly frequency?: number;
      readonly period?: number;
      readonly periodUnit?: string;
    };
  };
  readonly route?: CodeableConcept;
  readonly doseAndRate?: ReadonlyArray<{
    readonly doseQuantity?: {
      readonly value?: number;
      readonly unit?: string;
    };
  }>;
}

/**
 * Interface representing a FHIR R4 Medication Request
 */
export interface FHIRMedicationRequest {
  readonly resourceType: 'MedicationRequest';
  readonly id: string;
  readonly status: MedicationStatus;
  readonly intent: 'proposal' | 'plan' | 'order' | 'original-order';
  readonly medicationCodeableConcept?: CodeableConcept;
  readonly medicationReference?: Reference;
  readonly subject: Reference;
  readonly authoredOn?: string;
  readonly requester?: Reference;
  readonly reasonCode?: ReadonlyArray<CodeableConcept>;
  readonly note?: ReadonlyArray<{ text: string }>;
  readonly dosageInstruction?: ReadonlyArray<FHIRDosageInstruction>;
  readonly dispenseRequest?: {
    readonly validityPeriod?: {
      readonly start?: string;
      readonly end?: string;
    };
    readonly quantity?: {
      readonly value?: number;
      readonly unit?: string;
    };
  };
}

/**
 * Interface representing a FHIR R4 Medication
 */
export interface FHIRMedication {
  readonly resourceType: 'Medication';
  readonly id: string;
  readonly code?: CodeableConcept;
  readonly status: 'active' | 'inactive' | 'entered-in-error';
  readonly form?: CodeableConcept;
  readonly amount?: {
    readonly numerator?: {
      readonly value?: number;
      readonly unit?: string;
    };
    readonly denominator?: {
      readonly value?: number;
      readonly unit?: string;
    };
  };
}

/**
 * Interface representing formatted medication data for display
 */
export interface FormattedMedication {
  readonly id: string;
  readonly display: string;
  readonly status: MedicationStatus;
  readonly dosage?: {
    readonly value?: number;
    readonly unit?: string;
  };
  readonly route?: string;
  readonly frequency?: string;
  readonly duration?: string;
  readonly prescribedDate?: string;
  readonly provider?: string;
  readonly reason?: string;
  readonly notes?: ReadonlyArray<string>;
  readonly administrationInstructions?: string;
}
