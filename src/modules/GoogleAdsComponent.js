import React, { useState, useEffect } from "react";
import Card from "./Card";
import "../Dashboard.css";

const GoogleAdsComponent = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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
                setData(result.data);
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
        <div className="page-container">
            <h2>Google Ads Data</h2>
            <div className="filter-container">
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                />
                <h4>to</h4>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                />
                <button onClick={fetchData}>Filter</button>
            </div>
            
            {loading ? <p>Loading...</p> : (
                <div className="cards">
                    {data.map((item) => (
                        <Card key={item.campaign_id} data={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GoogleAdsComponent;