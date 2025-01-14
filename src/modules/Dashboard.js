import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Nav from './Nav';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../components/Cookies';

const Dashboard = ({ setLoggedIn, changeTheme, theme, logout }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [user, setUser] = useState('Tyler');

    useEffect(() => {
        const checkSession = async () => {
            if (process.env.NODE_ENV === 'development') {
                setData([
                    { id: 1, title: 'Test Item 1', data: 'Value 1', col: 1, row: 1, startDate: '2023-01-01', endDate: '2023-01-31' },
                    { id: 2, title: 'Test Item 2', data: 'Value 2', col: 1, row: 1, startDate: '2023-02-01', endDate: '2023-02-28' },
                    { id: 3, title: 'Largest Settlement', data: '$1.3m', col: 3, row: 1, startDate: '2023-03-01', endDate: '2023-03-31' },
                    { id: 4, title: 'Settlement Total All Time', data: '$5', col: 3, row: 2, startDate: '2023-04-01', endDate: '2023-04-30' },
                    { id: 5, title: 'New Cases', data: '144', col: 1, row: 1, startDate: '2023-05-01', endDate: '2023-05-31' },
                    { id: 6, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1, startDate: '2023-06-01', endDate: '2023-06-30' },
                    { id: 7, title: 'New Cases', data: '144', col: 1, row: 1, startDate: '2023-07-01', endDate: '2023-07-31' },
                    { id: 8, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1, startDate: '2023-08-01', endDate: '2023-08-31' },
                    { id: 9, title: 'Settlement Total All Time', data: '$5', col: 5, row: 2, startDate: '2023-09-01', endDate: '2023-09-30' },
                    { id: 10, title: 'Settlement Total All Time', data: '$500,000', col: 2, row: 2, startDate: '2023-10-01', endDate: '2023-10-31' }
                ]);
                setLoading(false);
                return;
            }
            const response = await fetch('https://tylernolet.com/api/session.php');
            const result = await response.json();
            if (result.isLoggedIn) {
                fetch('https://tylernolet.com/api/data.php')
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
    }, [setLoggedIn]);

    const handleFilter = (showAll = false) => {
        if (showAll) {
            // Fetch all data without filtering
            setData(data);
        } else {
            const filteredData = data.filter(item => {
                const itemStartDate = new Date(item.startDate);
                const itemEndDate = new Date(item.endDate);
                const filterStartDate = new Date(startDate);
                const filterEndDate = new Date(endDate);
                return itemStartDate >= filterStartDate && itemEndDate <= filterEndDate;
            });
            setData(filteredData);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div id='dashboard' className='page-container'>
            <Cookies />
            <div className="cards">
                {Array.isArray(data) && data.map((data) => (
                    <Card key={data.id} data={data} />
                ))}
            </div>
        </div>
    );
}

export default Dashboard;