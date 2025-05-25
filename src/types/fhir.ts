/**
 * Interface representing a FHIR CodeableConcept
 */
export interface CodeableConcept {
  readonly coding?: ReadonlyArray<{
    readonly system?: string;
    readonly code?: string;
    readonly display?: string;
  }>;
  readonly text?: string;
}

/**
 * Interface representing a FHIR Reference
 */
export interface Reference {
  readonly reference?: string;
  readonly type?: string;
  readonly display?: string;
}

/**
 * Interface representing a FHIR Resource Bundle
 */
export interface FHIRResourceBundle {
  readonly resourceType: string;
  readonly id: string;
  readonly meta?: {
    readonly lastUpdated: string;
  };
  readonly type: string;
  readonly total: number;
  readonly entry?: ReadonlyArray<{
    readonly fullUrl: string;
    readonly resource: unknown;
  }>;
}

/**
 * Interface representing a FHIR Quantity
 */
export interface Quantity {
  readonly value?: number;
  readonly unit?: string;
  readonly system?: string;
  readonly code?: string;
}

/**
 * Interface representing a FHIR Period
 */
export interface Period {
  readonly start?: string;
  readonly end?: string;
}
