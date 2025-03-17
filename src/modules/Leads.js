import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import '../styles/Leads.css';
import { Text, NumberInput, DateInput, Dropdown, Boolean } from "./FieldComponents";
import { useMemo } from "react";
import { Star } from "lucide-react";
import { StarOutlineSharp, StarRate, StarRateOutlined, StarRateSharp, StarSharp, TheaterComedyTwoTone } from "@mui/icons-material";
import { CreateLead } from "./CreateLead";

export const Leads = ({ user }) => {
    const [leads, setLeads] = useState([]);
    const [createLead, setCreateLead] = useState(false);
    const [displayHeaders, setDisplayHeaders] = useState({
        assigned_to: true,
        created_at: true,
        case_type: true,
        marketing_source: true,
        case_likelihood: true,
        office: true
    });

    const caseLikelihood = ["No Case", "Unlikely Case", "Possible Case", "Likely Case", "Very Likely Case"];

    const fetchLeads = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/leads.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setLeads(data.leads);
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("new") === "true") {
            setCreateLead(true);
        }
    }, []);

    const getDaysSinceCreation = (createdAt) => {
        if (!createdAt) return "N/A";
    
        const createdDate = new Date(createdAt);
        const currentDate = new Date();
        const timeDiff = currentDate - createdDate;
        const daysSince = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
        switch (daysSince) {
            case 0:
                return "<1 day ago";
            case 1:
                return "1 day ago";
            default:
                break;
        }
        return `${daysSince} days ago`;
    };

    useEffect(() => {
        const updateDisplayHeaders = () => {
            const width = window.innerWidth;

            setDisplayHeaders({
                name: true,
                status: true,
                office: width > 1350,
                case_likelihood: width > 1150,
                marketing_source: width > 1026,
                assigned_to: width > 768,
                created_at: width > 600,
                case_type: width > 500
            });
        };

        window.addEventListener("resize", updateDisplayHeaders);
        updateDisplayHeaders();

        return () => window.removeEventListener("resize", updateDisplayHeaders);
    }, []);

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [createLead]);

    return (
        <>
            <div className='page-container'>
                <div id='page-header'>
                    <h1>Leads</h1>
                    <button className='action' onClick={() => setCreateLead(true)}>Create Lead</button>
                </div>
                <table className='leads-table'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            {displayHeaders.assigned_to && <th>Assigned To</th>}
                            <th>Status</th>
                            {displayHeaders.created_at && <th>Days Since Creation</th>}
                            {displayHeaders.case_type && <th>Case Type</th>}
                            {displayHeaders.marketing_source && <th>Marketing Source</th>}
                            {displayHeaders.case_likelihood && <th>Likelihood</th>}
                            {displayHeaders.office && <th>Office</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? (
                            leads.map((lead, index) => (
                                <tr key={lead.id} className='lead'>
                                    <td className='stacked'>
                                        {lead.contact_name}{" "}
                                        {displayHeaders.case_type && (
                                            <span className='subtext'>
                                                {lead?.preferred_contact != null && Object.values(lead.detail_data).length > 0
                                                    ? `(${lead.preferred_contact === "email"
                                                        ? lead.detail_data?.email?.email
                                                        : lead.preferred_contact === "phone"
                                                            ? lead.detail_data?.phone?.number
                                                            : ""})`
                                                    : ""}
                                            </span>
                                        )}
                                    </td>
                                    {displayHeaders.assigned_to && <td>{lead.assigned_to}</td>}
                                    <td>{lead.status_name}</td>
                                    {displayHeaders.created_at && (
                                        <td title={lead.created_at}>{getDaysSinceCreation(lead.created_at)}</td>
                                    )}
                                    {displayHeaders.case_type && <td>{lead.case_type_name}</td>}
                                    {displayHeaders.marketing_source && (
                                        <td className='stacked'>
                                            {lead.marketing_source_name}
                                            {lead.referral_contact && (
                                                <span className='subtext'>({lead.referral_contact})</span>
                                            )}
                                        </td>
                                    )}
                                    {displayHeaders.case_likelihood && (
                                        <td title={`${lead.case_likelihood} - ${caseLikelihood[lead.case_likelihood - 1]}`}>
                                            {Array.from({ length: lead.case_likelihood }, (_, index) => (
                                                <StarSharp key={index} className="star-icon" />
                                            ))}
                                            {Array.from({ length: 5 - lead.case_likelihood }, (_, index) => (
                                                <StarOutlineSharp key={index} className="star-icon empty" />
                                            ))}
                                        </td>
                                    )}
                                    {displayHeaders.office && <td>{lead.office_name}</td>}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-data">No leads found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {createLead && (
                <CreateLead user={user} fetchLeads={fetchLeads} createLead={createLead} setCreateLead={setCreateLead}/>
            )}
        </>
    );
};