import React, { useState, useEffect } from 'react';
import { Boolean, Calculation, Contact, ContactList, DateInput, Deadline, Dropdown, FileUpload, Instructions, MultiFile, MultiSelect, NumberInput, Subheader, Text, TimeInput } from "./FieldComponents";
import { Folder as FolderIcon, FolderOpen, FolderOutlined } from "@mui/icons-material";

const normalizeValueToIndex = (field, value) => {
    if (!field.options) return value;

    let options = [];
    try {
        options = Array.isArray(field.options)
            ? field.options
            : JSON.parse(field.options);
    } catch {
        return value;
    }

    if (typeof value === "string") {
        const index = options.findIndex(opt => opt.toLowerCase?.() === value.toLowerCase?.());
        return index !== -1 ? index : value;
    }

    return value;
};

const FolderNode = ({ name, files, caseName, level = 0 }) => {
    const [open, setOpen] = useState(level === 0);

    const subfolders = {};
    const flatFiles = [];

    files.forEach(file => {
        const relative = file.key.replace(/^.*?\/\d+\//, '');
        const parts = relative.split('/').filter(Boolean);

        if (parts.length > 1) {
            const subfolder = parts[0];
            const rest = parts.slice(1).join('/');
            if (!subfolders[subfolder]) subfolders[subfolder] = [];
            subfolders[subfolder].push({ ...file, key: rest });
        } else {
            flatFiles.push(file);
        }
    });

    return (
        <div className={`folder-node level-${level}`}>
            <div className='folder-header' onClick={() => setOpen(!open)}>
                {Object.keys(subfolders).length > 0 ? (
                    open ? <FolderOpen className='folder-icon' /> : <FolderIcon className='folder-icon' />
                ) : (
                    <FolderOutlined className='folder-icon' />
                )}
                <span>{caseName && name === "{{Name}}" ? caseName : name}</span>
            </div>
            {open && (
                <div className='folder-contents'>
                    {Object.entries(subfolders).map(([sub, subFiles]) => (
                        <FolderNode key={sub} name={sub} files={subFiles} caseName={caseName} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const Documents = ({ folders, caseName }) => {
    const allFiles = [];
    Object.values(folders).forEach(group => {
        allFiles.push(...group);
    });

    return (
        <div className='documents'>
            <FolderNode name="Root" files={allFiles} caseName={caseName} />
        </div>
    );
};

const Field = ({ field, value, handleFieldChange }) => {
    if (!field) return null;

    const renderFieldInput = (field) => {
        switch (field.field_id) {
            case 1:
                return (
                    <Text type="text" placeholder={field.name} 
                    value={value}
                    onChange={(val) => handleFieldChange(field.id, val)}/>
                );
            case 2:
                return (
                    <Text type="textarea" placeholder={field.name} 
                    value={value}
                    onChange={(val) => handleFieldChange(field.id, val)}/>
                );
            case 3:
                return (
                    <NumberInput type="currency"
                    value={value}
                    onChange={(val) => handleFieldChange(field.id, val)}/>
                );
            case 4:
                return (
                    <NumberInput type="percent" />
                );
            case 5:
                return (
                    <NumberInput type="number" />
                );
            case 6:
                return (
                    <DateInput />
                );
            case 7:
                return (
                    <TimeInput />
                );
            case 8:
                return (
                    <Contact
                        selectedContact={value}
                        setSelectedContact={(contact) => handleFieldChange(field.id, contact?.id || null)}
                    />
                );
            case 9:
                return (
                    <ContactList onChange={(ids) => handleFieldChange(field.id, ids)} />
                );                
            case 10:
                return (
                    <Dropdown
                        options={field.options || "[]"}
                        value={(() => {
                            try {
                                const opts = JSON.parse(field.options || "[]");
                                return opts[value] ?? "";
                            } catch {
                                return "";
                            }
                        })()}
                        onChange={(val) => {
                            const opts = JSON.parse(field.options || "[]");
                            const index = opts.indexOf(val);
                            handleFieldChange(field.id, index);
                        }}
                    />
                );
            case 11:
                return (
                    <MultiSelect
                        options={field.options || "[]"}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                    />
                );                
            case 12:
                return (
                    <Boolean
                        options={field.options || []}
                        value={value ?? 2}
                        onChange={(selectedValue) => handleFieldChange(field.id, selectedValue)}
                    />
                );
            case 13:
                return (
                    <Subheader title={field.name} />
                );
            case 14:
                return (
                    <Instructions instructions={field.name} />
                );
            case 15:
                return (
                    <FileUpload />
                );
            case 16:
                return (
                    <MultiFile
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                    />
                );
            case 17:
                return (
                    <Calculation />
                );
            case 20:
                return (
                    <Deadline />
                );
            default:
                return null;
        }
    };

    return (
        <>
            {![13, 14, 20].includes(field.field_id) ? (
                <div className='form-group nm'>
                    <label className='subtext'>{field.name}</label>
                    {renderFieldInput(field)}
                </div>
            ) : field.field_id === 20 ? (
                renderFieldInput(field)
            ) : (
                renderFieldInput(field)
            )}
        </>
    );    
};

export const Section = ({ folders, caseName, caseType, section_id, template_id }) => {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});

    const handleFieldChange = (fieldId, value) => {
        setFormData((prev) => {
            const updated = { ...prev, [fieldId]: value };
            return updated;
        });
    };

    const visibleFields = fields
        .filter(f => f.hidden !== 2 && f.obsolete !== 2)
        .sort((a, b) => a.order_id - b.order_id);

    const shouldDisplay = (field) => {
        if (Number(field.case_type_id) !== Number(caseType) && Number(field.case_type_id) !== 0) return false;
    
        const controllingField = fields.find(f => f.id === field.display_when);
        if (!field.display_when || !controllingField) return true;
    
        let controllingValue = formData[field.display_when];
    
        if (field.is_answered === null || field.is_answered === "") {
            return controllingValue !== null && controllingValue !== undefined && controllingValue !== "";
        }
    
        controllingValue = normalizeValueToIndex(controllingField, controllingValue);
        const validAnswers = field.is_answered
            .split(',')
            .map(v => v.trim());
    
        return validAnswers.includes(String(controllingValue));
    };

    useEffect(() => {
        fetchSectionFields();
    }, [template_id]);

    const fetchSectionFields = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/custom_fields.php?section_id=${section_id}&template_id=${template_id}&${new Date().getTime()}`);
            const data = await response.json();
            setFields(data.custom_fields);
        } catch (error) {
            console.error("Error fetching section fields:", error);
        }
    };

    return (
        <div className='case-section'>
            {section_id === 3 ? (
                <Documents folders={folders} caseName={caseName} />
            ) : (() => {
                const result = [];
                let currentSubSection = null;
    
                visibleFields.forEach((field, index) => {
                    if (!shouldDisplay(field)) return;
                
                    const isSubheader = field.field_id === 13;
                    const nextField = visibleFields[index + 1];
                    const nextIsSubheader = nextField?.field_id === 13;              
    
                    if (isSubheader) {
                        if (currentSubSection) {
                            result.push(
                                <div key={`sub-${index}`} className='sub-section'>
                                    {currentSubSection}
                                </div>
                            );
                        }
                        currentSubSection = [<Field
                            key={field.id}
                            field={field}
                            value={formData[field.id]}
                            handleFieldChange={handleFieldChange}
                        />];
                    } else if (currentSubSection) {
                        currentSubSection.push(<Field
                            key={field.id}
                            field={field}
                            value={formData[field.id]}
                            handleFieldChange={handleFieldChange}
                        />);
                        if (nextIsSubheader || index === fields.length - 1) {
                            result.push(
                                <div key={`sub-${index}`} className='sub-section'>
                                    {currentSubSection}
                                </div>
                            );
                            currentSubSection = null;
                        }
                    } else {
                        result.push(<Field
                            key={field.id}
                            field={field}
                            value={formData[field.id]}
                            handleFieldChange={handleFieldChange}
                        />);
                    }
                });

                if (currentSubSection) {
                    result.push(
                        <div key={`sub-final`} className='sub-section'>
                            {currentSubSection}
                        </div>
                    );
                }
    
                return result;
            })()}
        </div>
    );    
}