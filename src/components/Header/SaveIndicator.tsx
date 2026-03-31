import React from 'react';

const SaveIndicator: React.FC<{ unsavedChanges: boolean }> = ({ unsavedChanges }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '8px' }}>Save Status:</span>
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: unsavedChanges ? 'red' : 'green'
        }}
      ></div>
      <span>{unsavedChanges ? 'Unsaved changes' : 'All changes saved'}</span>
    </div>
  );
};

export default SaveIndicator;
