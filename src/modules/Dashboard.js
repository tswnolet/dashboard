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
        const urlParams = new URLSearchParams(window.location.search);
        const report = urlParams.get('report');

        if (report) {
            const today = new Date();
            let start, end;

            switch (report) {
                case 'today':
                    start = end = today.toISOString().split('T')[0];
                    break;
                case 'week':
                    start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                    end = new Date().toISOString().split('T')[0];
                    break;
                case 'workweek':
                    const lastSunday = new Date(today.setDate(today.getDate() - today.getDay() - 7));
                    const lastSaturday = new Date(lastSunday);
                    lastSaturday.setDate(lastSunday.getDate() + 6);
                    start = lastSunday.toISOString().split('T')[0];
                    end = lastSaturday.toISOString().split('T')[0];
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
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    const renderCards = () => {
        const defaultGridSize = {
            "h-bar": {
                col: (data) => {
                    const periods = Object.keys(data).length;
                    return periods > 5 ? 3 : periods <= 2 ? 1 : 2;
                },
                row: 2
            },
            "v-bar": { col: 1, row: 2 },
            "pie": { col: 2, row: 2 },
            "line": { col: 2, row: 2 },
            "def": { col: 1, row: 2 },
            "percentage": { col: 1, row: 1 },
            "value": { col: 1, row: 1 },
            "rank": { col: 1, row: 2 }
        };
    
        const preferredOrder = [
            "Cases by Location",
            "Total Settlement",
            "Cases by Phase",
            "Average Suit Percentage",
            "Cases Opened vs Closed",
            "New Cases",
            "Average Settlement by Practice Type",
            "Cases by Practice Type",
            "Settlements Over Time",
            "Case Duration",
            "Open Cases",
            "Signed Up Cases vs Settled Cases",
        ];
    
        const orderedCards = [];
        let currentRow = [];
        let availableColumns = 4;
    
        const cardData = Object.entries(stats)
            .filter(([_, value]) => value && value.data !== null && Object.keys(value.data).length > 0)
            .map(([key, value]) => {
                let cardType = "v-bar";
                let secondData = null;
                const { title, data } = value;

                defaultGridSize["v-bar"] = title.includes("Top 5") ? { col: 2, row: 2 } : defaultGridSize["v-bar"];
    
                const chart = key.toLowerCase();
                if (chart.includes("location")) cardType = "pie";
                else if (chart.includes("total")) cardType = "def";
                else if (chart.includes("over") || chart.includes("openedvsclosed")) {
                    cardType = "line";
                    if (typeof data === "object" && !Array.isArray(data)) {
                        secondData = Object.fromEntries(
                            Object.entries(data).map(([subKey, subValue]) => [
                                subKey, Array.isArray(subValue) ? subValue[1] : 0
                            ])
                        );
                    }
                }
                else if (chart.includes("caseoutcome")) cardType = "v-bar";
                else if (chart.includes("duration") || chart.includes("settlements") && !chart.includes("top")) cardType = "h-bar";
                else if (chart.includes("percentage")) cardType = "percentage";
                else if (chart.includes("opencases") || chart.includes("averagecases")) cardType = "value";
    
                const gridSize = defaultGridSize[cardType] || { col: 2, row: 2 };
                const colSpan = typeof gridSize.col === 'function' ? gridSize.col(data) : gridSize.col;
    
                return {
                    key,
                    cardType,
                    gridSize: { ...gridSize, col: colSpan },
                    title,
                    element: (
                        <Card 
                            key={key}
                            data={{ 
                                title,
                                data,
                                col: colSpan,
                                row: title === "Cases by Phase" ? 4 : gridSize.row
                            }}
                            type={cardType}
                            format={Object.entries(data).some(([_, value]) => value % 1 !== 0) || title.includes("Top 5") || title.includes("Average Settlement")}
                            {...(secondData  ? { secondData } : {})}
                            {...(chart.includes("over") ? { yAxisLabel: "money" } : {})}
                        />
                    )
                };
            });
    
        const sortedCards = [];
    
        preferredOrder.forEach((preferredTitle) => {
            const matchedCardIndex = cardData.findIndex((card) => card.title.toLowerCase().includes(preferredTitle.toLowerCase()));
            if (matchedCardIndex !== -1) {
                sortedCards.push(cardData[matchedCardIndex]);
                cardData.splice(matchedCardIndex, 1);
            }
        });
    
        sortedCards.push(...cardData);
    
        sortedCards.forEach(({ element, gridSize }) => {
            if (gridSize.col > availableColumns) {
                orderedCards.push([...currentRow]);
                currentRow = [];
                availableColumns = 4;
            }
    
            currentRow.push(element);
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
            <h2 className="cards-title">Lead Data</h2>
            <div className="cards">
                <LeadStatusComponent startDate={startDate} endDate={endDate} />
            </div>
            <h2 className="cards-title">Google Ads Data</h2>
            <div className="cards">
                <GoogleAdsComponent startDate={startDate} endDate={endDate}/>
            </div>
        </div>
    );
};

export default Dashboard;