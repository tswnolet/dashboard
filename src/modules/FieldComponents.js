import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import '../styles/LayoutEditor.css';
import { createPortal } from "react-dom";
import { CreateContact } from "./CreateContact";
import { AlarmClockPlus, Calendar, Check, CheckCheck, CheckSquare, CloudUpload, Dot, DotSquare, Eraser, Hash, Info, Loader, Loader2, Paperclip, Phone, SendHorizonal, SquareCheckBig, StickyNote, Upload, UserRoundPlus, X } from "lucide-react";
import { Calculate, MarginOutlined, Refresh, Source, Square, SquareRounded } from "@mui/icons-material";
import { RiAiGenerate, RiAiGenerate2 } from "react-icons/ri";
import { convertLength } from "@mui/material/styles/cssUtils";
import Loading from "./Loading";

export const formatDate = (dateString) => {
    if (!dateString) return ["", "", ""];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dateObject = new Date(dateString.replace(" ", "T") + "Z");  

    return [
        `${months[dateObject.getUTCMonth()]} ${dateObject.getUTCDate()}, ${dateObject.getUTCFullYear()}`,
        dateObject.toISOString(),
        dateObject.toUTCString().split(" ")[4], `${dateObject.getUTCMonth() + 1}/${dateObject.getUTCDate()}/${dateObject.getUTCFullYear()}`
    ];
};

export const formatValue = (val, type) => {
    if (type === 'currency') {
        const num = parseFloat(val);
        if (isNaN(num)) return '$0.00';
        return num.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });
    } else if (type === 'percentage') {
        return `${parseFloat(val).toFixed(2)}%`;
    }
    return val;
};

export const Text = ({ type, placeholder, value, onChange, disable, onBlur = () => {}, onKeyDown = () => {} }) => {
    return type === 'text' ? (
        <input
            type='text'
            disabled={disable}
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
        />
    ) : (
        <textarea
            placeholder={placeholder}
            disabled={disable}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
        />
    );
};

export const NumberInput = ({ type, value, onChange, onBlur = () => {}, onKeyDown = () => {} }) => {
    return (
        <div className='number-input'>
            <input
                type='number'
                inputMode="numeric"
                placeholder='0.00'
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
            />
            {type !== 'number' && <span className='number-symbol subtext'>{type === 'currency' ? "$" : '%'}</span>}
        </div>
    );
};

export const DateInput = ({
    value = '',
    onChange,
    onBlur = () => {},
    disable = false,
    checkbox = false
}) => {
    const [isChecked, setIsChecked] = useState(false);
    const [localValue, setLocalValue] = useState(value || '');

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const commitValue = (finalValue) => {
        setTimeout(() => {
            onChange(finalValue);
            onBlur();
        }, 0);
    };

    const handleCheckboxClick = () => {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        const newValue = newChecked ? today() : '';
        setLocalValue(newValue);
        onChange(newValue);
        onBlur();
    };

    const handleInputChange = (e) => {
        setLocalValue(e.target.value);
        setIsChecked(false);
    };

    const handleBlur = (e) => {
        commitValue(e.target.value);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            commitValue(e.target.value);
        }
    };

    useEffect(() => {
        setIsChecked(value === today());
        setLocalValue(value || '');
    }, [value]);

    return (
        <div className="date-input">
            <input
                type="date"
                disabled={disable}
                value={localValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            {checkbox && (
                <div className="form-box alt" onClick={handleCheckboxClick}>
                    <input type="checkbox" checked={isChecked} readOnly hidden />
                    {isChecked ? <X size={23} /> : <Check size={23} />}
                </div>
            )}
        </div>
    );
};

export const TimeInput = ({ value, onChange }) => {
    return <input type='time' value={value || ""} onChange={(e) => onChange(e.target.value)} />;
};

