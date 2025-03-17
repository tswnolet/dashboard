import { Dot } from "lucide-react";
import React, { useState, useEffect } from "react";

export const CaseSidebar = ({ id, cases, caseTemplates, caseTypes, formatDate }) => {
    const caseData = cases.filter((c) => c.id === id)[0] ?? {};

    console.log(caseTemplates.filter((template) => template.id === caseData.template_id))

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
                <div className='sidebar-vital-header'>Vitals</div>
                <div className='sidebar-vital'>
                    <span className='subtext'>Case Type:</span>
                    <span className='subtext'>
                        {caseTypes.map((type) => type.id === caseData.case_type_id ? type.name : null)}
                    </span>
                </div>
                <div className='sidebar-vital'>
                    <span className='subtext'>Intake Date:</span>
                    <span className='subtext'>
                        {formatDate(caseData.created_at.split(" ")[0])[0]}
                    </span>
                </div>
                <div className='sidebar-vital'>
                    <span className='subtext'>Intake Time:</span>
                    <span className='subtext'>
                        {formatDate(caseData.created_at)[2]}
                    </span>
                </div>
                <div className='sidebar-vital'>
                    <span className='subtext'>Incident Date:</span>
                    <span className='subtext'>
                        {formatDate(caseData.incident_date)[0]}
                    </span>
                </div>
                <div className='sidebar-vital'>
                    <span className='subtext'>First Primary:</span>
                    <span className='subtext'>
                        {caseData.team?.first_primary}
                    </span>
                </div>
            </div>
        </div>
    );
};