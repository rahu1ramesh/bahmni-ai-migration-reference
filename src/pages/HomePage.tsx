import React from 'react';
import { Grid, Column, Section } from '@carbon/react';
import PatientDetails from '@components/patient/PatientDetails';
import ConditionsTable from '@components/conditions/ConditionsTable';
import AllergiesTable from '@components/allergies/AllergiesTable';
import TreatmentsTable from '@components/treatments/TreatmentsTable';

const HomePage: React.FC = () => {
  return (
    <Section>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <PatientDetails />
          <AllergiesTable />
          <ConditionsTable />
          <TreatmentsTable />
        </Column>
      </Grid>
    </Section>
  );
};

export default HomePage;
