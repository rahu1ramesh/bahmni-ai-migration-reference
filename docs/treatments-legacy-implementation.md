# Prescription Display Control Analysis

## 1. Introduction and Purpose

The prescription display control (also known as "treatments" in the codebase) is a core component of Bahmni's clinical dashboard that manages and displays medication prescriptions. It provides a comprehensive interface for viewing and managing patient medications, supporting both inpatient and outpatient prescription workflows.

### Key Features

- Medication order management
- Support for both coded and non-coded drugs
- Flexible display options (flowsheet/list views)
- Integration with pharmacy workflows
- FHIR-compatible data model

## 2. File Structure

The prescription display control is implemented across several key directories:

```
openmrs-module-bahmniapps/
├── ui/app/common/displaycontrols/prescription/
│   ├── init.js                    # Module initialization
│   ├── directives/
│   │   └── prescription.js        # Core directive implementation
│   └── views/
│       └── prescription.html      # Template for rendering
└── ui/app/clinical/consultation/
    ├── services/
    │   └── treatmentConfig.js     # Configuration service
    └── models/
        ├── drugOrderOptions.js    # Drug order options model
        └── drugSearchResult.js    # Drug search functionality
```

## 3. Configuration Options

The display control is configured through the clinical dashboard configuration:

```json
{
  "treatments": {
    "displayType": "Full-Page",
    "translationKey": "DASHBOARD_TITLE_TREATMENTS_KEY",
    "type": "treatment",
    "dashboardConfig": {
      "showFlowSheet": true,
      "showListView": true,
      "showRoute": true,
      "showDrugForm": true,
      "numberOfVisits": 5,
      "showOtherActive": true,
      "showDetailsButton": true
    },
    "expandedViewConfig": {
      "numberOfVisits": 10,
      "showDetailsButton": true
    }
  }
}
```

### Configuration Parameters

- `showFlowSheet`: Enables timeline view of medications
- `showListView`: Enables list view of medications
- `showRoute`: Displays medication administration route
- `showDrugForm`: Shows the form of medication (tablet, syrup, etc.)
- `numberOfVisits`: Number of visits to display medications for
- `showOtherActive`: Shows other active medications
- `showDetailsButton`: Enables detailed view of prescriptions

## 4. Data Model

### Core Data Structures

```typescript
interface DrugOrder {
  uuid: string;
  drug: {
    name: string;
    form: string;
    strength?: string;
  };
  dosingInstructions: {
    dose: number;
    doseUnits: string;
    route: string;
    frequency: string;
    asNeeded: boolean;
    administrationInstructions?: string;
  };
  duration: number;
  durationUnits: string;
  quantity: number;
  quantityUnits: string;
  status: "ACTIVE" | "COMPLETED" | "DISCONTINUED";
  effectiveStartDate: Date;
  effectiveStopDate?: Date;
  orderReasonConcept?: {
    name: string;
    uuid: string;
  };
}

interface DrugOrderViewModel extends DrugOrder {
  isDiscontinued: boolean;
  isActive: boolean;
  effectiveStopDate: Date;
  scheduledDate: Date;
  sortWeight: number;
}
```

## 5. FHIR Integration

The prescription display control maps to FHIR R4 resources:

### MedicationRequest Resource

```typescript
interface FHIRMedicationRequest {
  resourceType: "MedicationRequest";
  status: "active" | "on-hold" | "cancelled" | "completed" | "stopped";
  intent: "proposal" | "plan" | "order" | "original-order";
  medicationReference: Reference;
  subject: Reference;
  authoredOn: string;
  requester: Reference;
  dosageInstruction: Array<{
    timing: {
      repeat: {
        frequency: number;
        period: number;
        periodUnit: string;
      };
    };
    route: CodeableConcept;
    doseAndRate: Array<{
      doseQuantity: {
        value: number;
        unit: string;
      };
    }>;
  }>;
}
```

### Medication Resource

```typescript
interface FHIRMedication {
  resourceType: "Medication";
  code: CodeableConcept;
  status: "active" | "inactive" | "entered-in-error";
  form: CodeableConcept;
  amount: {
    numerator: Quantity;
    denominator: Quantity;
  };
  ingredient: Array<{
    itemCodeableConcept: CodeableConcept;
    strength: {
      numerator: Quantity;
      denominator: Quantity;
    };
  }>;
}
```

## 6. API Integration

### Key Endpoints

1. Drug Orders API:

```
GET /openmrs/ws/rest/v1/bahmnicore/drugOrders
  ?patientUuid={uuid}
  &numberOfVisits={n}
  &includeActiveVisit={boolean}
```

2. FHIR Endpoints:

```
GET /openmrs/ws/fhir2/R4/MedicationRequest?patient={uuid}
POST /openmrs/ws/fhir2/R4/MedicationRequest
GET /openmrs/ws/fhir2/R4/Medication/{id}
```

## 7. Error Handling

The display control implements several error handling mechanisms:

1. **Drug Order Validation**

   - Duplicate order detection
   - Drug-drug interaction checking
   - Dosage range validation

2. **Error States**

   ```typescript
   interface DrugOrderError {
     message: string;
     errorCode: string;
     params: any[];
   }
   ```

3. **Common Error Scenarios**
   - Invalid dosage
   - Drug not found
   - Authorization errors
   - Network connectivity issues

## 10. Testing Guidelines

For the React + TypeScript implementation over OpenMRS FHIR, consider the following test scenarios:

### 1. Data Fetching Hook Tests

```typescript
describe("useMedications", () => {
  test("should fetch active medications");
  test("should handle loading state");
  test("should handle error state");
  test("should update cache on medication changes");
});
```

### 2. FHIR Service Tests

```typescript
describe("MedicationService", () => {
  test("should convert OpenMRS drug order to FHIR MedicationRequest");
  test("should handle FHIR search responses");
  test("should manage medication status transitions");
});
```

### 3. Component Tests

```typescript
describe("MedicationTable", () => {
  test("should render active medications");
  test("should display medication details");
  test("should handle medication actions");
  test("should implement sorting and filtering");
});
```

### 4. Error Handling Tests

```typescript
describe("ErrorBoundary", () => {
  test("should catch and display API errors");
  test("should handle network timeouts");
  test("should provide retry mechanisms");
});
```

## 11. Migration Considerations

When migrating to the new React + TypeScript implementation:

1. **Data Migration**

   - Map legacy drug orders to FHIR resources
   - Preserve historical prescription data
   - Maintain audit trails

2. **Feature Parity**

   - Implement all existing display options
   - Maintain current workflow support
   - Preserve configuration flexibility

3. **Performance Requirements**

   - Match or exceed current response times
   - Optimize network requests
   - Implement efficient caching

4. **Integration Points**
   - Maintain compatibility with existing systems
   - Support gradual migration
   - Provide fallback mechanisms
