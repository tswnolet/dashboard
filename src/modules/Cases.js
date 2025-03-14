import React, { useState, useEffect } from 'react';
import { CreateCase } from './CreateCase';

export const Cases = () => {
    const [createCase, setCreateCase] = useState(false);
    const [cases, setCases] = useState([]);

    useEffect(() => {
        fetchCases();
    }, [createCase]);

    const fetchCases = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/cases.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCases(data.cases);
        } catch (error) {
            console.error("Error fetching cases:", error);
        }
    };
    
    return (
        <div className='page-container'>
            <div id='page-header'>
                <h1>Cases</h1>
                <button className='action' onClick={() => setCreateCase(true)}>Create Case</button>
            </div>
            {createCase && <CreateCase setCreateCase={setCreateCase} />}
        </div>
    );
};