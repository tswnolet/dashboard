import React, { useState, useEffect, useRef } from "react";
import { IconMap } from "./IconMap";

export const CaseNav = ({ sections, activeSection, setActiveSection }) => {
    const [minimize, setMinimize] = useState(sections.some(
        (section) => section.id === activeSection && (section.name === "Documents" || section.name === "Activity Feed")
    ) || window.innerWidth <= 768);
    const hoverTimeout = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setMinimize(true);
                handleLeave();
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

    const handleMinimize = () => {
        if (sections.some(
            (section) => section.id === activeSection && (section.name === "Documents" || section.name === "Activity Feed")
        ) || window.innerWidth <= 768) {
            setMinimize(true);
        } else {
            setMinimize(false);
        }
    }

    useEffect(() => {
        if (sections.some(
            (section) => section.id === activeSection && (section.name === "Documents" || section.name === "Activity Feed")
        ) || window.innerWidth <= 768) {
            setMinimize(true);
        } else {
            setMinimize(false);
        }
    }, [activeSection, sections]);

    const handleHover = () => {
        if (window.innerWidth > 768) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = setTimeout(() => {
                setMinimize(false);
            }, 500);
        }
    };
    
    const handleLeave = () => {
        clearTimeout(hoverTimeout.current);
        handleMinimize();
    };

    return (
        <div
            className={`case-nav ${minimize ? 'minimized' : ''}`}
            onMouseOver={handleHover}
            onMouseLeave={handleLeave}
        >
            {!minimize && <h3>Case Sections</h3>}
            {sections?.map((section, index) => (
                <div key={index} title={section.name} className={`case-nav-item subtext large ${activeSection === section.id ? 'active' : ''} ${index === 0 ? ' s1' : ''}`} onClick={() => setActiveSection(section.id)}>
                    <span >{IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <></>}</span>{minimize ? '' : section.name}
                </div>
            ))}
        </div>
    );
};