import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Nav from './Nav';

const Dashboard = ({ setLoggedIn }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const response = await fetch('https://tylernolet.com/api/session.php');
            const result = await response.json();
            if (result.isLoggedIn) {
                //const dataResponse = await fetch('https://tylernolet.com/api/data.php');
                //const dataResult = await dataResponse.json();
                //setData(dataResult);
                console.log("Yay!")
            } else {
                setLoggedIn(false);
                window.location.href = '/login';
            }
            setLoading(false);
        };
        checkSession();
    }, [setLoggedIn]);

    const logout = async () => {
        await fetch('https://tylernolet.com/api/session.php?close', { method: 'GET' });
        setLoggedIn(false);
        window.location.href = '/login';
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id='dashboard'>
            <Nav logout={logout} />
            <h1>Welcome to the Daly & Black Dashboard!</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Dashboard;