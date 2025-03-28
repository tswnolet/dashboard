import React, { useState, useEffect } from "react";
import { IconMap } from "./IconMap";

export const CaseNav = ({ sections, activeSection, setActiveSection }) => {
    const [minimize, setMinimize] = useState(false);
    
    console.log(sections.some(
        (section) => section.id === activeSection && section.name === "Documents"
    ));

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setMinimize(true);
            } else {
                setMinimize(false);
            }
        };        

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (sections.some(
            (section) => section.id === activeSection && section.name === "Documents"
        ) || window.innerWidth <= 768) {
            setMinimize(true);
        } else {
            setMinimize(false);
        }
    })

    return (
        <div className={`case-nav ${minimize ? 'minimized' : ''}`}>
            {!minimize && <h3>Case Sections</h3>}
            {sections?.map((section, index) => (
                <div key={index} title={section.name} className={`case-nav-item subtext large ${activeSection === section.id ? 'active' : ''}`} onClick={() => setActiveSection(section.id)}>
                    <span >{IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <></>}</span>{minimize ? '' : section.name}
                </div>
            ))}
        </div>
    );
};