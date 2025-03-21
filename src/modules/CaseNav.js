import React, { useState, useEffect } from "react";
import { IconMap } from "./IconMap";

export const CaseNav = ({ sections, activeSection, setActiveSection }) => {

    return (
        <div className='case-nav'>
            <h3>Case Sections</h3>
            {sections?.map((section, index) => (
                <div key={index} className={`case-nav-item subtext large ${activeSection === section.id ? 'active' : ''}`} onClick={() => setActiveSection(section.id)}>
                    <span >{IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <></>}</span>{section.name}
                </div>
            ))}
        </div>
    );
};