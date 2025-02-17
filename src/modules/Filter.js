import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Filter = ({ startDate, endDate, setStartDate, setEndDate, showDateInputs, setShowDateInputs }) => {
    const filterButton = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClick = (e) => {
            if (filterButton.current && !filterButton.current.contains(e.target)) {
                setShowDateInputs(false);
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [filterButton, setShowDateInputs]);
    
    const today = new Date();
    const dayOfWeek = today.getDay();

    const setPresetDateRange = (preset) => {
        let start, end;

        switch (preset) {
            case 'today':
                start = end = today.toISOString().split('T')[0];
                break;
            case 'week':
                start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'workweek':
                const lastFriday = new Date(today);
                lastFriday.setDate(today.getDate() - ((dayOfWeek + 2) % 7));
                const lastSaturday = new Date(lastFriday);
                lastSaturday.setDate(lastFriday.getDate() - 6);
                start = lastSaturday.toISOString().split('T')[0];
                end = lastFriday.toISOString().split('T')[0];
                break;
            case 'thismonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'lastmonth':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                break;
            case 'thisyear':
                start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'lastyear':
                start = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                end = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                break;
            case 'alltime':
                start = null;
                end = null;
                break;
            default:
                start = end = null;
        }

        setStartDate(start);
        setEndDate(end);
        navigate(`?report=${preset}`);
    };

    const presets = {"today":"Today","week":"Last 7 Days", "workweek":"Last Full Week", "thismonth":"This Month","lastmonth":"Last Month","thisyear":"This Year","lastyear":"Last Year","alltime":"All Time"};

    return (
        <div className='filter-container' ref={filterButton}>
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
                        value={startDate || ''} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <h4>to</h4>
                    <input 
                        type="date" 
                        className="date-input" 
                        value={endDate || ''} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                    <div className="preset-buttons">
                        {Object.entries(presets).map(([key, value]) => (
                            <p 
                                className='report-preset' 
                                key={key} 
                                onClick={() => setPresetDateRange(key)}
                            >
                                {value}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;