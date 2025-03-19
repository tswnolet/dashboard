import React, { useState, useEffect } from "react";
import { IconMap } from "./IconMap";

export const CaseNav = ({ sections }) => {
    const [activeSection, setActiveSection] = useState(0);

    return (
        <div className='case-nav'>
            <h3>Case Sections</h3>
            {sections?.map((section, index) => (
                <div key={index} className={`case-nav-item subtext large ${activeSection === index ? 'active' : ''}`} onClick={() => setActiveSection(index)}>
                    <span >{IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <></>}</span>{section.name}
                </div>
            ))}
        </div>
    );
};