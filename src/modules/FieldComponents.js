import React, { useState, useEffect, useRef } from "react";
import '../styles/LayoutEditor.css';
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";
import { AlarmClockPlus, Check, CheckCheck, CheckSquare, Dot, DotSquare, Hash, Paperclip, Phone, SendHorizonal, StickyNote, UserRoundPlus, X } from "lucide-react";
import { Calculate, MarginOutlined, Source, Square, SquareRounded } from "@mui/icons-material";
import { RiAiGenerate, RiAiGenerate2 } from "react-icons/ri";
import { convertLength } from "@mui/material/styles/cssUtils";

const formatDate = (dateString) => {
    if (!dateString) return ["", "", ""];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dateObject = new Date(dateString.replace(" ", "T") + "Z");  

    return [
        `${months[dateObject.getUTCMonth()]} ${dateObject.getUTCDate()}, ${dateObject.getUTCFullYear()}`,
        dateObject.toISOString(),
        dateObject.toUTCString().split(" ")[4]
    ];
};

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
        const newValue = newChecked ? today() : '';
        onChange(newValue);
    };

    const handleInputChange = (e) => {
        setIsChecked(false);
        onChange(e.target.value);
    };

    useEffect(() => {
        setIsChecked(value === today());
    }, [value]);

    return (
        <>
            <input
                type="date"
                disabled={disable}
                value={value}
                onChange={handleInputChange}
            />
            {checkbox && (
                <div className="form-box alt" onClick={handleCheckboxClick}>
                    <input type="checkbox" checked={isChecked} readOnly hidden />
                    {isChecked ? <X size={23} /> : <Check size={23} />}
                </div>
            )}
        </>
    );
};

export const TimeInput = ({ value, onChange }) => {
    return <input type='time' value={value || ""} onChange={(e) => onChange(e.target.value)} />;
};

export const Dropdown = ({ options = [], value = "", onChange = () => {}, marketing_list = false }) => {
    const [parsedOptions, setParsedOptions] = useState([]);

    useEffect(() => {
        if (marketing_list) {
            const fetchMarketingSources = async () => {
                try {
                    const response = await fetch(`https://dalyblackdata.com/api/marketing_sources.php?time=${new Date().getTime()}`);
                    const data = await response.json();
                    const sources = data.marketing_sources.map(source => source.source_name);
                    setParsedOptions(sources);
                } catch (error) {
                    console.error("Error fetching marketing sources:", error);
                }
            };

            fetchMarketingSources();
        } else {
            try {
                const opts = Array.isArray(options)
                    ? options
                    : options 
                        ? JSON.parse(options) 
                        : [];
                setParsedOptions(opts);
            } catch (error) {
                console.error("Dropdown options parsing error:", error);
                setParsedOptions([]);
            }
        }
    }, [marketing_list, options]);

    return (
        <select className="default-select" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}>
            <option value="">Select...</option>
            {parsedOptions.map((option, index) => (
                <option key={index} value={index}>{option}</option>
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
        <div className='multi-select-component'>
            {parsedOptions.map((option, index) => (
                <div
                    key={index}
                    className={`ms-option${value.includes(index) ? ' active' : ''}`}
                    onClick={() => onChange(value.includes(index) ? value.filter(v => v !== index) : [...value, index])}
                >
                    {option}
                </div>
            ))}
        </div>
    );
};

export const SearchSelect = ({ value, onChange, options = [], placeholder = "Select an option", disabled = false }) => {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
  
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const parsedOptions = (() => {
    try {
      const parsed = typeof options === 'string' ? JSON.parse(options) : options;
      return parsed.map((label, index) => ({ label, value: index }));
    } catch (err) {
      console.error('Invalid options format for SearchSelect:', err);
      return [];
    }
  })();

  useEffect(() => {
    const searchLower = search.toLowerCase();
    const filteredOptions = parsedOptions.filter(opt =>
      opt.label.toLowerCase().includes(searchLower)
    );
    setFiltered(filteredOptions);
  }, [search, options]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const selectedLabel = parsedOptions.find(o => o.value === value)?.label || '';

  return (
    <div className={`search-select ${disabled ? 'disabled' : ''}`} style={{ position: 'relative' }}>
      <div
        className="search-select-input"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedLabel || placeholder}
      </div>

      {isOpen && !disabled && (
        <div className="search-select-dropdown" ref={dropdownRef}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
          />
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div style={{ padding: '8px', color: 'var(--text-color)' }}>No results found</div>
          )}
        </div>
      )}
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
            <input type='file' id={`file-upload`} onChange={handleFileChange} hidden/>
            {uploading ? (
                <label htmlFor={`file-upload`}>Uploading...</label>
            ) : (
                <label htmlFor={`file-upload`}>{file?.name || uploadedName || "Choose file..."}</label>
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
            if (data.contacts.id) {
                setDisplayContact(data.contacts);
            } else {
                const response = await fetch(`https://dalyblackdata.com/api/user.php?id=${id}`);
                const data = await response.json();
                if (response.ok) {
                    setDisplayContact(data.contacts);
                }
            }
        } catch (error) {

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

export const DocGen = ({ value, onChange }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(value || "");
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch(`https://dalyblackdata.com/api/templates.php?time=${new Date().getTime()}`);
                const data = await response.json();
                if (data.success) {
                    setTemplates(data.templates);
                }
            } catch (error) {
                console.error("Error fetching templates:", error);
            }
        };
    }, []);

    return (
        <div className='doc-gen'>
            <SearchSelect
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                options={templates.map(t => t.template_name)}
                placeholder="Select a template..."
            />
            <div className='action alt small' onClick={() => onChange(selectedTemplate)}><RiAiGenerate /></div>
        </div>
    );
};

