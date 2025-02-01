import React, { useEffect, useState } from "react";
import VBarChart from "./VBarChart";
import Card from "./Card"; // Ensure Card is imported
import "../Dashboard.css";

const LeadStatusComponent = ({ startDate, endDate }) => {
    const [statusData, setStatusData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeadStatuses = async () => {
            setLoading(true);
            try {
                let url = "https://dalyblackdata.com/api/leaddocket.php";
        
                if (startDate && endDate) {
                    url += `?start_date=${startDate}&end_date=${endDate}`;
                }

                const response = await fetch(url);
                const result = await response.json();

                if (result.success) {
                    setStatusData(result.statusCounts);
                } else {
                    console.error("Error fetching lead status data:", result.error);
                    setStatusData({});
                }
            } catch (error) {
                console.error("Fetch error:", error);
                setStatusData({});
            }
            setLoading(false);
        };

        fetchLeadStatuses();
    }, [startDate, endDate]); // Refetch when dates change

    return (
        <Card 
            data={{ 
                title: "Lead Status Breakdown", 
                data: statusData 
            }} 
            type="v-bar"
        />
    );
};

export default LeadStatusComponent;