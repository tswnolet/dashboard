import React, { useEffect, useState } from 'react';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import Filter from './Filter';
import Refresh from './Refresh';
import Alert from './Alert';
import GoogleAdsComponent from './GoogleAdsComponent';
import LeadStatusComponent from './LeadStatusComponent';

const Dashboard = ({ setLoggedIn }) => {
    const [loading, setLoading] = useState(true);
    const [showDateInputs, setShowDateInputs] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({});

    const fetchStats = async (manual = false) => {
        setRefreshing(true);
        const startTime = Date.now();

        try {
            const response = await fetch(`https://dalyblackdata.com/api/fetch.php${startDate ? ("?startDate=" + startDate + (endDate ? "&endDate=" + endDate : "")) : endDate ? "?endDate=" + endDate : ""}`);
            const result = await response.json();
            
            if (result.success) {
                const filteredStats = Object.fromEntries(
                    Object.entries(result).filter(([key, value]) => key !== "success" && value !== null && value !== undefined)
                );

                setStats(filteredStats);
            } else {
                console.error("Error fetching data:", result.message);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }

        const elapsedTime = Date.now() - startTime;
        const minSpinTime = 500;
        setTimeout(() => {
            setRefreshing(false);
            if (manual) setShowAlert(true);
        }, Math.max(0, minSpinTime - elapsedTime));
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    const renderCards = () => {
        const defaultGridSize = {
            "h-bar": { 
                col: (typeof stats === "object" && stats !== null) 
                    ? Object.keys(stats).length > 5 
                        ? 3
                        : Object.keys(stats).length === 1 
                            ? 1
                            : 2
                    : 2,
                row: 2
            },
            "v-bar": { col: 2, row: 2 }, 
            "pie": { col: 2, row: 2 },
            "line": { col: 2, row: 2},
            "def": { col: 1, row: 2 }
        };
    
        const orderedCards = [];
        let currentRow = [];
        let availableColumns = 4;
    
        Object.entries(stats).forEach(([key, value]) => {
            if (!value || key === "success") return;
    
            let cardType = "v-bar";
            let secondData = null;
            let chart = key.toLowerCase();
    
            if (chart.includes("location")) cardType = "pie";
            else if (chart.includes("total")) cardType = "def";
            else if (chart.includes("over") || chart.includes("openedvsclosed")) {
                cardType = "line";
                if (typeof value === "object" && !Array.isArray(value)) {
                    secondData = Object.fromEntries(
                        Object.entries(value).map(([subKey, subValue]) => [
                            subKey, Array.isArray(subValue) ? subValue[1] : 0
                        ])
                    );
                }
            }
            else if (chart.includes("caseoutcome")) cardType = "v-bar";
            else if (chart.includes("duration") || chart.includes("settlements")) cardType = "h-bar";

            const gridSize = defaultGridSize[cardType] || { col: 2, row: 2 };

            if (gridSize.col > availableColumns) {
                orderedCards.push([...currentRow]);
                currentRow = [];
                availableColumns = 4;
            }
    
            currentRow.push(
                <Card 
                    key={key}
                    data={{ 
                        title: key.replace(/fetch/i, '').replace(/([A-Z])/g, ' $1').trim(), 
                        data: value,
                        col: gridSize.col,
                        row: gridSize.row
                    }} 
                    type={cardType}
                    {...(secondData ? { secondData } : {})}
                    {...(chart.includes("over") ? { yAxisLabel: "money" } : {})}
                />
            );
    
            availableColumns -= gridSize.col;
        });
    
        if (currentRow.length > 0) {
            orderedCards.push([...currentRow]);
        }
    
        return orderedCards.flat();
    };    

    return (
        <div id='dashboard' className='page-container'>
            <Cookies />
            <div className='data-action-container'>
                <Filter startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} showDateInputs={showDateInputs} setShowDateInputs={setShowDateInputs}/>
                <button title='Refresh data' id='refresh' onClick={fetchStats} className={refreshing ? 'spinning' : ''}>
                    <Refresh />
                </button>
                {showAlert && <Alert message="Data updated successfully." type="success" onClose={() => setShowAlert(false)} />}
            </div>
            <h2 className="cards-title">Case Data</h2>
            <div className="cards">
                {renderCards()}
            </div>
            <h2 className="cards-title">Google Ads Data</h2>
            <div className="cards">
                <GoogleAdsComponent startDate={startDate} endDate={endDate}/>
            </div>
            <h2 className="cards-title">Lead Data</h2>
            <div className="cards">
                <LeadStatusComponent startDate={startDate} endDate={endDate} />
            </div>
        </div>
    );
};

export default Dashboard;