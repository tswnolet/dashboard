import React, { useState, useEffect } from "react";

export const CaseSidebar = ({ id }) => {
    const [caseData, setCaseData] = useState({});

    useEffect(() => {
        fetchCaseDetails(id);
    }, [id]);
    
    const fetchCaseDetails = async (id) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/cases.php?id=${id}`);
            const data = await response.json();
            setCaseData(data);
        } catch (error) {
            console.error("Error fetching case details:", error);
        }
    };

    return (
        <div className='case-sidebar'>
            <div className='case-name'>
                {caseData.case_name}
            </div>
        </div>
    );
};