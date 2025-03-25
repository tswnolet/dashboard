import React, { useState, useEffect, useRef } from "react";
import '../styles/LayoutEditor.css';
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";
import { Check, CheckCheck, Dot, DotSquare, UserRoundPlus, X } from "lucide-react";
import { Calculate, Square, SquareRounded } from "@mui/icons-material";

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

export const DateInput = ({ value = '', onChange, disable = false, checkbox = false }) => {
    const [isChecked, setIsChecked] = useState(false);

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handleCheckboxClick = () => {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        if (newChecked) {
            onChange(today());
        }
    };

    const handleInputChange = (e) => {
        setIsChecked(false);
        onChange(e.target.value);
    };

    useEffect(() => {
        if (value !== today()) {
            setIsChecked(false);
        }
    }, [value]);

    return (
        <>
            <input
                type="date"
                disabled={disable}
                value={value}
                onChange={handleInputChange}
            />
            {checkbox && <div className="form-box alt" onClick={handleCheckboxClick}>
                <input type="checkbox" checked={isChecked} readOnly hidden />
                {isChecked ? <X size={23} /> : <Check size={23} />}
            </div>}
        </>
    );
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

export const Boolean = ({ options = [], value, onChange }) => {
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
    return <h2 className='subheader' id={title}>{title}</h2>;
};

export const Instructions = ({ instructions }) => {
    return <p className='instructions'>{instructions}</p>;
};

export const FileUpload = ({ value, onChange, lead_id, section_name }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedName, setUploadedName] = useState(value || "");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        onChange?.(selectedFile);
    };

    return (
        <div className='file-upload'>
            <input type='file' onChange={handleFileChange} />
            {uploading ? (
                <span>Uploading...</span>
            ) : (
                <span>{file?.name || uploadedName || "Choose file..."}</span>
            )}
        </div>
    );
};

export const MultiFile = ({ value, onChange, lead_id, sectionName }) => {
    const [files, setFiles] = useState([]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        onChange?.(selectedFiles);
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

export const Calculation = ({ options, fieldUpdates = [], fields = [], lead_id, fieldId, onChange }) => {
    const [result, setResult] = useState(0);
    const lastPosted = useRef(null);

    useEffect(() => {
        if (!options || !fieldId) return;

        try {
            const parsed = typeof options === 'string' ? JSON.parse(options) : options;
            const rule = parsed?.rule;
            const fieldIds = JSON.parse(parsed?.field_ids);

            const values = fieldIds.map(id => {
                const update = fieldUpdates.find(f => f.field_id === id);
                const raw = update?.value ?? 0;

                const fieldDef = fields.find(f => f.id === id);
                const fieldTypeId = fieldDef?.field_id;

                let val = isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
                if (fieldTypeId === 4) val = val / 100;

                return val;
            });

            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            let expression = rule;
            values.forEach((val, idx) => {
                const letter = letters[idx];
                expression = expression.replaceAll(letter, val);
            });

            const calculated = new Function(`return ${expression}`)();
            setResult(calculated ?? 0);

            console.log(calculated);
        } catch (e) {
            console.error('Calculation error:', e);
            setResult(0);
        }
    }, [options, fieldUpdates, fields, fieldId]);

    useEffect(() => {
        if (!options || !fieldId || isNaN(result)) return;

        if (lastPosted.current === result) return;

        const postValue = async () => {
            try {
                lastPosted.current = result;

                await fetch('https://dalyblackdata.com/api/custom_fields.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        lead_id,
                        field_values: {
                            [fieldId]: result,
                        },
                    }),
                });

                onChange?.(fieldId, String(result));
            } catch (err) {
                console.error("Failed to save calculation result:", err);
            }
        };

        postValue();
    }, [result]);

    return (
        <div className='number-input'>
            <input type='text' disabled className='calculation' value={result}/>
            <span className='number-symbol subtext'><Calculate size={18}/></span>
        </div>
    );
};

