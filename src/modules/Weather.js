import React, { useState, useEffect } from 'react';
import Loading from './Loading';
import Line from '../resources/image.png';

function Pages({ data, pageSize, currentPage, totalPages, handlePageChange, set }) {
    return (
        <div className="pages" style={set ? {position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)' } : {}}>
            <button className='weather-btns action' onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                Previous
            </button>
            <span>
                Page {currentPage + (totalPages > 0 ? 1 : 0)} of {totalPages}
            </span>
            <button className='weather-btns action' onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}>
                Next
            </button>
        </div>
    );
}

export default function Weather({ theme }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [schoolData, setSchoolData] = useState([]);
    const [clickedRow, setClickedRow] = useState(null);
    let dataSet = false;

    // Pagination and filtering states
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(0);
    const [filteredResults, setFilteredResults] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [selectedEventTypes, setSelectedEventTypes] = useState([]);
    const [minMagnitude, setMinMagnitude] = useState(null);
    const [minPropertyDamage, setMinPropertyDamage] = useState(0);
    const [minLocationsHit, setMinLocationsHit] = useState(0);
    const [eventTypes, setEventTypes] = useState([]);

    // Sorting states
    const [sortColumn, setSortColumn] = useState('event_type');
    const [sortDirection, setSortDirection] = useState('asc');

    // Fetch data in chunks
    const fetchData = (offset = 0, all = false) => {
        setLoading(true);
        if (all) setLoadingAll(true);

        fetch(`https://dalyblackdata.com/events.php?offset=${offset}&all=${all}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                dataSet = true;
                if (Array.isArray(data) && data.length > 0) {
                    if (all) {
                        setResults(data);
                    } else {
                        setResults((prevResults) => [...prevResults, ...data]);
                    }

                    applyFilters(data);
                    const uniqueEventTypes = Array.from(new Set(data.map((event) => event.event_type)));
                    setEventTypes(uniqueEventTypes);
                    setCurrentPage(0);
                } else {
                    setHasMoreData(false);
                }
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            })
            .finally(() => {
                if (!all) {
                    setLoading(false);
                } else {
                    setLoadingAll(false);
                }
            });
    };

    const fetchSchoolData = async (schoolIds) => {
        if (!schoolIds || schoolIds.length === 0) return;
    
        const chunkSize = 200;
        const chunks = [];
        
        for (let i = 0; i < schoolIds.length; i += chunkSize) {
            chunks.push(schoolIds.slice(i, i + chunkSize));
        }
    
        try {
            const schoolDataPromises = chunks.map(async (chunk) => {
                const response = await fetch(`https://dalyblackdata.com/schools.php?ids=${chunk.join(",")}`);
                return response.json();
            });

            const chunkResults = await Promise.all(schoolDataPromises);
            const allSchoolData = chunkResults.flat();
            setSchoolData(allSchoolData);
        } catch (err) {
            console.error("Error fetching school data:", err);
        }
    };    

    useEffect(() => {
        fetchData(currentOffset);
    }, [currentOffset]);

    useEffect(() => {
        if (results.length > 0) {
            applyFilters();
        }
    }, [results]);

    const applyFilters = () => {
        if (results.length === 0) return;

        let filtered = results;

        if (selectedEventTypes.length > 0) {
            filtered = filtered.filter((event) => selectedEventTypes.includes(event.event_type));
        }
        filtered = filtered.filter((event) => event.event_property_damage >= minPropertyDamage);
        filtered = filtered.filter((event) => event.address_count >= minLocationsHit);
        if (minMagnitude !== null) {
            filtered = filtered.filter((event) => event.event_magnitude >= minMagnitude);
        }

        setFilteredResults(filtered);
        setCurrentPage(0);
    };

    const handleSort = (column) => {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        setSortColumn(column);

        const sortedData = [...filteredResults].sort((a, b) => {
            let aValue = a[column];
            let bValue = b[column];

            if (column === 'event_property_damage') {
                aValue = parseFloat(aValue.toString().replace(/[$,]/g, ""));
                bValue = parseFloat(bValue.toString().replace(/[$,]/g, ""));
            }

            if (!isNaN(aValue) && !isNaN(bValue)) {
                return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
            } else if (typeof aValue == 'string' && typeof bValue == 'string') {
                return newDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else if (column === 'event_date') {
                const dateA = new Date(aValue);
                const dateB = new Date(bValue);
                return newDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }

            return 0;
        });

        setFilteredResults(sortedData);
    };

    const handleRowClick = (event, index) => {
        if (selectedEvent && selectedEvent.id === event.id) {
            setSelectedEvent(null);
            setClickedRow(null)
            setSchoolData([]);
        } else {
            setSelectedEvent(event);
            setClickedRow(index)
            fetchSchoolData(event.school_ids);
        }
    };

    const clearFilters = () => {
        setSelectedEventTypes([]);
        setMinMagnitude(null);
        setMinPropertyDamage(0);
        setMinLocationsHit(0);
        setFilteredResults(results);
        setCurrentPage(0);
    };

    const totalPages = Math.ceil(filteredResults.length / pageSize);
    const currentPageData = filteredResults.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(0);
    };

    const handleLoadMore = () => {
        if (hasMoreData) {
            setCurrentOffset((prev) => prev + 2000);
        }
    };

    const handleLoadAll = async () => {
        fetchData(0, true);
    };

    const toTitleCase = (str) => {
        return str
            .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
            .replace(/\bISD\b/gi, 'ISD')
            .replace(/\bDAEP\b/gi, 'DAEP')
            .replace(/\bAEP\b/gi, 'AEP');
    };

    function printInnerTable(schoolData) {
        const popupWindow = window.open('', '_blank', 'width=600,height=800');
        popupWindow.document.write(`
            <html>
                <head>
                    <title>Print Schools</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; }
                        th { background-color: #f4bc41; }
                    </style>
                </head>
                <body>
                    <h4>Schools Hit:</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>School Name</th>
                                <th>School District</th>
                                <th>School Address</th>
                                <th>School District Size</th>
                                <th>Enrollment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schoolData.map((school, index) => `
                                <tr>
                                    <td>${toTitleCase(school.school_name)}</td>
                                    <td>${toTitleCase(school.district_name)}</td>
                                    <td>${school.address}</td>
                                    <td>${school.district_size}</td>
                                    <td>${school.enrollment > 0 ? school.enrollment : "N/A"}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        popupWindow.document.close();
        popupWindow.focus();
        popupWindow.print();
        popupWindow.close();
    }    

    return (
        <div className='page-container'>
            <div className='page-size'>
                <label htmlFor="pageSize">Entries Per Page:</label>
                <select
                    id="pageSize"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className='weather-select'
                >
                    {[10, 25, 50, 250, 500].map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>
            <Pages set={false} data={schoolData} pageSize={pageSize} currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
            {/* Filters */}
            <div className={`filter${showFilters ? " open" : ""}`}>
                <div className="filters">
                    <div>
                        <label htmlFor="eventType">Select Event Types:</label>
                        <div id="eventTypeWrapper">
                            <select
                                multiple
                                id="eventType"
                                value={selectedEventTypes}
                                onChange={(e) =>
                                    setSelectedEventTypes(
                                        Array.from(e.target.selectedOptions, (option) => option.value)
                                    )
                                }
                                className='default-select'
                            >
                                {eventTypes.map((eventType, index) => (
                                    <option key={index} value={eventType}>
                                        {eventType}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="propertyDamage">Minimum Property Damage:</label>
                        <input
                            type="number"
                            id="propertyDamage"
                            value={minPropertyDamage}
                            onChange={(e) => setMinPropertyDamage(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label htmlFor="locationsHit">Minimum Locations Hit:</label>
                        <input
                            type="number"
                            id="locationsHit"
                            value={minLocationsHit}
                            onChange={(e) => setMinLocationsHit(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label htmlFor="magnitude">Minimum Magnitude:</label>
                        <input
                            type="number"
                            id="magnitude"
                            value={minMagnitude !== null ? minMagnitude : 0}
                            onChange={(e) =>
                                setMinMagnitude(e.target.value !== "" ? Number(e.target.value) : null)
                            }
                        />
                    </div>
                </div>
                <div className="filter-btns">
                    <button className='weather-btns action' onClick={applyFilters}>Apply Filters</button>
                    <button className='weather-btns action' onClick={clearFilters}>Clear Filters</button>
                </div>
            </div>
            <button className='weather-btns filter-btn action' onClick={() => setShowFilters(!showFilters)}>{showFilters ? "Hide Filters" : "Filters"}</button>
            {/* Results Table */}
            <div id='weather-container'>
                {currentPageData.length > 0 ? (
                    <table id="weather-table">
                        <thead style={{borderBottom: "1px solid white"}}>
                            <tr>
                                <th onClick={() => handleSort('event_type')}>
                                    Event Type
                                    {sortColumn === 'event_type' ? (
                                        <svg
                                            style={{
                                                transform: sortDirection === "asc" ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s'
                                            }}
                                            height="24"
                                            viewBox="0 0 48 48"
                                            width="24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 20l10 10 10-10z" 
                                            fill="var(--text-color)"/>
                                            <path d="M0 0h48v48h-48z" fill="none"/>
                                        </svg>
                                        ) : (
                                            <img 
                                            src={Line} 
                                            alt="icon" 
                                            fill="var(--text-color)" 
                                            style={{
                                                height: "15px",
                                                width: "15px",
                                                objectFit: "cover",
                                                filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'
                                            }} 
                                            />                                    )}
                                </th>
                                <th onClick={() => handleSort('event_magnitude')}>
                                    Event Magnitude
                                    {sortColumn === 'event_magnitude' ? (
                                        <svg
                                            style={{
                                            transform: sortDirection === "asc" ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                            }}
                                            height="24"
                                            viewBox="0 0 48 48"
                                            width="24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 20l10 10 10-10z" 
                                            fill="var(--text-color)"/>
                                            <path d="M0 0h48v48h-48z" fill="none"/>
                                        </svg>
                                        ) : (
                                            <img 
                                            src={Line} 
                                            alt="icon" 
                                            fill="var(--text-color)" 
                                            style={{
                                                height: "15px",
                                                width: "15px",
                                                objectFit: "cover",
                                                filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'
                                            }} 
                                            />
                                        )}
                                </th>
                                <th onClick={() => handleSort('event_date')}>
                                    Event Date
                                    {sortColumn === 'event_date' ? (
                                        <svg
                                            style={{
                                            transform: sortDirection === "asc" ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                            }}
                                            height="24"
                                            viewBox="0 0 48 48"
                                            width="24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 20l10 10 10-10z" 
                                            fill="var(--text-color)"/>
                                            <path d="M0 0h48v48h-48z" fill="none"/>
                                        </svg>
                                        ) : (
                                            <img 
                                            src={Line} 
                                            alt="icon" 
                                            fill="var(--text-color)" 
                                            style={{
                                                height: "15px",
                                                width: "15px",
                                                objectFit: "cover",
                                                filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'
                                            }} 
                                            />                                    )}
                                </th>
                                <th onClick={() => handleSort('event_property_damage')}>
                                    Property Damage
                                    {sortColumn === 'event_property_damage' ? (
                                        <svg
                                            style={{
                                            transform: sortDirection === "asc" ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                            }}
                                            height="24"
                                            viewBox="0 0 48 48"
                                            width="24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 20l10 10 10-10z" 
                                            fill="var(--text-color)"/>
                                            <path d="M0 0h48v48h-48z" fill="none"/>
                                        </svg>
                                        ) : (
                                            <img 
                                            src={Line} 
                                            alt="icon" 
                                            fill="var(--text-color)" 
                                            style={{
                                                height: "15px",
                                                width: "15px",
                                                objectFit: "cover",
                                                filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'
                                            }} 
                                            />                                    )}
                                </th>
                                <th onClick={() => handleSort('address_count')}>
                                    Locations Hit
                                    {sortColumn === 'address_count' ? (
                                        <svg
                                            style={{
                                            transform: sortDirection === "asc" ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                            }}
                                            height="24"
                                            viewBox="0 0 48 48"
                                            width="24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 20l10 10 10-10z" 
                                            fill="var(--text-color)"/>
                                            <path d="M0 0h48v48h-48z" fill="none"/>
                                        </svg>
                                        ) : (
                                            <img 
                                            src={Line} 
                                            alt="icon" 
                                            fill="var(--text-color)" 
                                            style={{
                                                height: "15px",
                                                width: "15px",
                                                objectFit: "cover",
                                                filter: theme === 'dark' ? 'invert(1)' : 'invert(0)'
                                            }} 
                                            />                                    )}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageData.map((event, index) => (
                                <React.Fragment key={index}>
                                    <tr
                                        className={`event ${index % 2 || clickedRow === index ? "light" : "clear"}`}
                                        onClick={() => handleRowClick(event, index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td title={event.event_type} className={sortColumn ==='event_type' ? "column_active" : ""}>{event.event_type}</td>
                                        <td title={event.event_magnitude} className={sortColumn ==='event_magnitude' ? "column_active" : ""}>{event.event_magnitude}{event.event_magnitude != null ? (event.event_type === "Hail" ? '"' : "MPH") : ""}</td>
                                        <td title={event.event_date} className={sortColumn ==='event_date' ? "column_active" : ""}>
                                            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                                                timeZone: 'America/Chicago',  // Specify your timezone (CST)
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td title={event.event_property_damage} className={sortColumn === 'event_property_damage' ? "column_active" : ""}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(event.event_property_damage)}</td>
                                        <td title={event.address_count} className={sortColumn === 'address_count' ? "column_active" : ""}>{event.address_count}</td>
                                    </tr>
                                    {selectedEvent && selectedEvent.id === event.id && schoolData.length > 0 && (
                                        <tr>
                                            <td colSpan="5" style={{borderTop: "0px solid white"}}>
                                                <h4>Schools Hit:</h4>
                                                <button className='weather-btns action' 
                                                    onClick={() => printInnerTable(schoolData)} 
                                                    style={{ marginBottom: "10px", padding: "5px 10px", backgroundColor: "#f4bc41", color: "black", border: "none", cursor: "pointer" }}
                                                >
                                                    Print Schools
                                                </button>
                                                <table className="schools" id={`schools-table-${event.id}`}>
                                                    <thead style={{borderBottom: "1px solid white"}}>
                                                        <tr>
                                                            <th>School Name</th>
                                                            <th>School District</th>
                                                            <th>School Address</th>
                                                            <th>School District Size</th>
                                                            <th>Enrollment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {schoolData.map((school, schoolIndex) => (
                                                            <tr key={schoolIndex} className={schoolIndex % 2 ? "light" : "clear"}>
                                                                <td>{toTitleCase(school.school_name)}</td>
                                                                <td>{toTitleCase(school.district_name)}</td>
                                                                <td>
                                                                    <a 
                                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(school.address)}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        style={{color: "#f4bc41", textDecoration: "underline"}}
                                                                    >
                                                                        {school.address}
                                                                    </a>
                                                                </td>
                                                                <td>{school.district_size}</td>
                                                                <td>{school.enrollment > 0 ? school.enrollment : "N/A"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className='no-events'>{dataSet ? <Loading /> : 'No events to display.'}</p>
                )}
            </div>
            <Pages data={schoolData} pageSize={pageSize} currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
            {hasMoreData && (
                <div className='load-options' style={{display: "flex", justifyContent: "center", flexDirection: "row"}}>
                    <button className='weather-btns action' onClick={handleLoadMore} disabled={loading}>
                        {loading ? "Loading..." : "Load More"}
                    </button>
                    <button className='weather-btns action' onClick={handleLoadAll} disabled={loading}>
                        {loadingAll ? "Loading All..." : "Load All"}
                    </button>
                </div>
            )}
        </div>
    );
}