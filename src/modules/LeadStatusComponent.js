import React, { useEffect, useState, useRef } from "react";
import Card from "./Card";
import "../Dashboard.css";

const LeadStatusComponent = ({ startDate, endDate, refreshTrigger }) => {
    const [statusData, setStatusData] = useState({});
    const [datesSet, setDatesSet] = useState(false);
    const timerRef = useRef(null);

    const fetchLeadStatuses = async () => {
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
    };

    useEffect(() => {
        setDatesSet(true);
    }, [startDate, endDate, refreshTrigger]);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (datesSet) {
            timerRef.current = setTimeout(() => {
                fetchLeadStatuses();
            }, 2000);
        }

        return () => clearTimeout(timerRef.current);
    }, [datesSet, startDate, endDate]);

    return (
        <Card
            data={{
                title: "Lead Status Breakdown",
                data: statusData,
                row: 4
            }}
            type="v-bar"
        />
    );
};

export default LeadStatusComponent;