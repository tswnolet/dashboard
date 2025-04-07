import React, { useState, useEffect, useRef } from "react";
import { IconMap } from "./IconMap";
import { useLocation } from "react-router";

export const CaseNav = ({ sections, activeSection, setActiveSection }) => {
    const [minimize, setMinimize] = useState(sections.some(
        (section) => section.id === activeSection && (section.name === "Documents" || section.name === "Activity Feed")
    ) || window.innerWidth <= 768);
    const hoverTimeout = useRef(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sectionParam = sections.filter(section => section.name === params.get("section"))[0]?.id;
    
        if (sectionParam) {
            const sectionId = Number(sectionParam);
            if (!isNaN(sectionId)) {
                setActiveSection(sectionId);
            }
    
            params.delete("section");
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl.endsWith('?') ? newUrl.slice(0, -1) : newUrl);
        }
    }, [location]);

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
                <div 
                    key={index} 
                    title={section.name} 
                    className={`case-nav-item subtext large ${activeSection === section.id ? 'active' : ''} ${index === 0 ? ' s1' : ''}`} 
                    onClick={() => setActiveSection(section.id)}
                >
                    <span >{IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <></>}</span>{minimize ? '' : section.name}
                </div>
            ))}
        </div>
    );
};