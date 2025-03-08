import React, { useState, useEffect, useRef } from "react";
import '../styles/LayoutEditor.css';
import { Ar } from "@mynaui/icons-react";
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";
import { Money } from "@mui/icons-material";

export const Text = ({ type, placeholder, value }) => {
    if(type === 'text') {
        return <input type='text' placeholder={`${placeholder}...`} value={value} />;
    } else if(type === 'textarea') {
        return <textarea placeholder={`${placeholder}...`} value={value} />;
    }
};

export const Dropdown = ({ options, value }) => {
    options = Array.isArray(options) ? options : options ? JSON.parse(options) : [];
    return (
        <select className='default-select' value={value}>
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    );
};

export const Boolean = ({ options, value }) => {
    const [active, setActive] = useState(2);
    return (
        <div className='boolean'>
            {options.map((option, index) => (
                <div className={`option${index === active ? ' active' : ''}`} onClick={() => setActive(index)}>{option}</div>
            ))}
        </div>
    );
};

export const NumberInput = ({ type, value }) => {
    return (
        <div className='number-input'>
            <input type='text' inputMode="numeric" placeholder='0.00' max={type === 'percent' ? 100 : null} />
            {type != 'number' && <span className='number-symbol subtext'>{type === 'currency' ? "$" : '%'}</span>}
        </div>
    );
};

export const DateInput = ({ value }) => {
    return <input type='date' value={value} />;
};

export const Contact = ({ selectedContact, onCreateNewContact }) => {
    const [value, setValue] = useState(selectedContact?.full_name || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (value.trim().length >= 2) {
            fetchContacts(value);
        } else {
            setSearchResults([]);
        }
    }, [value]);

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

    const handleSelectContact = (contact) => {
        setValue(contact.full_name);
        setSearchResults([]);
        setIsDropdownOpen(false);
    };

    const positionDropdown = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isDropdownOpen) {
            positionDropdown();
            window.addEventListener("scroll", positionDropdown);
            window.addEventListener("resize", positionDropdown);
        } else {
            window.removeEventListener("scroll", positionDropdown);
            window.removeEventListener("resize", positionDropdown);
        }

        return () => {
            window.removeEventListener("scroll", positionDropdown);
            window.removeEventListener("resize", positionDropdown);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !inputRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className='contact-input' style={{ position: "relative" }}>
                <input
                    ref={inputRef}
                    type='text'
                    placeholder="Search or add contact..."
                    value={value}
                    onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
                    onChange={(e) => setValue(e.target.value)}
                />
                <div
                    className='form-box alt'
                    title='Create new contact'
                    onClick={onCreateNewContact}
                >
                    +
                </div>
                {isDropdownOpen && searchResults.length > 0 && createPortal(
                    <ul
                        ref={dropdownRef}
                        className="search-dropdown"
                        style={{
                            top: dropdownPosition.top + 2,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width + 41,
                            zIndex: 1002,
                        }}
                    >
                        {searchResults.map((contact) => (
                            <li
                                key={contact.id}
                                onClick={() => handleSelectContact(contact)}
                            >
                                {contact.full_name} ({contact.emails?.[0]?.email || "No email"})
                            </li>
                        ))}
                    </ul>,
                    document.body
                )}
            </div>
        </>
    );
};