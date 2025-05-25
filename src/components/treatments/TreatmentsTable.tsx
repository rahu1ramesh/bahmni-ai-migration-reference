import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { ExpandableDataTable } from '../../components/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useMedications } from '../../hooks/useMedications';
import { FormattedMedication, MedicationStatus } from '../../types/medication';
import { formatDateTime } from '../../utils/date';

/**
 * Maps medication status to appropriate tag type
 * @param status - The medication status
 * @returns The tag type for the status
 */
const getStatusTagType = (
  status: MedicationStatus,
): 'green' | 'red' | 'gray' | 'blue' | 'warm-gray' => {
  switch (status) {
    case MedicationStatus.Active:
      return 'green';
    case MedicationStatus.OnHold:
      return 'warm-gray';
    case MedicationStatus.Cancelled:
    case MedicationStatus.Stopped:
      return 'red';
    case MedicationStatus.Completed:
      return 'blue';
    default:
      return 'gray';
  }
};

/**
 * Component to display patient medications in a DataTable with expandable rows
 */
const TreatmentsTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { medications, loading, error } = useMedications(patientUUID);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: 'Medication' },
      { key: 'status', header: 'Status' },
      { key: 'dosage', header: 'Dosage' },
      { key: 'route', header: 'Route' },
      { key: 'frequency', header: 'Frequency' },
      { key: 'duration', header: 'Duration' },
      { key: 'prescribedDate', header: 'Prescribed Date' },
      { key: 'provider', header: 'Provider' },
    ],
    [],
  );

  // Function to render cell content based on the cell ID
  const renderCell = (medication: FormattedMedication, cellId: string) => {
    switch (cellId) {
      case 'display':
        return medication.display;
      case 'status':
        return (
          <Tag type={getStatusTagType(medication.status)}>
            {medication.status}
          </Tag>
        );
      case 'dosage':
        return medication.dosage
          ? `${medication.dosage.value} ${medication.dosage.unit}`
          : 'Not specified';
      case 'route':
        return medication.route || 'Not specified';
      case 'frequency':
        return medication.frequency || 'Not specified';
      case 'duration':
        return medication.duration || 'Not specified';
      case 'prescribedDate': {
        const date = formatDateTime(medication.prescribedDate || '');
        return date.formattedResult || 'Not specified';
      }
      case 'provider':
        return medication.provider || 'Not specified';
      default:
        return null;
    }
  };

  // Function to render expanded content for a medication
  const renderExpandedContent = (medication: FormattedMedication) => {
    const hasExpandedContent =
      medication.notes?.length || medication.administrationInstructions;

    if (!hasExpandedContent) {
      return undefined;
    }

    return (
      <div style={{ padding: '1rem' }}>
        {medication.reason && (
          <p>
            <strong>Reason: </strong>
            {medication.reason}
          </p>
        )}
        {medication.administrationInstructions && (
          <p>
            <strong>Instructions: </strong>
            {medication.administrationInstructions}
          </p>
        )}
        {medication.notes && medication.notes.length > 0 && (
          <>
            <strong>Notes:</strong>
            {medication.notes.map((note, index) => (
              <p key={index} style={{ marginLeft: '1rem' }}>
                {note}
              </p>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      style={{ width: '100%', paddingTop: '1rem' }}
      data-testid="treatments-table"
    >
      <ExpandableDataTable
        tableTitle="Treatments"
        rows={medications}
        headers={headers}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        error={error}
        ariaLabel="Patient treatments"
        emptyStateMessage="No treatments found"
      />
    </div>
  );
};

export default TreatmentsTable;
