import React, { useState, useEffect } from "react";
import Card from "./Card";
import "../Dashboard.css";

const GoogleAdsComponent = ({ startDate, endDate, refreshTrigger, setCampaignNames, filteredCampaigns }) => {
    const [totals, setTotals] = useState({
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        ctr: 0,
        average_cpc: 0
    });
    const [campaigns, setCampaigns] = useState([]);
    const urlParams = new URLSearchParams(window.location.search);
    const showData = urlParams.get('keyword') || 'false';

    const adsColors = ['#176BEF', '#FF3E30', '#F7B529', '#179C52', '#8A3FFC'];

    const fetchData = async () => {
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
                const totalCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
                const totalAverageCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
    
                const keywordMap = {};
    
                result.data.forEach(campaign => {
                    if (campaign.top_keywords) {
                        campaign.top_keywords.forEach(keyword => {
                            const text = keyword.keyword_text;
                            if (!keywordMap[text]) {
                                keywordMap[text] = {
                                    ...keyword,
                                    total_conversions: keyword.conversions,
                                };
                            } else {
                                keywordMap[text].total_conversions += keyword.conversions;
                            }
                        });
                    }
                });

                const topKeywordsArray = Object.values(keywordMap)
                    .sort((a, b) => b.total_conversions - a.total_conversions)
                    .slice(0, 10);
    
                console.log("Top Keywords:", topKeywordsArray);
    
                setTotals({
                    impressions: totalImpressions,
                    clicks: totalClicks,
                    conversions: totalConversions,
                    cost: totalCost,
                    ctr: totalCtr,
                    average_cpc: totalAverageCpc,
                    top_keywords: topKeywordsArray,
                });
    
                setCampaigns(result.data.filter(campaign => campaign.impressions > 0));
            } else {
                console.error("Error:", result.error);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    };    

    useEffect(() => {
        if (refreshTrigger > 0) fetchData();
    }, [refreshTrigger]);

    useEffect(() => {
        const uniqueCampaignNames = [...new Set(campaigns.map(campaign => campaign.campaign_name))];
        setCampaignNames(uniqueCampaignNames);
        console.log(campaigns);
    }, [campaigns, setCampaignNames]);

    return (
        <>
            <Card data={{ title: "Total Impressions - Google Ads", data: totals.impressions.toLocaleString() }} />
            <Card data={{ title: "Total Clicks - Google Ads", data: totals.clicks.toLocaleString() }} />
            <Card data={{ title: "Total Conversions - Google Ads", data: totals.conversions.toFixed(0).toLocaleString() }} />
            <Card data={{ title: "Total Cost - Google Ads", data: `$${totals.cost.toLocaleString()}` }} />
            <Card data={{ title: "Average CTR - Google Ads", data: `${(totals.ctr * 100).toFixed(2)}%` }} />
            <Card data={{ title: "Average CPC - Google Ads", data: `$${totals.average_cpc.toFixed(2)}` }} />
            <Card 
                data={{ 
                    title: "Top 10 Keywords (All Campaigns) - Google Ads",
                    data: {keywords: totals.top_keywords},
                    col:4,
                    row:2
                }}
                type="list"
            />
            {campaigns.map((campaign, index) => (filteredCampaigns.length == 0 || filteredCampaigns.includes(campaign.campaign_name)) && (
                <Card 
                    key={index}
                    data={{
                        title: `${campaign.campaign_name} - Ads Campaign`, 
                        data: showData !== 'true' ? {
                            'Impressions': campaign.impressions.toLocaleString(),
                            'Clicks': campaign.clicks.toLocaleString(),
                            'Conversions': campaign.conversions.toFixed(0).toLocaleString(),
                            'Cost': [campaign.cost_usd, (parseFloat(campaign.cost_usd.replace(/,/g, '')) / campaign.clicks).toFixed(2)],
                            'CTR': (campaign.clicks / campaign.impressions * 100).toFixed(2) + '%',
                            keywords: campaign.top_keywords
                        } : {
                            keywords: campaign.top_keywords
                        },
                        col: 4,
                        row: campaign.top_keywords.length > 0 ? showData !== 'true' ? 3 : 2 : 1
                    }}
                    type="list"
                    styling={adsColors}
                />
            ))}
        </>
    );
};

export default GoogleAdsComponent;