export const Contact = ({ selectedContact = '', onCreateNewContact, setSelectedContact, onCreateNewLead, lead = false }) => {
    const [searchTerm, setSearchTerm] = useState(selectedContact?.full_name || selectedContact?.contact_name || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [displayContact, setDisplayContact] = useState(null);

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
        if (selectedContact)
            fetchContact(selectedContact);
    }, [selectedContact]);

    const fetchContact = async (id) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php?id=${id}`);
            const data = await response.json();
            if (data.success) {
                setDisplayContact(data.contacts);
            }
        } catch (error) {
            console.error("Error fetching contact:", error);
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
        <>
            {displayContact === null ? (
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
            ) : (
                <div className='contact-shortform'>
                    {displayContact?.profile_picture
                        ? <img src={`https://dalyblackdata.com/api/${displayContact?.profile_picture}`} alt="Profile" className='contact-initials'/>
                        : <span className='contact-initials'>{`${displayContact.full_name?.trim().charAt(0)}${displayContact.last_name?.trim().charAt(0)}`}</span>
                    }
                    <div className='contact-display'>
                        <span className='subtext'>{displayContact?.full_name}</span>
                        <span className='subtext'>{displayContact?.phones[0]?.number}{displayContact?.phones[0]?.number && displayContact?.emails[0]?.email ? <SquareRounded style={{ height: "5px", width: "5px" }}/> : ''}{displayContact?.emails[0]?.email}</span>
                        <span className='subtext'>{displayContact?.job_title}</span>
                        <div
                            onClick={() => {
                                setSelectedContact('');
                                setSearchTerm('');
                                setDisplayContact(null);
                            }}
                            className='exit'
                        >
                            <X size={20} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const ContactList = ({ onChange, value = [] }) => {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        if (value.length > 0) {
            const fetchInitialContacts = async () => {
                const contactData = await Promise.all(
                    value.map(async (id) => {
                        try {
                            const res = await fetch(`https://dalyblackdata.com/api/contacts.php?id=${id}`);
                            const data = await res.json();
                            return data.success
                                ? { id: Date.now() + Math.random(), selectedContact: data.contacts }
                                : null;
                        } catch {
                            return null;
                        }
                    })
                );
                setContacts(contactData.filter((c) => c !== null));
            };
            fetchInitialContacts();
        } else {
            setContacts([{ id: Date.now(), selectedContact: null }]);
        }
    }, [value]);

    const handleContactSelect = (index, contact) => {
        const updated = [...contacts];
        updated[index].selectedContact = contact;
        setContacts(updated);

        const selectedIds = updated
            .map(c => Number(c.selectedContact?.id))
            .filter(id => !isNaN(id) && id !== 0 && id !== null && id !== undefined);

        onChange?.(selectedIds);
    };

    const addContactField = () => {
        setContacts(prev => [...prev, { id: Date.now(), selectedContact: null }]);
    };

    const removeContactField = (id) => {
        const updated = contacts.filter(c => c.id !== id);
        setContacts(updated);

        const selectedIds = updated
            .map(c => Number(c.selectedContact?.id))
            .filter(id => !isNaN(id) && id !== 0 && id !== null && id !== undefined);

        onChange?.(selectedIds);
    };

    return (
        <>
            {contacts.map((contactItem, index) => (
                <div key={contactItem.id} className="contact-entry">
                    <Contact
                        selectedContact={contactItem.selectedContact?.id}
                        setSelectedContact={(contact) => handleContactSelect(index, contact)}
                        onCreateNewContact={() => handleContactSelect(index, { id: 0 })}
                    />
                    {contacts.length > 1 && (
                        <div
                            className="form-box alt remove"
                            onClick={() => removeContactField(contactItem.id)}
                            title="Remove contact"
                        >
                            <X size={18} />
                        </div>
                    )}
                </div>
            ))}
            <div className='action alt small' onClick={addContactField}>Add Contact</div>
        </>
    );
};

export const Deadline = ({ value = [], title, onChange }) => {
    const handleDateChange = (key) => (newVal) => {
        onChange({ [key]: newVal });
    };

    value = typeof value === 'string' ? JSON.parse(value) : value;

    return (
        <>
            <div className='deadline-title'>{title}</div>
            <div className='deadline'>
                <div className="deadline-date">
                    <label>Due</label>
                    <DateInput value={value.due} onChange={handleDateChange("due")} />
                </div>
                <div className="deadline-date">
                    <label>Done</label>
                    <DateInput value={value.done} onChange={handleDateChange("done")} checkbox/>
                </div>
            </div>
        </>
    );
};

export const TableOfContents = ({ subheaders = [], dataChanged, saveFields }) => {
    return (
        <>
            {subheaders.length > 0 && 
                <div className='table-of-contents'>
                    <div className='toc-header'>
                        <h3>Table of Contents</h3>
                        <div className='action' onClick={saveFields} title={dataChanged ? "Save changes" : "No changes to save"}>
                            <CheckCheck size={16} />
                        </div>
                    </div>
                    {subheaders.map((header, index) => (
                        <a key={`${header}-${index}`} href={`#${header.name}`} className='subtext' title={`Scroll to ${header.name}`}>{header.name}</a>
                    ))}
                    <div className='divider horizontal'></div>
                </div>
            }
        </>
    );
}

export const DataTable = ({ fields, data }) => {
    const [contactMap, setContactMap] = useState({});

    console.log(fields, data)

    useEffect(() => {
        const contactIds = new Set();
        fields.forEach(field => {
            if (field.field_id === 8) {
                data.forEach(row => {
                    if (row[field.id]) contactIds.add(row[field.id]);
                });
            }
        });
    
        if (contactIds.size > 0) {
            fetch(`https://dalyblackdata.com/api/contacts.php?ids=${Array.from(contactIds).join(',')}`)
                .then(res => res.json())
                .then(result => {
                    setContactMap(result.contacts.reduce((map, contact) => {
                        map[contact.id] = contact.full_name;
                        return map;
                    }, {}));
                });
        }
    }, [fields, data]);

    const displayValue = (field, rawValue) => {
        if (field.field_id === 8) {
            return contactMap?.[rawValue] || rawValue;
        }
    
        try {
            const opts = JSON.parse(field.options || "[]");
            if (typeof rawValue === 'number' || !isNaN(rawValue)) {
                return opts[Number(rawValue)] ?? rawValue;
            }
        } catch {}
    
        return rawValue;
    };    

    if (!data || data.length === 0) return <p className="subtext">No entries yet.</p>;

    return (
        <table className="data-table">
            <thead>
                <tr>
                    {fields.map(f => (
                        <th key={f.id}>{f.name}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((group, index) => (
                    <tr key={`group-${index}`} className='data-cell'>
                        {fields.map(f => {
                            return (
                                <td key={`group-${index}-field-${f.id}`}>
                                    {(() => {
                                        const raw = displayValue(f, group[f.id]);

                                        try {
                                            const parsed = JSON.parse(raw);
                                            if (Array.isArray(parsed)) {
                                                return parsed.length > 1 ? `${parsed.length} contacts` : `1 contact`;
                                            }
                                        } catch {
                                            
                                        }

                                        return raw ?? '';
                                    })()}
                                </td>
                            )}
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};