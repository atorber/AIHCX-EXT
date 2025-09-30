import React from 'react';
import DataDumpFormAntd from './DataDumpFormAntd';
import { DataDumpConfig } from '../types';

interface DataDumpTabProps {
  datasetId: string;
  category: string;
  onSubmit?: (config: DataDumpConfig) => Promise<void>;
}

const DataDumpTab: React.FC<DataDumpTabProps> = ({ datasetId, category, onSubmit }) => {
  return (
    <div style={{ padding: '8px' }}>
      <DataDumpFormAntd
        datasetId={datasetId}
        category={category}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default DataDumpTab;
