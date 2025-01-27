import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import { Filter } from './Filter';

const Dashboard = ({ setLoggedIn, data, setData, setFilteredData }) => {
    const [loading, setLoading] = useState(true);
    const [showDateInputs, setShowDateInputs] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleFilter = (showAll = false) => {
        if (showAll) {
            setFilteredData(data);
        } else {
            const filteredData = data.filter(item => {
                const itemStartDate = new Date(item.startDate);
                const itemEndDate = new Date(item.endDate);
                const filterStartDate = new Date(startDate);
                const filterEndDate = new Date(endDate);
                return itemStartDate >= filterStartDate && itemEndDate <= filterEndDate;
            });
            setFilteredData(filteredData);
        }
    };

    const handleFilterClick = () => {
        if (!startDate && !endDate) {
            handleFilter(true);
        } else {
            handleFilter();
        }
        setShowDateInputs(false);
    };

    useEffect(() => {
        const checkSession = async () => {
            if (process.env.NODE_ENV === 'development') {
                /*setData([
                    { id: 1, title: 'Test Item 1', data: 'Value 1', col: 1, row: 1, startDate: '2023-01-01', endDate: '2023-01-31' },
                    { id: 2, title: 'Test Item 2', data: 'Value 2', col: 1, row: 1, startDate: '2023-02-01', endDate: '2023-02-28' },
                    { id: 3, title: 'Largest Settlement', data: '$1.3m', col: 2, row: 1, startDate: '2023-03-01', endDate: '2023-03-31' },
                    { id: 4, title: 'Settlement Total Allfgh Time', data: {"Jan": [54, 26], "Feb": [31, 21],"Mar": [15, 10],"Apr": [15, 10],"Jun": [65, 51], "Jul": [15, 10]}, col: 2, row: 2, startDate: '2023-10-01', endDate: '2023-10-31', type: "h-bar"},
                    { id: 5, title: 'Settlement Total All Time', data: "{\"marketing\": 32000, \"digital\": 40000, \"rockets\": 10000}", col: 1, row: 2, startDate: '2023-04-01', endDate: '2023-04-30', type: 'pie' },
                    { id: 6, title: 'New Cases', data: '144', col: 1, row: 1, startDate: '2023-05-01', endDate: '2023-05-31' },
                    { id: 7, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1, startDate: '2023-06-01', endDate: '2023-06-30' },
                    { id: 8, title: 'New Cases', data: '144', col: 1, row: 2, startDate: '2023-07-01', endDate: '2023-07-31' },
                    { id: 9, title: 'Settlement Total All Time', data: {'First Party': 65, 'Personal Injury': 42, 'Med Mal': 6, 'Other': 2}, col: 2, row: 2, startDate: '2023-08-01', endDate: '2023-08-31', type: 'v-bar' },
                    { id: 10, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1, startDate: '2023-09-01', endDate: '2023-09-30' },
                ]);*/
                fetch('https://dalyblackdata.com/api/data.php')
                    .then((response) => response.json())
                    .then((data) => {
                        if (data && Array.isArray(data.data)) {
                            setData(data.data);
                        } else {
                            setData([]);
                        }
                    })
                    .catch((err) => {
                        console.error('Error fetching data:', err);
                        setData([]);
                    });
                setLoading(false);
                return;
            }
            const response = await fetch('/api/session.php');
            const result = await response.json();
            if (result.isLoggedIn) {
                fetch('/api/data.php')
                    .then((response) => response.json())
                    .then((data) => {
                        if (data && Array.isArray(data.data)) {
                            setData(data.data);
                        } else {
                            setData([]);
                        }
                    })
                    .catch((err) => {
                        console.error('Error fetching data:', err);
                        setData([]);
                    });
            } else {
                setLoggedIn(false);
                window.location.href = '/login';
            }
            setLoading(false);
        };
        checkSession();
    }, [setLoggedIn, setData]);

    const addCard = (newCard) => {
        setData([...data, newCard]);
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div id='dashboard' className='page-container'>
            <Cookies />
            <div className='filter-container'>
                <button id='filter-button' 
                    onClick={() => {
                        setShowDateInputs(!showDateInputs) 
                        showDateInputs && (handleFilterClick())
                    }}
                >
                    <Filter />
                    Filter
                </button>
                {showDateInputs && (
                    <div id='filter-items'>
                        <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                )}
            </div>
            <div className="cards">
                {data.map((data) => (
                    <Card key={data.id} data={data} type={data.type ? data.type : ""}/>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;