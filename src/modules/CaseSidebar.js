import { Activity, Dot } from "lucide-react";
import React, { useState, useEffect } from "react";

const Vital = ({ label, value }) => {
    return (
        <div className='sidebar-vital'>
            <span className='subtext'>{label}:</span>
            <span className='subtext'>
                {value}
            </span>
        </div>
    );
};

export const CaseSidebar = ({ id, cases, caseTemplates, caseTypes, formatDate }) => {
    const caseData = cases.filter((c) => c.id === id)[0] ?? {};

    console.log(caseTypes);

    console.log("");

    return (
        <div className='case-sidebar'>
            <div className='case-sidebar-header'>
                {caseData.contact_display && caseData.contact_display.includes('uploads')
                    ? <img className='contact-initials large' src={`https://dalyblackdata.com/api/${caseData.contact_display}`} alt="Profile" />
                    : <span className='contact-initials large'>{caseData.contact_display || 'N/A'}</span>
                }
                <div className="case-info">
                    <div className='case-name'>
                        {caseData.case_name}
                    </div>
                    <div className='case-id subtext'>
                        {caseData.id}
                    </div>
                </div>
            </div>
            <div className='case-sidebar-breakdown subtext'>
                {caseTemplates.filter((template) => template.id === caseData.template_id).length >= 1 
                    ? caseTemplates.filter((template) => template.id === caseData.template_id)[0].name 
                    : null}
                {caseData.phase_name ? (<><Dot size={16} /> {caseData.phase_name}</>) : null}
                {caseData.team?.first_primary ? (<><Dot size={16} /> {caseData.caseData.team?.first_primary}</>) : null}
                {caseData.create_date ? (<><Dot size={16} /> Created: {formatDate(caseData.create_date)[0]}</>) : null}
                {caseData.updated_at ? (<><Dot size={16} /> Last Activity: {formatDate(caseData.updated_at)[0]} {formatDate(caseData.updated_at)[2]}</>) : null}
            </div>
            <div className="divider horizontal"></div>
            <div className='case-sidebar-vitals'>
                <div className='sidebar-vital-header'><Activity size={16}/>{" "}Vitals</div>
                <Vital label='Case Type' value={caseTypes.map((type) => type.id === caseData.case_type_id ? type.name : null)} />
                <Vital 
                    label={`Type of ${caseTypes.filter((type) => type.id === caseData.case_type_id)[0].name} Case`}
                    value={JSON.parse(caseData.lead_updates_data).filter((data) => data.field_name === `Type of ${caseTypes.filter((type) => type.id === caseData.case_type_id)[0].name} Case`)[0]?.value} />
                <Vital label='Incident Date' value={formatDate(caseData.incident_date)[0]} />
                <Vital label='First Primary' value={caseData.team?.first_primary} />
                <Vital label='Referred To (Full Name)' value={caseData.referred_to} />
                <Vital label='Mediation Date' value={caseData.referred_to} />
            </div>
        </div>
    );
};