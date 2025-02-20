import React, { useEffect, useState } from 'react';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import Filter from './Filter';
import Refresh from './Refresh';
import Alert from './Alert';
import GoogleAdsComponent from './GoogleAdsComponent';
import LeadStatusComponent from './LeadStatusComponent';

const Dashboard = ({ setLoggedIn, google = false }) => {
    const [loading, setLoading] = useState(true);
    const [showDateInputs, setShowDateInputs] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datesSet, setDatesSet] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [campaignNames, setCampaignNames] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);

    const fetchStats = async (manual = false) => {
        if (!datesSet) return;
        
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
        const today = new Date();
        let start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        let end = new Date().toISOString().split('T')[0];

        if (report) {
            switch (report) {
                case 'today':
                    start = end = today.toISOString().split('T')[0];
                    break;
                case 'week':
                    start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                    end = new Date().toISOString().split('T')[0];
                    break;
                case 'workweek':
                    const dayOfWeek = today.getDay();
                    const lastFriday = new Date(today);
                    lastFriday.setDate(today.getDate() - ((dayOfWeek + 2) % 7));
                    const lastSaturday = new Date(lastFriday);
                    lastSaturday.setDate(lastFriday.getDate() - 6);
                    start = lastSaturday.toISOString().split('T')[0];
                    end = lastFriday.toISOString().split('T')[0];
                    break;
                case 'last4weeks':
                    start = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];
                    end = new Date().toISOString().split('T')[0];
                    break;
                case 'thismonth':
                    start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
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
                    start = end = today.toISOString().split('T')[0];
            }
        }

        setStartDate(start);
        setEndDate(end);
        setDatesSet(true);
    }, []);

    useEffect(() => {
        if (datesSet) {
            fetchStats();
            setRefreshTrigger(prev => prev + 1);
        }
    }, [datesSet, startDate, endDate]);

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
            "rank": { col: 1, row: 2 },
            "list": { col: 2, row: 2 },
            "table": { col: 4, row: 4 }
        };
    
        const preferredOrder = [
            "Cases by Location",
            "Total Settlement",
            "Cases by Phase",
            "Average Suit Percentage",
            "Cases Opened vs Closed",
            "Average Cases per Period",
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
                let cardType = value.type;
                let secondData = value.secondData || null;
                let prevData = value.prevData || null;
                let total = value.total || null;
                const { title, data } = value;
    
                const chart = key.toLowerCase();
    
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
                                title: value.title,
                                data,
                                col: value.col || gridSize.col,
                                row: value.row || gridSize.row,
                                headers: value.headers
                            }}
                            type={cardType}
                            format={Object.entries(data).some(([_, value]) => value % 1 !== 0) || title.includes("Top 5") && !title.includes("Top 5 Winning Attorneys") || title.includes("Average Settlement")}
                            secondData={secondData}
                            prevData={prevData}
                            total={total}
                            {...(chart.includes("over") ? { yAxisLabel: "money" } : {})}
                            {...(title === "Attorney Docket Count" ? { slice: 30 } : {})}
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

    const handleRefresh = () => {
        fetchStats(true);
        setRefreshTrigger(prev => prev + 1);
    }

    return (
        <div id='dashboard' className='page-container'>
            <Cookies />
            <div className='data-action-container'>
                <Filter startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} 
                        showDateInputs={showDateInputs} setShowDateInputs={setShowDateInputs}
                        campaignNames={campaignNames} setFilteredCampaigns={setFilteredCampaigns}/>
                <button title='Refresh data' id='refresh' onClick={handleRefresh} className={refreshing ? 'spinning' : ''}>
                    <Refresh />
                </button>
                {showAlert && <Alert message="Data updated successfully." type="success" onClose={() => setShowAlert(false)} />}
            </div>
            {!google && 
                <>
                    <h2 className="cards-title">Case Data</h2>
                    <div className="cards">
                        {renderCards()}
                    </div>
                    <h2 className="cards-title">Lead Data</h2>
                    <div className="cards">
                        <LeadStatusComponent startDate={startDate} endDate={endDate} refreshTrigger={refreshTrigger} />
                    </div>
                </>
            }
            <h2 className="cards-title">Google Ads Data</h2>
            <div className="cards">
                <GoogleAdsComponent 
                    startDate={startDate}
                    endDate={endDate}
                    refreshTrigger={refreshTrigger}
                    setCampaignNames={setCampaignNames}
                    filteredCampaigns={filteredCampaigns}
                />
            </div>
        </div>
    );
};

export default Dashboard;