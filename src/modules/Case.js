import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CaseNav } from "./CaseNav";
import { CaseHeader } from "./CaseHeader";
import { Section } from "./Section";

export const Case = ({ user_id }) => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState({});
    const [sections, setSections] = useState([]);
    const [activeSection, setActiveSection] = useState(1);
    const [folders, setFolders] = useState({});

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/documents.php?case_id=${caseData?.case?.case_id}&${new Date().getTime()}`);
            const data = await response.json();
            if (data.success) {
                setFolders(data.folders || {});
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        }
    };

    const fetchCase = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/cases.php?id=${id}`);
            const data = await response.json();
            setCaseData(data);
            fetchSections(data.case.template_id);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSections = async (id) => {
        try {
            const response = await fetch(`https://api.casedb.co/sections.php?template_id=${id}`);
            const data = await response.json();
            setSections(data.sections);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCase();
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [caseData]);

    useEffect(() => {
        setActiveSection(sections[0]?.id);
    }, [sections])

    return (
        <div className='case-container'>
            <CaseNav sections={sections} activeSection={activeSection} setActiveSection={setActiveSection} />
            <div className='case-body'>
                <CaseHeader caseData={caseData} fetchCase={fetchCase}/>
                <Section key={activeSection} user_id={user_id} lead_id={caseData?.lead?.id} id={id} caseName={caseData?.case?.case_name} fetchDocuments={fetchDocuments} folders={folders} caseType={caseData?.lead?.case_type_id} section_id={activeSection} template_id={caseData?.case?.template_id}/>
            </div>
        </div>
    );
};

export default Case;
