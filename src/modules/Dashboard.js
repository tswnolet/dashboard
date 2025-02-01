import React, { useEffect, useState } from 'react';
import '../Dashboard.css';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import { Filter } from './Filter';
import Refresh from './Refresh';
import Alert from './Alert';
import GoogleAdsComponent from './GoogleAdsComponent';
import LeadStatusComponent from './LeadStatusComponent';
import LineGraph from './LineGraph';

const Dashboard = ({ setLoggedIn }) => {
    const [loading, setLoading] = useState(true);
    const [showDateInputs, setShowDateInputs] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalSettlement: null,
        casesByLocation: {},
        casesByPracticeType: {},
        casesByStatus: {},
        leadsVsCases: {},
        settlementsOverTime: {},
        caseDuration: {},
    });

    const fetchStats = async (manual = false) => {
        setRefreshing(true);
        const startTime = Date.now();

        try {
            const response = await fetch('https://dalyblackdata.com/api/dashdata.php');
            const result = await response.json();
    
            if (result.success) {
                setStats({
                    totalSettlement: result.totalSettlement ?? "No Data",
                    casesByLocation: result.casesByLocation ?? {},
                    casesByPracticeType: result.casesByPracticeType ?? {},
                    casesByStatus: result.casesByStatus ?? {},
                    leadsVsCases: result.leadsVsCases ?? {},
                    settlementsOverTime: result.settlementsOverTime ?? {},
                    casesByOffice: result.casesByOffice ?? {},
                    caseOutcomes: result.caseOutcomes ?? {},
                    avgSettlementByPractice: result.avgSettlementByPractice ?? {},
                    casesOpenedVsClosed: Object.fromEntries(
                        Object.entries(result.casesOpenedVsClosed ?? {}).map(([key, value]) => [key, value ?? [0, 0]])
                    ),
                    caseDuration: result.caseDuration ?? {},
                });
            } else {
                console.error("Error fetching settlement data:", result.message);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }

        const elapsedTime = Date.now() - startTime;
        const minSpinTime = 500;
        setTimeout(() => {
            setRefreshing(false);
            if(manual) setShowAlert(true);
        }, Math.max(0, minSpinTime - elapsedTime));
    };    

    useEffect(() => {
        fetchStats();
    }, []);

    const transformedSecondData = Object.fromEntries(
        Object.entries(stats.casesOpenedVsClosed ?? {}).map(([key, value]) => [key, value?.[1] ?? 0])
    );
    
    console.log("📊 Original Data:", stats);
    return (
        <div id='dashboard' className='page-container'>
            <Cookies />
            <div className='data-action-container'>
                <div className='filter-container'>
                    <button id='filter-button' 
                        onClick={() => setShowDateInputs(!showDateInputs)}
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
                <button title='Refresh data' id='refresh' onClick={fetchStats} className={refreshing ? 'spinning' : ''}>
                    <Refresh />
                </button>
                {showAlert && <Alert message="Data updated successfully." type="success" onClose={() => setShowAlert(false)} />}
            </div>
            <div className="cards">
                <Card data={{ title: "Cases by Location", data: stats.casesByLocation }} type="pie" />
                <Card data={{ title: "Cases by Practice Type", data: stats.casesByPracticeType }} type="v-bar" />
                <Card data={{ title: "Settlements Over Time", data: stats.settlementsOverTime }} type="line" yAxisLabel="money" />
                <Card data={{ title: "Case Outcome Breakdown", data: stats.caseOutcomes }} type="v-bar" />
                <Card data={{ title: "Total Adjusted Settlement Value", data: stats.totalSettlement, col: 1, row: 2}} />
                <Card data={{ title: "Leads vs Cases by Month", data: stats.leadsVsCases ?? {} }} type="h-bar" />
                <Card data={{ title: "Average Settlement by Practice Type", data: stats.avgSettlementByPractice ?? {} }} type="v-bar" />
                <Card 
                    data={{ title: "New Cases vs Closed Cases Over Time", data: stats.casesOpenedVsClosed ?? {} }} 
                    type="line" 
                    secondData={Object.fromEntries(
                        Object.entries(stats.casesOpenedVsClosed ?? {}).map(([key, value]) => [key, value?.[1] ?? 0])
                    )}
                    yAxisLabel="count"
                />
                <Card data={{ title: "Case Duration Analysis", data: stats.caseDuration, col: 2, row: 2 }} type="h-bar" />
                <GoogleAdsComponent />
                <LeadStatusComponent startDate={startDate} endDate={endDate} />
            </div>
        </div>
    );
};

export default Dashboard;