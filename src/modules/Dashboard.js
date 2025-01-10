import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Nav from './Nav';
import Loading from './Loading';
import Card from './Card';

const Dashboard = ({ setLoggedIn, changeTheme, theme }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            if (process.env.NODE_ENV === 'development') {
                setData([
                    { id: 1, title: 'Test Item 1', data: 'Value 1', col: 1, row: 1 },
                    { id: 2, title: 'Test Item 2', data: 'Value 2', col: 1, row: 1 },
                    { id: 3, title: 'Largest Settlement', data: '$1.3m', col: 3, row: 1 },
                    { id: 4, title: 'Settlement Total All Time', data: '$5', col: 3, row: 2 },
                    { id: 5, title: 'New Cases', data: '144', col: 1, row: 1 },
                    { id: 6, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1 },
                    { id: 7, title: 'New Cases', data: '144', col: 1, row: 1 },
                    { id: 8, title: 'Settlement Total All Time', data: '$5', col: 1, row: 1 },
                    { id: 9, title: 'Settlement Total All Time', data: '$5', col: 5, row: 2 }
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
                        console.log(data); // Log the response for debugging
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

    const logout = async () => {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        await fetch('https://tylernolet.com/api/session.php?close', { method: 'GET' });
        setLoggedIn(false);
        window.location.href = '/login';
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div id='dashboard'>
            <Nav logout={logout} title="Dashboard" changeTheme={changeTheme} theme={theme} />
            <div className="cards">
                {Array.isArray(data) && data.map((data) => (
                    <Card key={data.id} data={data} />
                ))}
            </div>
        </div>
    );
}

export default Dashboard;