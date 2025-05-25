# Display Control Implementation Guide

This guide outlines the step-by-step process for creating new display controls in the Bahmni Clinical Frontend application. It uses the Carbon Design System and follows React best practices with TypeScript.

## Table of Contents

1. [Type Definitions](#1-type-definitions)
2. [Service Layer Implementation](#2-service-layer-implementation)
3. [Custom Hook Creation](#3-custom-hook-creation)
4. [Component Implementation](#4-component-implementation)
5. [Testing Strategy](#5-testing-strategy)
6. [Error Handling](#6-error-handling)
7. [Accessibility & Performance](#7-accessibility--performance)

## 1\. Type Definitions

### 1.1 FHIR Resource Types

- All data is to be fetched from fhir endpoints, which is to be defined in the src/constants/app.ts file.
- Define interfaces for the FHIR resources your display control will consume
- Include proper JSDoc documentation for each interface
- Use readonly properties to prevent accidental mutations
- Define proper type hierarchies (e.g., Bundle \-\> Resource \-\> FormattedData)

Example:

```ts
/**
 * Interface representing a FHIR R4 Resource Bundle
 */
export interface FhirResourceBundle {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly lastUpdated: string;
  };
  readonly type: string;
  readonly total: number;
  readonly entry?: ReadonlyArray<{
    readonly fullUrl: string;
    readonly resource: FhirResource;
  }>;
}
```

### 1.2 Formatted Types

- Create interfaces for formatted data that will be consumed by components
- Keep these interfaces simple and focused on UI requirements
- Include only necessary fields to reduce complexity
- Use proper TypeScript features (optional fields, unions, etc.)

Example:

```ts
/**
 * Interface representing formatted data for display
 */
export interface FormattedDisplayData {
  readonly id: string;
  readonly display: string;
  readonly status: string;
  readonly recordedDate: string;
  readonly metadata?: {
    readonly severity?: string;
    readonly type?: string;
  };
  readonly notes?: string[];
}
```

## 2\. Service Layer Implementation

### 2.1 API Integration

- Create service functions for data fetching
- Use the base API service for HTTP requests
- Implement proper error handling
- Add TypeScript types for request/response
- Adhere to functional coding practices; avoid defining class-based services.
- For data retrieval, use getPatientConditionsBundle and getConditions as references.

Example:

```ts
export async function getResourceData(
  patientUUID: string,
): Promise<FhirResourceBundle> {
  return await get<FhirResourceBundle>(`${RESOURCE_URL(patientUUID)}`);
}
```

### 2.2 Data Transformation

- Create functions to transform FHIR data to formatted data
- Handle missing or incomplete data gracefully
- Implement proper error handling
- If there is an exception, format it using getFormattedError and notify the user with an error alert using notificationService
- Add comprehensive unit tests
- Maintain functional coding principles; refrain from defining class-based Transformers. Example:

```ts
export function formatResourceData(
  resources: FhirResource[],
): FormattedDisplayData[] {
  try {
    return resources.map((resource) => ({
      id: resource.id,
      display: resource.code.text,
      status: resource.status.coding[0]?.display || "Unknown",
      recordedDate: resource.recordedDate,
      metadata: {
        severity: resource.severity,
        type: resource.type,
      },
      notes: resource.note?.map((note) => note.text),
    }));
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}
```

## 3\. Custom Hook Creation

### 3.1 Hook Implementation

- Create a custom hook for data fetching and state management
- Take patientUUID as the input prop
- Implement loading, error, and data states
- Use proper TypeScript types
- Add proper cleanup and error handling

Example:

```ts
export function useResourceData(patientUUID: string | null) {
  const [data, setData] = useState<FormattedDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error("Invalid patient UUID"));
      addNotification({
        type: "error",
        title: "Error",
        message: "Invalid patient UUID",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await getResourceData(patientUUID);
      setData(formatResourceData(result));
    } catch (err) {
      const { title, message } = getFormattedError(err);
      setError(new Error(message));
      addNotification({
        type: "error",
        title: title,
        message: message,
      });
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## 4\. Component Implementation

### 4.1 Base Component Structure

- Use the ExpandableDataTable in src/components/expandableDataTable/ExpandableDataTable.tsx component for consistent UI
- Implement proper TypeScript props interface
- Use Carbon Design System components
- Follow React best practices
- Ensure that all possible happy and edge cases, including failure scenarios, are thoroughly covered during both unit and integration testing

Example:

```ts
interface DisplayControlProps {
  tableTitle: string;
  ariaLabel?: string;
  className?: string;
}

const DisplayControl: React.FC<DisplayControlProps> = ({
  tableTitle,
  ariaLabel,
  className,
}) => {
  const patientUUID = usePatientUUID();
  const { data, loading, error } = useResourceData(patientUUID);

  // Implementation...
};
```

### 4.2 Data Display Configuration

- Define table headers
- Implement cell rendering logic
- Handle expanded content logic if any, else return undefined.
- Implement row styling

Example:

```ts
const headers = [
  { key: "display", header: "Display" },
  { key: "status", header: "Status" },
  { key: "recordedDate", header: "Date" },
];

const renderCell = (row: FormattedDisplayData, cellId: string) => {
  switch (cellId) {
    case "display":
      return row.display;
    case "status":
      return <Tag type={getTagType(row.status)}>{row.status}</Tag>;
    case "recordedDate":
      return formatDateTime(row.recordedDate);
    default:
      return null;
  }
};
```

## 5\. Testing Strategy

### 5.1 Unit Tests

- Test component rendering
- Test data transformation
- Test error handling
- Test loading states
- Test empty states
- Test user interactions

Example:

```ts
describe("DisplayControl", () => {
  describe("Component Initialization", () => {
    it("should initialize with proper hooks");
    it("should handle loading state");
    it("should handle error state");
    it("should handle empty state");
  });

  describe("Data Display", () => {
    it("should render all columns correctly");
    it("should format dates properly");
    it("should handle missing data");
  });
});
```

### 5.2 Integration Tests

- Test data fetching
- Test error scenarios
- Test user workflows
- Test component integration

Example:

```ts
describe("DisplayControl Integration", () => {
  it("should fetch and display data");
  it("should handle network errors");
  it("should handle user interactions");
});
```

## 6\. Error Handling

### 6.1 Error Scenarios

- Show Skeleton states for loading states
- Handle network errors
- Handle missing data
- Handle malformed data
- Handle authorization errors
- Use notification service for user feedback

### 6.2 Error Recovery

- Implement retry mechanisms
- Provide clear error messages
- Handle cleanup properly
- Maintain application state

## 7\. Accessibility & Performance

### 7.1 Accessibility Requirements

- Use proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast
- Support screen readers
- Follow WAI-ARIA guidelines

### 7.2 Performance Optimization

- Implement proper memoization
- Optimize re-renders
- Handle large datasets
- Implement proper cleanup
- Use proper React patterns

### 7.3 Code Quality

- Follow project style guide
- Use proper TypeScript features
- Write comprehensive documentation
- Follow SOLID principles
- Implement proper error boundaries

## Best Practices Checklist

- [ ] Before creating a new component, function, service, or utility, review the existing codebase and reuse available implementations whenever possible.
- [ ] Types are properly defined and documented
- [ ] Service layer handles errors gracefully
- [ ] Custom hook implements proper cleanup
- [ ] Component uses Carbon Design System
- [ ] Tests cover all major scenarios
- [ ] Error handling is comprehensive
- [ ] Accessibility requirements are met
- [ ] Performance optimizations are implemented
- [ ] Code is properly documented
- [ ] TypeScript is properly utilized
