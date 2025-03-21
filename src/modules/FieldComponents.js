import React, { useState, useEffect, useRef } from "react";
import '../styles/LayoutEditor.css';
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";
import { UserRoundPlus } from "lucide-react";
import { Calculate } from "@mui/icons-material";

export const Text = ({ type, placeholder, value, onChange, disable }) => {
    return type === 'text' ? (
        <input type='text' disabled={disable} placeholder={placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    ) : (
        <textarea placeholder={placeholder} disabled={disable} value={value || ""} onChange={(e) => onChange(e.target.value)} />
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

export const TimeInput = ({ value, onChange }) => {
    return <input type='time' value={value || ""} onChange={(e) => onChange(e.target.value)} />;
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
        <select className={`default-select`} value={value || ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select...</option>
            {parsedOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
            ))}
        </select>
    );
};

export const MultiSelect = ({ options = [], value = [], onChange = () => {} }) => {
    let parsedOptions = [];

    try {
        parsedOptions = Array.isArray(options)
            ? options
            : options
                ? JSON.parse(options)
                : [];
    } catch (error) {
        console.error("MultiSelect options parsing error:", error);
        parsedOptions = [];
    }

    return (
        <div className='multi-select'>
            {parsedOptions.map((option, index) => (
                <div
                    key={index}
                    className={`option${value.includes(option) ? ' active' : ''}`}
                    onClick={() => onChange(value.includes(option) ? value.filter(v => v !== option) : [...value, option])}
                >
                    {option}
                </div>
            ))}
        </div>
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
                    className={`option${value === index ? ' active' : ''}`} 
                    onClick={() => onChange(index)}
                >
                    {option}
                </div>
            ))}
        </div>
    );
};


export const Subheader = ({ title }) => {
    return <h2 className='subheader'>{title}</h2>;
};

export const Instructions = ({ instructions }) => {
    return <p className='instructions'>{instructions}</p>;
};

export const FileUpload = ({ value, onChange }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        onChange(selectedFile);
    };

    return (
        <div className='file-upload'>
            <input type='file' onChange={handleFileChange} />
            {file ? <span>{file.name}</span> : <span>{value || "Choose file..."}</span>}
        </div>
    );
};

export const MultiFile = ({ value, onChange }) => {
    const [files, setFiles] = useState([]);

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prevFiles => {
            const updated = [...prevFiles, ...newFiles];
            onChange(updated);
            return updated;
        });
    };    

    return (
        <div className='file-upload'>
            <input type='file' id='multi-file' multiple onChange={handleFileChange} hidden/>
            <label htmlFor='multi-file'>Choose files...</label>
            {files.length > 0 && <div className='file-list'>    
                {files.map((file, index) => (
                    <span key={index}>{file.name}</span>
                ))}
            </div>}
        </div>
    );
};

export const Calculation = ({ fields = []}) => {
    const [result, setResult] = useState(0);

    useEffect(() => {
        if (fields?.length === 0) return setResult(0);

        setResult(fields.reduce((acc, field) => {
            return acc + Number(field.value || 0);
        }, 0));
    }, [fields]);

    return (
        <div className='number-input'>
            <input type='text' disabled className='calculation' value={result}/>
            <span className='number-symbol subtext'><Calculate size={18}/></span>
        </div>
    );
};

export const Contact = ({ selectedContact, onCreateNewContact, setSelectedContact, onCreateNewLead, lead = false }) => {
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
                autoComplete="off"
            />
            <div
                className='form-box alt'
                title="Create new contact"
                onClick={() => !lead ? onCreateNewContact() : onCreateNewLead()}
            >
                <UserRoundPlus size={20} />
            </div>
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

export const ContactList = ({ onChange }) => {
    const [contacts, setContacts] = useState([{ id: Date.now(), selectedContact: null }]);

    const handleContactSelect = (index, contact) => {
        const updated = [...contacts];
        updated[index].selectedContact = contact;
        setContacts(updated);

        if (onChange) {
            onChange(updated.map(c => c.selectedContact?.id).filter(Boolean));
        }
    };

    const addContactField = () => {
        setContacts([...contacts, { id: Date.now(), selectedContact: null }]);
    };

    return (
        <>
            {contacts.map((contactItem, index) => (
                <Contact
                    key={contactItem.id}
                    selectedContact={contactItem.selectedContact}
                    setSelectedContact={(contact) => handleContactSelect(index, contact)}
                    onCreateNewContact={() => console.log("Create contact UI")}
                />
            ))}
            <div className='action' onClick={addContactField}>+ Add Another Contact</div>
        </>
    );
};

export const Deadline = () => {
    return (
        <div className='deadline'>
            <label>Due</label>
            <DateInput />
            <label>Done</label>
            <DateInput />
        </div>
    )
}