export const Deadline = ({ value, title, onChange }) => {
    const parsedValue = {
        due: value?.due || '',
        done: value?.done || ''
    };

    console.log(parsedValue);

    const handleDateChange = (key) => (newVal) => {
        onChange({ [key]: newVal });
    };

    return (
        <div className='form-group nm deadline-group'>
            <label className="subtext deadline-title">{title}</label>
            <div className='deadline'>
                <div className="deadline-date">
                    <label>Due</label>
                    <DateInput value={parsedValue.due} onChange={handleDateChange("due")} />
                </div>
                <div className="deadline-date">
                    <label>Done</label>
                    <DateInput value={parsedValue.done} onChange={handleDateChange("done")} checkbox />
                </div>
            </div>
        </div>
    );
};

export const SaveButton = ({ dataChanged, name = "Save", saveFields }) => {
    return (
        <button className='action' onClick={saveFields} title={dataChanged ? "Save changes" : "No changes to save"}>
            {name}
        </button>
    );
};

export const TableOfContents = ({ subheaders = [], dataChanged, cancel = false, saveFields, setAddItemMode }) => {
    return (
        <>
            {subheaders.length > 0 && 
                <div className='table-of-contents'>
                    <div className='toc-header'>
                        <h3>Table of Contents</h3>
                        {cancel ? <button className='action alt' style={{marginRight: "15px"}} onClick={() => setAddItemMode(false)}>Cancel</button> : <></>}
                        <SaveButton dataChanged={dataChanged} name={cancel ? "Create" : "Save"} saveFields={saveFields}/>
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

export const DataTable = ({ fields, data, onRowClick }) => {
    const [contactMap, setContactMap] = useState({});

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
                        <th key={f.id} title={f.name}>{`${f.name?.slice(0,32)}${f.name.length > 32 ? '...' : ''}`}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((group, index) => (
                    <tr key={`group-${index}`} className='data-cell' onClick={() => onRowClick && onRowClick(group)}>
                        {fields.map(f => {
                            return (
                                <td key={`group-${index}-field-${f.id}`}>
                                    {(() => {
                                        const raw = displayValue(f, group[f.id]);

                                        try {
                                            const parsed = JSON.parse(raw);

                                            if (parsed.due || parsed.done) {
                                                const due = parsed.due ? `${parsed.due}` : null;
                                                const done = parsed.done ? <Check size={18} color={'var(--fill)'} style={{ marginLeft: due ? '5px' : '' }} /> : null;
                                                return (
                                                    <>
                                                        {formatDate(due)[0]}
                                                        {done}
                                                    </>
                                                );
                                            }
                                            if (f.field_id === 9 && Array.isArray(parsed)) {
                                                return parsed.length > 1 ? `${parsed.length} contacts` : `1 contact`;
                                            }
                                            if (Array.isArray(parsed)) {
                                                return parsed.join(', ');
                                            }
                                        } catch {
                                            
                                        }

                                        return raw ?? '';
                                    })()}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export const AddActivity = ({ users, fetchFeed, case_id, onClick, addActivity, setAddActivity }) => {
    const [activeActivityType, setActiveActivityType] = useState(0);
    const [activityData, setActivityData] = useState({
        subject: "",
        content: "",
        attachments: "",
        type: "notes",
        tags: [],
        case_id: case_id,
    });

    const handleInputChange = (key) => (value) => {
        setActivityData((prev) => ({ ...prev, [key]: value, type: activeActivityType === 0 ? "notes" : activeActivityType === 1 ? "tasks" : "calls" }));
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch('https://dalyblackdata.com/api/activity_feed.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityData),
            });

            const data = await response.json();
            if (data.success) {
                setAddActivity(false);
                setActivityData({
                    author: 1,
                    subject: "",
                    content: "",
                    attachments: "",
                    type: "notes",
                    tags: [],
                    case_id: case_id
                });
                fetchFeed();
            } else {
                console.error("Error adding activity:", data);
            }
        } catch (error) {
            console.error("Error adding activity:", error);
        }
    }

    return (
        <>
            {!addActivity ? 
                <div className='form-group activity'>
                    <input
                        type='text'
                        onClick={onClick}
                        placeholder="Add New Activity"
                    />
                </div>
            : (
                <div className='add-activity'>
                    <div className='activity-type-container'>
                        <div className='activity-type' onClick={() => setActiveActivityType(0)} style={{ backgroundColor: "var(--fill)"}}>
                            <StickyNote size={20} color='var(--secondary-color)'/> {activeActivityType === 0 ? "Add a note" : ""}
                        </div>
                        <div className='activity-type' onClick={() => setActiveActivityType(1)} style={{ backgroundColor: "var(--fill-3)"}}>
                            <CheckSquare size={20} color='var(--secondary-color)'/> {activeActivityType === 1 ? "Assign a task" : ""}
                        </div>
                        <div className='activity-type' onClick={() => setActiveActivityType(2)} style={{ backgroundColor: "var(--fill-4)"}}>
                            <Phone size={20} color='var(--secondary-color)'/> {activeActivityType === 2 ? "Log a phone call" : ""}
                        </div>
                    </div>
                    <div className='form-group activity'>
                        <label className='activity-type-label subtext'>Subject</label>
                        <input
                            type='text'
                            onClick={onClick}
                            placeholder="Add a subject"
                            onChange={(e) => handleInputChange("subject")(e.target.value)}
                        />
                    </div>
                    <div className='form-group activity'>
                        <label className='activity-type-label subtext'>Content</label>
                        <textarea
                            type='text'
                            onClick={onClick}
                            placeholder="Add a note"
                            onChange={(e) => handleInputChange("content")(e.target.value)}
                        />
                    </div>
                    {activeActivityType === 1 && (
                        <div className='form-group activity'>
                            <label className='activity-type-label subtext'>Assign to</label>
                            <SearchSelect
                                value={activityData.task}
                                onChange={(val) => handleInputChange("task")(val)}
                                options={users.map(u => u.name)}
                                placeholder="Select a user..."
                            />
                        </div>
                    )}
                    <div className='activity-actions'>
                        <div className='activity-additional'>
                            <div className='activity-additional-item subtext'>
                                <Hash size={14}/>
                                <span>Add tags</span>
                            </div>
                            <div className='activity-additional-item subtext'>
                                <Paperclip size={14}/>
                                <span>Attach a file</span>
                            </div>
                            {activeActivityType !== 2 && <div className='activity-additional-item subtext'>
                                <AlarmClockPlus size={14}/>
                                <span>Add time</span>
                            </div>}
                        </div>
                        <div className='activity-add' onClick={handleSubmit}>
                            <span className='activity-add-text'>{activeActivityType === 0 ? "Add Note" : activeActivityType === 1 ? "Create Task" : "Log Call"}</span>
                            <SendHorizonal size={20}/>
                        </div>
                    </div>
                    <X size={20} className='exit' onClick={() => setAddActivity(false)} />
                </div>
            )}
        </>
    );
}