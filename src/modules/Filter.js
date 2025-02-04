import React from 'react';

const Filter = ({ startDate, endDate, setStartDate, setEndDate, showDateInputs, setShowDateInputs }) => (
    <div className='filter-container'>
        <button 
            id="filter-button"
            onClick={() => setShowDateInputs(!showDateInputs)}
        >
        <svg fill="none" height="22" viewBox="0 0 20 20" width="22" xmlns="http://www.w3.org/2000/svg" id="fi_7710709">
            <g fill="var(--text-color)">
                <path d="m0 5c0-.55228.447715-1 1-1h18c.5523 0 1 .44772 1 1s-.4477 1-1 1h-18c-.552284 0-1-.44772-1-1z"></path><path d="m3 10c0-.55228.44772-1 1-1h12c.5523 0 1 .44772 1 1 0 .5523-.4477 1-1 1h-12c-.55228 0-1-.4477-1-1z"></path><path d="m8 14c-.55228 0-1 .4477-1 1s.44772 1 1 1h4c.5523 0 1-.4477 1-1s-.4477-1-1-1z"></path>
            </g>
        </svg>
            Filter
        </button>
        {showDateInputs && (
            <div id='filter-items'>
                <input 
                    type="date" 
                    className="date-input" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                />
                <h4>to</h4>
                <input 
                    type="date" 
                    className="date-input" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                />
            </div>
        )}
    </div>
);

export default Filter;