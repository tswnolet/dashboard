import React, { useState, useEffect } from "react";
import Card from "./Card";
import "../Dashboard.css";

const GoogleAdsComponent = ({ startDate, endDate }) => {
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ impressions: 0, clicks: 0, conversions: 0, cost: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `https://dalyblackdata.com/api/google_ads.php`;
    
            if (startDate && endDate) {
                url += `?start_date=${startDate}&end_date=${endDate}`;
            }
    
            const response = await fetch(url);
            const result = await response.json();
    
            if (result.success) {
                setTotals({
                    impressions: result.data.reduce((sum, item) => sum + item.impressions, 0),
                    clicks: result.data.reduce((sum, item) => sum + item.clicks, 0),
                    conversions: result.data.reduce((sum, item) => sum + item.conversions, 0),
                    cost: result.data.reduce((sum, item) => sum + parseFloat(item.cost_usd.replace(/,/g, '')), 0)
                });
            } else {
                console.error("❌ Error:", result.error);
            }
        } catch (error) {
            console.error("❌ Fetch Error:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    return (
        <>
            <Card data={{ title: "Total Impressions - Google Ads", data: totals.impressions.toLocaleString() }} />
            <Card data={{ title: "Total Clicks - Google Ads", data: totals.clicks.toLocaleString() }} />
            <Card data={{ title: "Total Conversions - Google Ads", data: totals.conversions.toLocaleString() }} />
            <Card data={{ title: "Total Cost - Google Ads", data: `$${totals.cost.toLocaleString()}` }} />
        </>
    );
};

export default GoogleAdsComponent;