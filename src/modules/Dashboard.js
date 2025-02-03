import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, TextField } from '@mui/material';
import Loading from './Loading';
import Card from './Card';
import Cookies from '../modules/Cookies';
import { Filter } from './Filter';
// import Refresh from './Refresh'; // Remove this line
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
            const response = await fetch(`https://dalyblackdata.com/api/dashdata.php${startDate ? ("?startDate=" + startDate + (endDate ? "&endDate=" + endDate : "")) : endDate ? "?endDate=" + endDate : ""}`);
            const result = await response.json();
    
            if (result.success) {
                setStats({
                    totalSettlement: result.totalSettlement ?? "No Data",
                    casesByLocation: result.casesByLocation ?? {},
                    casesByPracticeType: result.casesByPracticeType ?? {},
                    casesByStatus: result.casesByStatus ?? {},
                    casesVsSettlements: result.casesVsSettlements ?? {},
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
    }, [startDate, endDate]);

    return (
        <Box id='dashboard' className='page-container'>
            <Cookies />
            <Box className='data-action-container'>
                <Box className='filter-container'>
                    <Button 
                        variant="contained" 
                        startIcon={<Filter />} 
                        onClick={() => setShowDateInputs(!showDateInputs)}
                    >
                        Filter
                    </Button>
                    {showDateInputs && (
                        <Box id='filter-items'>
                            <TextField 
                                type="date" 
                                className="date-input" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                margin="normal"
                            />
                            <Typography variant="body1">to</Typography>
                            <TextField 
                                type="date" 
                                className="date-input" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                margin="normal"
                            />
                        </Box>
                    )}
                </Box>
                <IconButton title='Refresh data' id='refresh' onClick={fetchStats} className={refreshing ? 'spinning' : ''}>
                    {/* Replace with a placeholder */}
                    <span>🔄</span>
                </IconButton>
                {showAlert && <Alert message="Data updated successfully." type="success" onClose={() => setShowAlert(false)} />}
            </Box>
            <Box className="cards">
                <Card data={{ title: "Cases by Location", data: stats.casesByLocation }} type="pie" />
                <Card data={{ title: "Cases by Practice Type", data: stats.casesByPracticeType }} type="v-bar" />
                <Card 
                    data={{ title: "Settlements Over Time", data: stats.settlementsOverTime }}
                    secondData={Object.fromEntries(
                        Object.entries(stats.settlementsOverTime ?? {}).map(([key, value]) => [key, value?.adjustedSettlement ?? 0])
                    )}
                    type="line"
                    yAxisLabel="money"
                />
                <Card data={{ title: "Case Outcome Breakdown", data: stats.caseOutcomes }} type="v-bar" />
                <Card data={{ title: "Total Adjusted Settlement Value", data: stats.totalSettlement, col: 1, row: 2}} />
                <Card data={{ title: "New Cases vs Settlements", data: stats.casesVsSettlements ?? {} }} type="h-bar" />
                <Card data={{ title: "Average Settlement by Practice Type", data: stats.avgSettlementByPractice ?? {} }} type="v-bar" format="f" />
                <Card
                    data={{ title: "New Cases vs Closed Cases Over Time", data: stats.casesOpenedVsClosed ?? {} }} 
                    type="line" 
                    secondData={Object.fromEntries(
                        Object.entries(stats.casesOpenedVsClosed ?? {}).map(([key, value]) => [key, value?.[1] ?? 0])
                    )}
                    yAxisLabel="count"
                />
                <Card data={{ title: "Case Duration Analysis", data: stats.caseDuration, col: 2, row: 2 }} type="h-bar" />
                <GoogleAdsComponent startDate={startDate} endDate={endDate}/>
                <LeadStatusComponent startDate={startDate} endDate={endDate} />
            </Box>
        </Box>
    );
};

export default Dashboard;