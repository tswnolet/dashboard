import React from 'react';

const DisplayFilter = ({ allFields, selectedFields, handleFieldSelection }) => {
    return (
        <div className='filter-container' style={{ marginTop: "16px" }}>
            {allFields.map((field) => (
            <div key={field}>
                <input
                type="checkbox"
                value={field}
                checked={selectedFields.includes(field)}
                onChange={handleFieldSelection}
                />
                <label>{field}</label>
            </div>
            ))}
        </div>
    );
}

export default DisplayFilter;