import React, { useState, useEffect, useRef } from "react";
import '../styles/LayoutEditor.css';
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";

export const Text = ({ type, placeholder, value, onChange, disable }) => {
    return type === 'text' ? (
        <input type='text' disabled={disable} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    ) : (
        <textarea placeholder={placeholder} disabled={disable} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    );
};

export const Dropdown = ({ options = [], value = "", onChange = () => {} }) => {
    let parsedOptions = [];

    try {
        parsedOptions = Array.isArray(options)
            ? options
            : options 
                ? JSON.parse(options) 
                : [];
    } catch (error) {
        console.error("Dropdown options parsing error:", error);
        parsedOptions = [];
    }

    return (
        <select className='default-select' value={value || ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select...</option>
            {parsedOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
            ))}
        </select>
    );
};

export const Boolean = ({ options, value, onChange }) => {
    let parsedOptions = [];

    try {
        parsedOptions = Array.isArray(options) 
            ? options 
            : JSON.parse(options);
    } catch (error) {
        console.error("Error parsing Boolean options:", options, error);
        parsedOptions = [];
    }

    return (
        <div className='boolean'>
            {parsedOptions.map((option, index) => (
                <div 
                    key={index} 
                    className={`option${value === option ? ' active' : ''}`} 
                    onClick={() => onChange(option)}
                >
                    {option}
                </div>
            ))}
        </div>
    );
};

export const NumberInput = ({ type, value, onChange }) => {
    return (
        <div className='number-input'>
            <input 
                type='number' 
                inputMode="numeric" 
                placeholder='0.00' 
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            />
            {type !== 'number' && <span className='number-symbol subtext'>{type === 'currency' ? "$" : '%'}</span>}
        </div>
    );
};

export const DateInput = ({ value, onChange, disable = false }) => {
    return <input type='date' disabled={disable} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
};

export const Contact = ({ selectedContact, onCreateNewContact, setSelectedContact, lead = false }) => {
    const [searchTerm, setSearchTerm] = useState(selectedContact?.full_name || selectedContact?.contact_name || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (searchTerm.trim().length >= 2) {
            lead ? fetchLeads(searchTerm) : fetchContacts(searchTerm);
        } else {
            setSearchResults([]);
            setIsDropdownOpen(false);
        }
    }, [searchTerm, lead]);

    const fetchContacts = async (query) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php?search=${encodeURIComponent(query)}&time=${new Date().getTime()}`);
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.contacts.slice(0, 5));
                setIsDropdownOpen(true);
                positionDropdown();
            } else {
                setSearchResults([]);
                setIsDropdownOpen(false);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setSearchResults([]);
            setIsDropdownOpen(false);
        }
    };

    const fetchLeads = async (query) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/leads.php?search=${encodeURIComponent(query)}&time=${new Date().getTime()}`);
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.leads.slice(0, 5));
                setIsDropdownOpen(true);
                positionDropdown();
            } else {
                setSearchResults([]);
                setIsDropdownOpen(false);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            setSearchResults([]);
            setIsDropdownOpen(false);
        }
    };

    const handleSelectItem = (item) => {
        setSearchTerm(item.full_name || item.contact_name);
        setSearchResults([]);
        setIsDropdownOpen(false);
        setSelectedContact(item);
    };

    const positionDropdown = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 2,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div className='contact-input' style={{ position: "relative" }} ref={containerRef}>
            <input
                ref={inputRef}
                type='text'
                placeholder={lead ? "Search for lead..." : "Search or create contact..."}
                value={searchTerm}
                onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                name='contact-input'
            />
            {!lead && <div
                className='form-box alt'
                title="Create new contact"
                onClick={onCreateNewContact}
            >
                +
            </div>}
            {isDropdownOpen && searchResults.length > 0 && createPortal(
                <ul
                    ref={dropdownRef}
                    className="search-dropdown"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width + 41,
                        zIndex: 1002,
                    }}
                >
                    {searchResults.map((item) => (
                        <li
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                        >
                            {lead 
                                ? `${item.contact_name} (Status: ${item.status_name})`
                                : `${item.full_name} (${item.emails?.[0]?.email || "No email"})`
                            }
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </div>
    );
};