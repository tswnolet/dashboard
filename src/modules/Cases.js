import React, { useState, useEffect, useRef } from 'react';
import { CreateCase } from './CreateCase';
import '../styles/Cases.css';
import { useNavigate } from 'react-router';
import { Info } from 'lucide-react';
import { CaseSidebar } from './CaseSidebar';

export const Cases = ({ user }) => {
    const [createCase, setCreateCase] = useState(false);
    const [cases, setCases] = useState([]);
    const [displaySidebar, setDisplaySidebar] = useState(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();
    const [caseTemplates, setCaseTemplates] = useState([]);
    const [displayHeaders, setDisplayHeaders] = useState({
        case_name: true,
        phase: true,
        tags: true,
        created_at: true,
        last_updated: true
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [caseTypes, setCaseTypes] = useState([]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("new") === "true") {
            setCreateCase(true);
        }

        const updateDisplayHeaders = () => {
            const width = window.innerWidth;

            setDisplayHeaders({
                case_name: true,
                phase: true,
                tags: width > 768,
                case_type: width > 968,
                created_at: width > 1350,
                last_updated: width > 1150,
            });
        };

        window.addEventListener("resize", updateDisplayHeaders);
        updateDisplayHeaders();

        return () => window.removeEventListener("resize", updateDisplayHeaders);
    }, []);

    useEffect(() => {
        fetchCases();
    }, [createCase]);

    const fetchCases = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/cases.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCases(data);
        } catch (error) {
            console.error("Error fetching cases:", error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return ["Invalid Date", "", ""];
    
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    
        const dateObject = new Date(dateString.replace(" ", "T") + "Z");  
    
        return [
            `${months[dateObject.getUTCMonth()]} ${dateObject.getUTCDate()}, ${dateObject.getUTCFullYear()}`,
            dateObject.toISOString(),
            dateObject.toUTCString().split(" ")[4]
        ];
    };

    const handleMouseMove = (event) => {
        setTooltipPos({ x: event.clientX + 10, y: event.clientY });
    };

    const handleClick = (id) => {
        setDisplaySidebar((prevId) => (prevId === id ? null : id));
    };
    
    const fetchCaseTemplates = async () => {
        try {
            const response = await fetch("https://api.casedb.co/layout.php");

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setCaseTemplates(data.templates);

        } catch (error) {
            console.error("Error fetching case templates:", error);
        }
    };

    const fetchCaseTypes = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/custom_fields.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCaseTypes(data.case_types);
        } catch (error) {
            console.error("Error fetching case types:", error);
        }
    };

    useEffect(() => {
        fetchCaseTemplates();
        fetchCaseTypes();
    }, []);

    return (
        <div className='page-container case-page'>
                <div id='page-header'>
                    <h1>Cases</h1>
                    <button className='action' onClick={() => setCreateCase(true)}>Create Case</button>
                    <div className='active-cases subtext'>
                        <p>Active Cases: {cases.length}</p>
                    </div>
                </div>
                <div className='case-page-container'>
                    <table className='cases-table'>
                        <thead>
                            <tr>
                                <th className='case-name'>Case Name</th>
                                <th>
                                    Phase
                                    <Info 
                                        size={16} 
                                        className='info-icon'
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={() => setShowTooltip(false)}
                                    />
                                </th>
                                {displayHeaders.case_type && <th>Case Type</th>}
                                {displayHeaders.created_at && <th>Created</th>}
                                {displayHeaders.last_updated && <th>Last Updated</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((c, index) => (
                                <tr key={index} className='case' onClick={(event) => {
                                    if(displayHeaders.created_at) handleClick(c.case_id);
                                    else navigate(`/case/${c.case_id}`);
                                }}>
                                    <td className='case-name' title={`Case ID: ${c.id}`} onClick={() => navigate(`/case/${c.case_id}`)} ref={nameRef}>
                                        {c.contact_display.includes('uploads')
                                            ? <img className='contact-initials' src={`https://api.casedb.co/${c.contact_display}`} alt="Profile" />
                                            : <span className='contact-initials'>{c.contact_display}</span>
                                        }
                                        {c.case_name}
                                        {displayHeaders.tags && Array.isArray(JSON.parse(c.tags)) && JSON.parse(c.tags).length > 0 && <span className='tag caps'>
                                            # {Object.entries(JSON.parse(c.tags)).map(([key, value]) => value)}
                                        </span>}
                                    </td>
                                    <td>{c.phase_name}</td>
                                    {displayHeaders.case_type && <td>{caseTypes.find((type) => type.id === c.lead_data.case_type_id)?.name}</td>}
                                    {displayHeaders.created_at && <td>{formatDate(c.create_date)[0]}</td>}
                                    {displayHeaders.last_updated && <td>{formatDate(c.updated_at)[0]}, {formatDate(c.updated_at)[2]}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showTooltip && (
                        <div className="tooltip" style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}>
                            This column represents the current case phase (aka "status").
                        </div>
                    )}
                    {displaySidebar && (
                        <CaseSidebar key={displaySidebar} id={displaySidebar} cases={cases} caseTemplates={caseTemplates} fetchCases={fetchCases} caseTypes={caseTypes} formatDate={formatDate} />
                    )}
                </div>
            {createCase && <CreateCase user={user} setCreateCase={setCreateCase} fetchCases={fetchCases} caseTemplates={caseTemplates} />}
        </div>
    );
};