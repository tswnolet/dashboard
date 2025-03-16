import React, { useState, useEffect, useRef } from 'react';
import { CreateCase } from './CreateCase';
import '../styles/Cases.css';
import { useNavigate } from 'react-router';
import { Info } from 'lucide-react';
import { CaseSidebar } from './CaseSidebar';

export const Cases = () => {
    const [createCase, setCreateCase] = useState(false);
    const [cases, setCases] = useState([]);
    const [displaySidebar, setDisplaySidebar] = useState(null);
    const nameRef = useRef(null);
    const navigate = useNavigate();
    const [displayHeaders, setDisplayHeaders] = useState({
        case_name: true,
        status: true,
        tags: true,
        created_at: true,
        last_updated: true
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateDisplayHeaders = () => {
            const width = window.innerWidth;

            setDisplayHeaders({
                case_name: true,
                status: true,
                tags: width > 768,
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
            const response = await fetch(`https://dalyblackdata.com/api/cases.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCases(data);
        } catch (error) {
            console.error("Error fetching cases:", error);
        }
    };

    const formatDate = (date) => {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const dateObject = new Date(date);
        return [months[dateObject.getMonth()] + " " + dateObject.getDate() + ", " + dateObject.getFullYear(), dateObject.toLocaleString(), dateObject.toLocaleTimeString()];
    };

    const handleMouseMove = (event) => {
        setTooltipPos({ x: event.clientX + 10, y: event.clientY });
    };

    const handleClick = (event, id) => {
        if (!nameRef.current.contains(event.target)) {
            setDisplaySidebar(id);
        }
    }

    useEffect(() => {
        console.log(displaySidebar);
    },[displaySidebar]);

    return (
        <div className='page-container case-container'>
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
                                    Status
                                    <Info 
                                        size={16} 
                                        className='info-icon'
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={() => setShowTooltip(false)}
                                    />
                                </th>
                                {displayHeaders.created_at && <th>Created</th>}
                                {displayHeaders.last_updated && <th>Last Updated</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((c, index) => (
                                <tr key={index} className='case' onClick={(event) => {
                                    if(displayHeaders.created_at) handleClick(event, displaySidebar === c.id ? null : c.id);
                                    else navigate(`/case/${c.id}`);
                                }}>
                                    <td className='case-name' title={`Case ID: ${c.id}`} onClick={() => navigate(`/case/${c.id}`)} ref={nameRef}>
                                        {c.contact_display.includes('uploads')
                                            ? <img className='contact-initials' src={`https://dalyblackdata.com/api/${c.contact_display}`} alt="Profile" />
                                            : <span className='contact-initials'>{c.contact_display}</span>
                                        }
                                        {c.case_name}
                                        {displayHeaders.tags && c.tags && <span className='tag caps'>
                                            # {Object.entries(JSON.parse(c.tags)).map(([key, value], index) => value)}
                                        </span>}
                                    </td>
                                    <td>{c.status}</td>
                                    {displayHeaders.last_updated && <td>{formatDate(c.create_date)[0]}</td>}
                                    {displayHeaders.last_updated && <td>{formatDate(c.updated_at)[0]}, {formatDate(c.updated_at)[2]}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {showTooltip && (
                        <div className="tooltip" style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}>
                            This column represents the current case status (aka "phase").
                        </div>
                    )}
                    {displaySidebar && (
                        <CaseSidebar id={displaySidebar}/>
                    )}
                </div>
            {createCase && <CreateCase setCreateCase={setCreateCase} />}
        </div>
    );
};