import React, { useState, useEffect } from "react";
import Card from "./Card";
import "../Dashboard.css";
import Loading from "./Loading";

const GoogleAdsComponent = ({ startDate, endDate }) => {
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        ctr: 0,
        average_cpc: 0
    });
    const [campaigns, setCampaigns] = useState([]);

    const adsColors = ['#176BEF', '#FF3E30', '#F7B529', '#179C52', '#8A3FFC', '#03A9F4', '#009688', '#8BC34A', '#FFEB3B', '#795548', '#607D8B'];

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
                const totalImpressions = result.data.reduce((sum, item) => sum + item.impressions, 0);
                const totalClicks = result.data.reduce((sum, item) => sum + item.clicks, 0);
                const totalConversions = result.data.reduce((sum, item) => sum + item.conversions, 0);
                const totalCost = result.data.reduce((sum, item) => sum + parseFloat(item.cost_usd.replace(/,/g, '')), 0);
                const totalCtr = totalClicks / totalImpressions;
                const totalAverageCpc = totalCost / totalClicks;

                setTotals({
                impressions: totalImpressions,
                clicks: totalClicks,
                conversions: totalConversions,
                cost: totalCost,
                ctr: totalCtr,
                average_cpc: totalAverageCpc
                });

                setCampaigns(result.data.filter(campaign => campaign.impressions > 0));
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

    
    if(!loading) {
        return (
            <>
                <Card data={{ title: "Total Impressions - Google Ads", data: totals.impressions.toLocaleString() }} />
                <Card data={{ title: "Total Clicks - Google Ads", data: totals.clicks.toLocaleString() }} />
                <Card data={{ title: "Total Conversions - Google Ads", data: totals.conversions.toFixed(0).toLocaleString() }} />
                <Card data={{ title: "Total Cost - Google Ads", data: `$${totals.cost.toLocaleString()}` }} />
                <Card data={{ title: "Average CTR - Google Ads", data: `${(totals.ctr * 100).toFixed(2)}%` }} />
                <Card data={{ title: "Average CPC - Google Ads", data: `$${totals.average_cpc.toFixed(2)}` }} />
                {campaigns.map((campaign, index) => (
                        <Card data={{
                                title: `${campaign.campaign_name} - Ads Campaign`, 
                                data: {
                                    'Impressions': campaign.impressions.toLocaleString(),
                                    'Clicks': campaign.clicks.toLocaleString(),
                                    'Conversions': campaign.conversions.toFixed(0).toLocaleString(),
                                    'Cost': [campaign.cost_usd, (parseFloat(campaign.cost_usd.replace(/,/g, '')) / campaign.clicks).toFixed(2)],
                                    'CTR': (campaign.clicks / campaign.impressions * 100).toFixed(2) + '%',
                                },
                                col: 2,
                                row: 1
                            }}
                            type="list"
                            styling={adsColors}
                            key={index}
                        />
                ))}
            </>
        );
    } else {
        return <Loading />
    };
};

export default GoogleAdsComponent;