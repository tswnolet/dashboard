import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CaseNav } from "./CaseNav";
import { CaseHeader } from "./CaseHeader";

export const Case = () => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState({});
    const [sections, setSections] = useState([]);

    const fetchCase = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/cases.php?id=${id}`);
            const data = await response.json();
            setCaseData(data);
            fetchSections(data.case.template_id);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSections = async (id) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/sections.php?template_id=${id}`);
            const data = await response.json();
            setSections(data.sections);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCase();
    }, []);

    return (
        <div className='case-container'>
            <CaseNav sections={sections}/>
            <CaseHeader caseData={caseData}/>
        </div>
    );
};

export default Case;