export const Dropdown = ({ placeholder = null, options = [], value = "", onChange = () => {}, marketing_list = false, onBlur = () => {}, onKeyDown = () => {} }) => {
    const [parsedOptions, setParsedOptions] = useState([]);

    useEffect(() => {
        if (marketing_list) {
            const fetchMarketingSources = async () => {
                try {
                    const response = await fetch(`https://api.casedb.co/marketing_sources.php?time=${new Date().getTime()}`);
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
        <select
            className="default-select"
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
        >
            <option value="" disabled={placeholder}>{placeholder || 'Select...'}</option>
            {parsedOptions.map((option, index) => (
                <option key={index} value={index}>{option}</option>
            ))}
        </select>
    );
};

export const MultiSelect = ({ options = [], value = [], onChange = () => {}, onBlur = () => {}, onKeyDown = () => {} }) => {
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
        <div className='multi-select-component' onBlur={onBlur} onKeyDown={onKeyDown}>
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

    const validOptions = Array.isArray(options) || typeof options === 'object';

    const parsedOptions = useMemo(() => {
        if (!validOptions) return [];

        try {
            const opts = typeof options === 'string' ? JSON.parse(options) : options;

            if (Array.isArray(opts)) {
                return opts.map((label, index) => ({ label, value: index.toString() }));
            } else if (typeof opts === 'object') {
                return Object.entries(opts).map(([key, label]) => ({ label, value: key }));
            }

            return [];
        } catch (err) {
            console.error('Invalid options format for SearchSelect:', err);
            return [];
        }
    }, [options]);

    const selectedLabel = parsedOptions.find(o => o.value === value?.toString())?.label || '';

    useEffect(() => {
        const searchLower = search.toLowerCase();
        const filteredOptions = parsedOptions.filter(opt =>
            opt.label.toLowerCase().includes(searchLower)
        );
        setFiltered(filteredOptions);
    }, [search, parsedOptions]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if ((e.key === 'Delete') && !search) {
                onChange(null);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, search]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    const handleFocus = () => {
        if (!disabled && validOptions) setIsOpen(true);
    };

    return (
        <div
            className={`search-select always ${disabled ? 'disabled' : ''}`}
            style={{ position: 'relative' }}
            ref={dropdownRef}
        >
            <input
                type="text"
                className="search-select-input"
                value={search || selectedLabel}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                onFocus={handleFocus}
                disabled={disabled}
                title='Press delete while focused to clear'
            />

            {isOpen && !disabled && validOptions && (
                <div className="search-select-dropdown">
                    {filtered.length > 0 ? (
                        filtered.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-color)',
                                }}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '8px', color: 'var(--text-color)' }}>
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const Boolean = ({ options = [], value, onChange, onBlur = () => {}, onKeyDown = () => {} }) => {
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
        <div className='boolean' onBlur={onBlur} onKeyDown={onKeyDown}>
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

export const Toggle = ({ value, onChange, label = null }) => {
    return (
        <div className='toggle-container'>
            <div className={`toggle${value ? ' active' : ''}`} onClick={() => onChange(!value)}>
                <div className={`toggle-circle ${value ? 'set' : ''}`} />
            </div>
            <span className='subtext'>{label}</span>
        </div>
    );
};

export const Checkbox = ({ value, onChange, mini = null, label = null, hint = null, space = null }) => {
    const [hintVisible, setHintVisible] = useState(false);
    const hintRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (hintRef.current && !hintRef.current.contains(event.target)) {
                setHintVisible(false);
            }
        };

        if (hintVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [hintVisible]);

    return (
        <div className={`checkbox-group ${space ? ' space' : ''}`}>
            <div 
                className={`checkbox${mini ? '-mini' : ''} ${value ? ' checked' : ''}`}
                onClick={onChange}
            >
                {value ? <SquareCheckBig size={18} /> : ''}
            </div>
            {label && <label className='subtext'>{label}</label>}
            <input type='checkbox' hidden />
            {hint && <div className='hint-container' ref={hintRef}>
                <Info className='info-box' size={18} onClick={() => setHintVisible(prev => !prev)}/>
                {hintVisible && (
                    <div className='hint'>
                        {hint}
                    </div>
                )}
            </div>}
        </div>
    );
};

export const Subheader = ({ title, small = false, action = null }) => {
    if (action) {
        return (
            <div className={`subheader ${small ? 'small' : ''}`} id={title}>
                <h2>{title}</h2>
                {action}
            </div>
        );
    }

    return <h2 className='subheader-solo' id={title}>{title}</h2>;
};

export const SubtextTitle = ({ title }) => {
    return <p className='subtext-title'>{title}</p>;
}

export const DataDisplay = ({title, value, type }) => {
    return (
        <div className='data-display'>
            <span className='subtext'>{title}</span>
            <span className='subtext-data'>{formatValue(value, type)}</span>
        </div>
    );
};

export const Instructions = ({ instructions, limited = false }) => {
    return <p className='instructions' style={{maxWidth: limited ? '50%' : ''}}>{instructions}</p>;
};

export const FileUpload = ({ value, onChange, upload = null, uploadWaiting = false }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [startWait, setStartWait] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            onChange?.(selectedFile);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleClear = () => {
        setFile(null);
        onChange?.(null);
    };

    return (
        <div className={`file-upload${uploading ? ' expanded' : ''}`} onClick={() => setUploading(true)}>
            <input
                type='file'
                id='file-upload'
                ref={fileInputRef}
                onChange={handleFileChange}
                hidden
            />

            <label
                htmlFor='file-upload'
                className='subtext'
                onClick={(e) => {
                    if (!uploading) e.preventDefault();
                }}
            >
                {uploading ? 'Upload File...' : 'Upload'}
            </label>

            {file && (
                <div className='file-actions'>
                    {upload != null && (
                        <>
                            <button
                                className='upload'
                                disabled={startWait}
                                onClick={() => {
                                    upload?.();
                                    setStartWait(true);
                                }}
                            >
                                {!startWait ? <CloudUpload size={18} /> : startWait === 'done' ? <Check /> : <Loader2 className='spinner' />}
                            </button>
                            <button className='upload' disabled={startWait} onClick={handleClear}>
                                <Eraser size={18} />
                            </button>
                        </>
                    )}
                </div>
            )}

            {file && (
                <div className='file-list subtext'>
                    <span>
                        {file.name.length > 15
                            ? `${file.name.slice(0, 15)}(...)`
                            : file.name}
                    </span>
                </div>
            )}
        </div>
    );
};

export const MultiFile = ({ value, onChange, upload = null, uploadWaiting }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [startWait, setStartWait] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        onChange?.(selectedFiles);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        if (!uploadWaiting && startWait) {
            setFiles([]);
            setStartWait(false);
        }
    }, [uploadWaiting]);

    return (
        <div className={`file-upload${uploading ? ' expanded' : ''}`} onClick={() => {setUploading(true); fileInputRef.current?.click();}}>
            <input
                type='file'
                id='multi-file'
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                hidden
            />
            {files.length === 0 ? (
                <span className='subtext' style={{ color: !uploading ? "var(--secondary-color)" : 'var(--text-color)'}}>
                    {uploading ? 'Upload Files...' : 'Upload'}
                </span>
            ) : (
                upload != null && (
                    <div className='file-actions'>
                        <button className='upload' disabled={startWait} onClick={() => { upload(); setStartWait(true); }}>
                            {!startWait ? <CloudUpload size={18} /> : startWait === 'done' ? <Check /> : <Loader2 className="spinner" />}
                        </button>
                        <button className='upload' disabled={startWait} onClick={() => setFiles([])}>
                            <Eraser size={18} />
                        </button>
                    </div>
                )
            )}
            {files.length > 0 && (
                <div className='file-list subtext'>
                    {files.map((file, index) => {
                        const fileName = String(file.name).split(".");
                        return (
                            <span key={index}>
                                {fileName[0].length > 15 ? `${fileName[0].slice(0, 15)}(...)` : fileName[0]}.{fileName[1]}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const FolderUpload = ({ value, onChange, upload = null, uploadWaiting }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [startWait, setStartWait] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        onChange?.(selectedFiles);
        fileInputRef.current.value = "";
    };

    useEffect(() => {
        if (!uploadWaiting && startWait) {
            setFiles([]);
            setStartWait(false);
        }
    }, [uploadWaiting]);

    const handleClick = (e) => {
        if (e.target === e.currentTarget) {
            setUploading(true);
            fileInputRef.current?.click();
        }
    };

    return (
        <div className={`file-upload${uploading ? ' expanded' : ''}`} onClick={handleClick}>
            <input
                type='file'
                multiple
                webkitdirectory="true"
                onChange={handleFileChange}
                ref={fileInputRef}
                hidden
            />
            {files.length === 0 ? (
                <span className='subtext' style={{ color: !uploading ? "var(--secondary-color)" : 'var(--text-color)' }}>
                    {uploading ? 'Select Folder...' : 'Upload Folder'}
                </span>
            ) : (
                upload != null && (
                    <div className='file-actions'>
                        <button className='upload' disabled={startWait} onClick={() => { upload(); setStartWait(true); }}>
                            {!startWait ? <CloudUpload size={18} /> : startWait === 'done' ? <Check /> : <Loader2 className="spinner" />}
                        </button>
                        <button className='upload' disabled={startWait} onClick={() => setFiles([])}>
                            <Eraser size={18} />
                        </button>
                    </div>
                )
            )}
            {files.length > 0 && (
                <div className='file-list subtext'>
                    {files.slice(0, 5).map((file, index) => (
                        <span key={index}>{file.webkitRelativePath}</span>
                    ))}
                    {files.length > 5 && <span>+ {files.length - 5} more</span>}
                </div>
            )}
        </div>
    );
};

export const Calculation = ({
    options,
    fieldUpdates = {},
    formData = {},
    fields = [],
    lead_id,
    fieldId,
    onChange
}) => {
    const [result, setResult] = useState(0);
    const [tooltipContent, setTooltipContent] = useState({ display: '', formula: '' });
    const [showTooltip, setShowTooltip] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const lastPosted = useRef(null);
    const onChangeCount = useRef(0);

    const handleMouseMove = useCallback((e) => {
        const offsetX = 5;
        const offsetY = 5;
        const tooltipWidth = 250;
        const pageWidth = window.innerWidth;

        const positionToRight = e.pageX + tooltipWidth + offsetX < pageWidth;

        setMousePosition({
            x: positionToRight ? e.pageX + offsetX : e.pageX - (tooltipWidth / 2) - offsetX,
            y: e.pageY + offsetY,
        });
    }, []);

    const handleHover = () => {
        if (!options || !fieldId) return;

        const parsed = typeof options === 'string' ? JSON.parse(options) : options;
        const rule = parsed?.rule || '';
        const fieldIds = JSON.parse(parsed?.field_ids || '[]');

        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        let displayExpr = rule;
        let formula = rule;

        fieldIds.forEach((id, idx) => {
            const letter = letters[idx];
            const raw = formData[id] ?? fieldUpdates[id] ?? 0;
            const fieldDef = fields.find(f => f.id === id);
            const fieldTypeId = fieldDef?.field_id;
            let val = isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
            if (fieldTypeId === 4) val = val / 100;

            displayExpr = displayExpr.replaceAll(letter, val);
        });

        setTooltipContent({ display: displayExpr, formula });
        setShowTooltip(true);
        document.addEventListener('mousemove', handleMouseMove);
    };

    const handleExit = () => {
        setShowTooltip(false);
        document.removeEventListener('mousemove', handleMouseMove);
    };

    useEffect(() => {
        if (!options || !fieldId) return;

        try {
            const parsed = typeof options === 'string' ? JSON.parse(options) : options;
            const rule = parsed?.rule;
            const fieldIds = JSON.parse(parsed?.field_ids);

            const values = fieldIds.map(id => {
                const raw = formData[id] ?? fieldUpdates?.[id] ?? 0;
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

            if (onChangeCount.current < 15) {
                onChange?.(calculated ?? 0);
                onChangeCount.current += 1;
            }
        } catch (e) {
            console.error('Calculation error:', e);
            setResult(0);
        }
    }, [formData, fieldUpdates, fields, fieldId, options]);

    useEffect(() => {
        if (!options || !fieldId || isNaN(result)) return;
        if (lastPosted.current === result) return;

        const postValue = async () => {
            try {
                lastPosted.current = result;

                await fetch('https://api.casedb.co/custom_fields.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lead_id,
                        field_values: { [fieldId]: result }
                    }),
                });

                onChange?.(fieldId, String(result));
            } catch (err) {
                console.error("Failed to save calculation result:", err);
            }
        };

        postValue();
    }, [result]);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleMouseMove]);

    return (
        <>
            <div className='number-input'>
                <input type='text' disabled className='calculation' value={result}/>
                <span
                    className='number-symbol subtext'
                    onMouseEnter={handleHover}
                    onMouseLeave={handleExit}
                >
                    <Calculate size={18}/>
                </span>
            </div>

            {showTooltip && (
                <div
                    className='tooltip-calculation'
                    style={{
                        position: 'absolute',
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        width: 'max-content',
                        maxWidth: '300px',
                        lineHeight: '1.4',
                        whiteSpace: 'normal',
                    }}
                >
                    <strong>{tooltipContent.display}</strong>
                    <div style={{ marginTop: 4, fontStyle: 'italic', opacity: 0.8 }}>
                        {tooltipContent.formula}
                    </div>
                </div>
            )}
        </>
    );
};

export const Contact = ({ selectedContact = '', onCreateNewContact, setSelectedContact, onCreateNewLead, lead = false, users = null }) => {
    const [searchTerm, setSearchTerm] = useState(selectedContact?.full_name || selectedContact?.contact_name || selectedContact?.name || "");
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [displayContact, setDisplayContact] = useState(null);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (users && searchTerm.trim().length >= 2) {
            const searchLower = searchTerm.toLowerCase();
            const filtered = users.filter(u => u.name.toLowerCase().includes(searchLower));
            setSearchResults(filtered.slice(0, 5));
            setIsDropdownOpen(true);
            positionDropdown();
        } else if (!users && searchTerm.trim().length >= 2) {
            lead ? fetchLeads(searchTerm) : fetchContacts(searchTerm);
        } else {
            setSearchResults([]);
            setIsDropdownOpen(false);
        }
    }, [searchTerm, lead, users]);

    const fetchContacts = async (query) => {
        try {
            const response = await fetch(`https://api.casedb.co/contacts.php?search=${encodeURIComponent(query)}&time=${new Date().getTime()}`);
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
            const response = await fetch(`https://api.casedb.co/leads.php?search=${encodeURIComponent(query)}&time=${new Date().getTime()}`);
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
        setSearchTerm(item.full_name || item.contact_name || item.name || "");
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
        if (selectedContact && !users)
            fetchContact(selectedContact);
        else if (selectedContact && users)
            setDisplayContact(selectedContact);
    }, [selectedContact]);

    const fetchContact = async (id) => {
        try {
            const response = await fetch(`https://api.casedb.co/contacts.php?id=${id?.id ? id.id : id}`);
            const data = await response.json();
            if (data.contacts.id) {
                setDisplayContact(data.contacts);
            } else {
                const response = await fetch(`https://api.casedb.co/user.php?id=${id?.id ? id.id : id}`);
                const data = await response.json();
                if (response.ok) {
                    setDisplayContact(data.contacts);
                }
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
                        placeholder={users ? "Name or @username" : lead ? "Search for lead..." : "Search or create contact..."}
                        value={searchTerm}
                        onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        name='contact-input'
                        autoComplete="off"
                    />
                    {!users && <div
                        className='form-box alt'
                        title="Create new contact"
                        onClick={() => !lead ? onCreateNewContact() : onCreateNewLead()}
                    >
                        <UserRoundPlus size={20} />
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
                                    {users 
                                        ? `${item.name}`
                                        : lead 
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
                    {users ? (
                        <>
                            <span className='contact-initials'>
                                {selectedContact?.profile_picture 
                                    ? <img src={`https://api.casedb.co/${selectedContact.profile_picture}`} /> 
                                    : `${selectedContact?.name?.trim().charAt(0)}${selectedContact?.name?.trim().split(" ")[2] 
                                        ? selectedContact?.name?.trim().split(" ")[2]?.charAt(0) 
                                        : selectedContact?.name?.trim().split(" ")[1]?.charAt(0)}`}
                            </span>
                            <div className='contact-display-shortform'>
                                <span className='subtext'>{selectedContact?.name}</span>
                                <span className='subtext'>{`@${selectedContact?.user}` || selectedContact?.id}</span>
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
                        </>
                    ) : (
                        <>
                            {displayContact?.profile_picture ? (
                                <img src={`https://api.casedb.co/${displayContact?.profile_picture}`} alt="Profile" className='contact-initials'/>
                            ) : (
                                <span className='contact-initials'>
                                    {`${displayContact?.full_name?.trim().charAt(0)}${displayContact?.last_name?.trim().charAt(0)}`}
                                </span>
                            )}
                            <div className='contact-display'>
                                <span className='subtext'>{displayContact?.full_name}</span>
                                <div className='subtext contact-divider'>
                                    <span>{displayContact?.phones?.[0]?.number}</span>
                                    {displayContact?.phones?.[0]?.number && displayContact?.emails?.[0]?.email && (
                                        <SquareRounded style={{ height: "5px", width: "5px" }}/>
                                    )}
                                    <span>{displayContact?.emails?.[0]?.email}</span>
                                </div>
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
                        </>
                    )}
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
                            const res = await fetch(`https://api.casedb.co/contacts.php?id=${id}`);
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
                const response = await fetch(`https://api.casedb.co/templates.php?time=${new Date().getTime()}`);
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

export const DateRange = ({ title }) => {
    const [preset, setPreset] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const handleReset = () => {
        setPreset('');
        setStartDate(null);
        setEndDate(null);
    }

    return (
        <div className='date-range'>
            <label className='subtext'>{title}</label>
            <div className='date-range-inputs'>
                <div className='data-presets form-box alt'><Calendar size={18} /></div>
                <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
            fetch(`https://api.casedb.co/contacts.php?ids=${Array.from(contactIds).join(',')}`)
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
        const isContactField = field.field_id === 8;

        if (isContactField) {
            return contactMap?.[rawValue] || rawValue;
        }
            
        try {
            const opts = JSON.parse(field.options || "[]");
            if (opts && (typeof rawValue === 'number' || !isNaN(rawValue))) {
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
                    {fields.filter(f => f.field_id !== 14 && f.field_id !== 13).map(f => (
                        <th key={f.id} title={f.name}>{`${f.name?.slice(0,32)}${f.name.length > 32 ? '...' : ''}`}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((group, index) => (
                    <tr key={`group-${index}`} className='data-cell' onClick={() => onRowClick && onRowClick(group)}>
                        {fields.filter(f => f.field_id !== 14 && f.field_id !== 13).map(f => {
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
    const [attachFile, setAttachFile] = useState(false);
    const [activityData, setActivityData] = useState({
        subject: "",
        content: "",
        attachments: "",
        type: "notes",
        tags: [],
        case_id: case_id,
        contact: { id: null },
    });

    const userMap = users.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
    }, {});
      
    const handleInputChange = (key) => (value) => {
        setActivityData((prev) => ({ ...prev, [key]: value, type: activeActivityType === 0 ? "notes" : activeActivityType === 1 ? "tasks" : "calls" }));
    };

    const handleSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append("case_id", activityData.case_id);
            formData.append("type", activityData.type);
            formData.append("subject", activityData.subject);
            formData.append("content", activityData.content);
            formData.append("tags", JSON.stringify(activityData.tags || []));
            if (activityData.task) {
                formData.append("task", activityData.task);
                formData.append("due_date", activityData.due_date || "")
            }
    
            if (activityData.type === 'calls') {
                formData.append("date", activityData.date || "");
                formData.append("start_time", activityData.start_time || "");
                formData.append("end_time", activityData.end_time || "");
                if (activityData.contact?.id) {
                    formData.append("contact_id", activityData.contact.id);
                }
            }
    
            if (Array.isArray(activityData.attachments)) {
                activityData.attachments.forEach((file) => {
                    if (file && typeof file.name === "string" && typeof file.size === "number") {
                        formData.append("attachment[]", file);
                    }
                });
            }            
    
            const response = await fetch("https://api.casedb.co/activity_feed.php", {
                method: "POST",
                body: formData,
            });
    
            const data = await response.json();
            if (data.success) {
                setAddActivity(false);
                setActivityData({
                    subject: "",
                    content: "",
                    attachments: [],
                    type: "notes",
                    tags: [],
                    case_id: case_id,
                    contact: { id: null },
                });
                setActiveActivityType(0);
                fetchFeed();
            } else {
                console.error("Error adding activity:", data);
            }
        } catch (error) {
            console.error("Error adding activity:", error);
        }
    };

    return (
        <>
            {!addActivity ? 
                <div className='form-group activity'>
                    <input
                        type='text'
                        onClick={onClick}
                        placeholder="Add new activity..."
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
                    {attachFile && <MultiFile
                        value={activityData.attachments}
                        onChange={(val) => handleInputChange("attachments")(val)}
                        lead_id={case_id}
                        sectionName="Activity Feed"
                    />}
                    {activeActivityType === 1 && (
                        <div className="activity-task-info">
                            <div className='form-group task-assign activity'>
                                <label className='activity-type-label subtext'>Assign to</label>
                                <SearchSelect
                                    value={activityData.task}
                                    onChange={(val) => handleInputChange("task")(Number(val))}
                                    options={userMap}
                                    placeholder="Select a user..."
                                />
                            </div>
                            <div className='form-group task-assign activity'>
                                <label className='activity-type-label subtext'>Due date</label>
                                <DateInput
                                    value={activityData.due_date}
                                    onChange={(val) => handleInputChange("due_date")(val)}
                                />
                            </div>
                        </div>
                    )}
                    {activeActivityType === 2 && (
                        <div className='activity-call-info'>
                            <div className='form-group call-log activity'>
                                <label className="activity-type-label subtext">Date</label>
                                <DateInput
                                    value={activityData.date}
                                    onChange={(val) => handleInputChange("date")(val)}
                                />
                            </div>
                            <div className='form-group call-log activity'>
                                <label className="activity-type-label subtext">Start Time</label>
                                <TimeInput
                                    value={activityData.start_time}
                                    onChange={(val) => handleInputChange("start_time")(val)}
                                />
                            </div>
                            <div className='form-group call-log activity'>
                                <label className="activity-type-label subtext">End Time</label>
                                <TimeInput
                                    value={activityData.end_time}
                                    onChange={(val) => handleInputChange("end_time")(val)}
                                />
                            </div>
                            <div className='form-group activity'>
                                <label className="activity-type-label subtext">Contact</label>
                                <Contact
                                    selectedContact={activityData.contact.id}
                                    setSelectedContact={(contact) => handleInputChange("contact")(contact)}
                                    onCreateNewContact={() => handleInputChange("contact")({ id: 0 })}
                                />
                            </div>
                        </div>)}
                    <div className='activity-actions'>
                        <div className='activity-additional'>
                            <div className='activity-additional-item subtext'>
                                <Hash size={14}/>
                                <span>Add tags</span>
                            </div>
                            <div className='activity-additional-item subtext' onClick={() => setAttachFile(!attachFile)}>
                                <Paperclip size={14}/>
                                <span>{!attachFile ? 'Attach a' : 'Remove'} file</span>
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
                    <X size={20} className='exit' onClick={() => {setAddActivity(false); setActiveActivityType(0);}} />
                </div>
            )}
        </>
    );
}

export const Notification = ({ count, type }) => {
    return (
        <>
            {count > 0 && <div className={`notification ${type}`}>
                {count}
            </div>}
        </>
    )
}

export const File = ({ file, onClick }) => {
    return (
        <div className='file subtext' onClick={onClick} title={file?.name}>
            {file?.name?.length > 35 ? `${file?.name?.slice(0, 31)}(...).${file.name.slice(file.name.length - 4, file.name.length)}` : file.name}
        </div>
    );
};

export const MiniNav = ({ options = [], selectedOption, setSelectedOption }) => {
    return (
        <>
            <div className='mini-nav'>
                {options.map((option, index) => (
                    <div 
                        key={index} 
                        className={`option${selectedOption === index ? ' active' : ''}`} 
                        onClick={() => setSelectedOption(index)}
                    >
                        {option}
                    </div>
                ))}
            </div>
        </>
    );
}

export const BankAccountLink = ({ value, onChange }) => {
    return (
        <div className='bank-account'>
        <Instructions
            instructions={
                <>
                    No accounts available.
                    <br />
                    <br />
                    Request feature completion by contacting:{' '}
                    <a href="mailto:tnolet@dalyblack.com">tnolet@dalyblack.com</a>
                </>
            }
        />
        </div>
    )
};