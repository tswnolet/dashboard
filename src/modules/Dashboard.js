import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import { Filter } from './Filter';
import Refresh from './Refresh';
import Alert from './Alert';
import GoogleAdsComponent from './GoogleAdsComponent';

const Dashboard = ({ setLoggedIn, data, setData, setFilteredData }) => {
    const [loading, setLoading] = useState(true);
    const [showDateInputs, setShowDateInputs] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showAlert, setShowAlert] = useState(false);

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

    const fetchData = async (manual = false) => {
        setRefreshing(true);
        const startTime = Date.now();
        try {
            const response = await fetch('https://dalyblackdata.com/api/data.php');
            const result = await response.json();
            if (result && Array.isArray(result.data)) {
                setData(result.data);
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setData([]);
        }
        const elapsedTime = Date.now() - startTime;
        const minSpinTime = 500;
        setTimeout(() => {
            setRefreshing(false);
            if(manual) setShowAlert(true);
        }, Math.max(0, minSpinTime - elapsedTime));
    };

    useEffect(() => {
        const checkSession = async () => {
            if (process.env.NODE_ENV === 'development') {
                fetchData();
                setLoading(false);
                return;
            }
            const response = await fetch('/api/session.php');
            const result = await response.json();
            if (result.isLoggedIn) {
                fetchData();
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
            <div className='data-action-container'>
                <div className='filter-container'>
                    <button id='filter-button' 
                        onClick={() => {
                            setShowDateInputs(!showDateInputs);
                            showDateInputs && handleFilterClick();
                        }}
                    >
                        <Filter />
                        Filter
                    </button>
                    {showDateInputs && (
                        <div id='filter-items'>
                            <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <h4>to</h4>
                            <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    )}
                </div>
                <button title='Refresh data' id='refresh' onClick={() => (fetchData(true))} className={refreshing ? 'spinning' : ''}>
                    <Refresh />
                </button>
                {showAlert && <Alert message="Data updated successfully." type="success" onClose={() => setShowAlert(false)} />}
            </div>
            <div className="cards">
                {data.map((data) => (
                    <Card key={data.id} data={data} type={data.type ? data.type : ""}/>
                ))}
                <GoogleAdsComponent />
            </div>
        </div>
    );
}

export default Dashboard;