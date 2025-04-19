import React, { useState, useEffect, useRef } from 'react';
import { Boolean, Calculation, Contact, ContactList, DateInput, Deadline, Dropdown, FileUpload, Instructions, MultiFile, MultiSelect, NumberInput, Subheader, Text, TimeInput, TableOfContents, DataTable, SaveButton, SearchSelect, DocGen } from "./FieldComponents";
import { Folder as FolderIcon, FolderOutlined } from "@mui/icons-material";
import { File as FileIcon, FolderOpenIcon } from "lucide-react";
import { ActivityFeed } from './ActivityFeed';
import { DocumentSection } from './DocumentSection';
import '../styles/Documents.css';
import { useLocation } from 'react-router';
import { TimeBilling } from './TimeBilling';
import { CreateContact } from './CreateContact';

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

const FolderNode = ({ name, files, caseName, level = 0, subfoldersEl, onClick, isActive, shouldOpen }) => {
    const [open, setOpen] = useState(level === 0);
    const hasFiles = files && files.length > 0;
    const hasChildren = subfoldersEl && subfoldersEl.length > 0;
    const isEmpty = !hasFiles && !hasChildren;

    useEffect(() => {
        if (shouldOpen) {
            setOpen(shouldOpen);
        }
    }, [shouldOpen]);

    if (name === 'root') return null;

    return (
        <li>
            <div
                className={`folder-node ${isActive ? 'active' : ''}`}
                onClick={() => {
                    if (!isActive) {
                        onClick && onClick();
                        if (!isEmpty) setOpen(true);
                    } else {
                        if (!isEmpty) setOpen(!open);
                    }
                }}
            >
                {hasChildren ? (
                    open ? <FolderOpenIcon/> : <FolderIcon/>
                ) : (
                    <FolderOutlined/>
                )}
                <span>{caseName && name === "{{Name}}" ? caseName : name}</span>
            </div>

            {open && (
                <>
                    {hasChildren && (
                        <ul className={`folder-tree level-${level + 1}`}>
                            {subfoldersEl}
                        </ul>
                    )}
                </>
            )}
        </li>
    );
};

const Documents = ({ fetchDocuments, folders, caseName, case_id, user_id }) => {
    const [currentFolder, setCurrentFolder] = useState(null);
    const folderEntries = Object.entries(folders);
    const [docNav, setDocNav] = useState(true);
    const [folderInitialized, setFolderInitialized] = useState(false);
    const location = useLocation();
    const folderEffectRun = useRef(false);

    const buildFolderTree = () => {
        const root = {};
        folderEntries.forEach(([path, files]) => {
            const parts = path.split('/');
            let current = root;

            parts.forEach((part, index) => {
                if (!current[part]) current[part] = { __files: [] };
                if (index === parts.length - 1) {
                    current[part].__files = files;
                }
                current = current[part];
            });
        });

        return root;
    };

    console.log(currentFolder);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        if (!folders || Object.keys(folders).length === 0) return;
    
        const params = new URLSearchParams(location.search);
        const folderParam = params.get("folder");
    
        const nameFolder = Object.keys(folders).find((key) => key.includes("{{Name}}"));
        if (!nameFolder) return;
    
        if (folderParam && !folderEffectRun.current) {
            const fullPath = `${nameFolder}/${folderParam}`;
            const targetFiles = folders[fullPath];
    
            if (targetFiles) {
                const subfolderTree = Object.fromEntries(
                    Object.entries(folders)
                        .filter(([key]) => key.startsWith(`${fullPath}/`))
                        .map(([key, value]) => {
                            const sub = key.replace(`${fullPath}/`, "").split("/")[0];
                            return [sub, value];
                        })
                );
    
                setCurrentFolder({
                    path: fullPath,
                    files: targetFiles,
                    subfolders: subfolderTree,
                });
    
                params.delete("folder");
                const newUrl = `${window.location.pathname}`
                window.history.replaceState({}, "", newUrl);
    
                folderEffectRun.current = true;
                return;
            }
        }
    
        if (!currentFolder && nameFolder) {
            const subfolderTree = Object.fromEntries(
                Object.entries(folders)
                    .filter(([key]) => key.startsWith(`${nameFolder}/`))
                    .map(([key, value]) => {
                        const sub = key.replace(`${nameFolder}/`, "").split("/")[0];
                        return [sub, value];
                    })
            );
    
            setCurrentFolder({
                path: nameFolder,
                files: folders[nameFolder] || [],
                subfolders: subfolderTree,
            });
        }
    }, [folders, location.search]);

    const renderTree = (tree, level = 0, parentPath = '') => {
        return Object.entries(tree).map(([folderName, data]) => {
            const subfolders = Object.fromEntries(
                Object.entries(data).filter(([key]) => key !== '__files')
            );
            const fileList = data.__files || [];
            const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;

            return (
                <FolderNode
                    key={`${level}-${folderName}`}
                    name={folderName}
                    files={fileList}
                    caseName={caseName}
                    level={level}
                    subfoldersEl={renderTree(subfolders, level + 1, fullPath)}
                    onClick={() => setCurrentFolder({ path: fullPath, files: fileList, subfolders })}
                    isActive={currentFolder?.path === fullPath}
                    shouldOpen={currentFolder?.path?.startsWith(fullPath)}
                />
            );
        });
    };

    const folderTree = buildFolderTree();

    return (
        <>
            <ul className="document-nav" style={docNav ? { width: '350px', padding: '15px 0 0 15px', borderRight: '1px solid var(--border-color)' } : { width: '0', padding: '15px 0 0 0', border: 'none' }}>
                {renderTree(folderTree)}
            </ul>
            {currentFolder && (
                <DocumentSection
                    folderName={currentFolder.path}
                    files={currentFolder.files}
                    subfolders={currentFolder.subfolders}
                    caseName={caseName}
                    onFolderClick={(subfolderName) => {
                        const nextPath = `${currentFolder.path}/${subfolderName}`;
                        const fullEntry = folders[nextPath];
                        const subfolderTree = Object.fromEntries(
                            Object.entries(folders)
                                .filter(([key]) => key.startsWith(`${nextPath}/`))
                                .map(([key, value]) => {
                                    const sub = key.replace(`${nextPath}/`, '').split('/')[0];
                                    return [sub, value];
                                })
                        );
                        setCurrentFolder({
                            path: nextPath,
                            files: fullEntry || [],
                            subfolders: subfolderTree
                        });
                    }}
                    onBreadcrumbClick={(path) => {
                        const subfolderTree = Object.fromEntries(
                            Object.entries(folders)
                                .filter(([key]) => key.startsWith(`${path}/`))
                                .map(([key, value]) => {
                                    const sub = key.replace(`${path}/`, '').split('/')[0];
                                    return [sub, value];
                                })
                        );
                        setCurrentFolder({
                            path,
                            files: folders[path] || [],
                            subfolders: subfolderTree
                        });
                    }}
                    setDocNav={setDocNav}
                    docNav={docNav}
                    case_id={case_id}
                    user_id={user_id}
                    fetchDocuments={fetchDocuments}
                />
            )}
        </>
    );
};

const Field = ({ field, value, handleFieldChange, conditional = false, formData, fieldUpdates, fields, lead_id, refreshAfterCalc, sectionName, setNewContactFieldId, setCreateContact }) => {
    if (!field) return null;

    const renderFieldInput = (field) => {
        switch (field.field_id) {
            case 1:
                return <Text type="text" placeholder={field.name} value={value} onChange={(val) => handleFieldChange(field.id, val)} />;
            case 2:
                return <Text type="textarea" placeholder={field.name} value={value} onChange={(val) => handleFieldChange(field.id, val)} />;
            case 3:
                return <NumberInput type="currency" value={value} onChange={(val) => handleFieldChange(field.id, val)} />;
            case 4:
                return <NumberInput type="percent" value={value} onChange={(val) => handleFieldChange(field.id, val)}/>;
            case 5:
                return <NumberInput type="number" value={value} onChange={(val) => handleFieldChange(field.id, val)}/>;
            case 6:
                return <DateInput value={String(value)} onChange={(val) => handleFieldChange(field.id, val)}/>;
            case 7:
                return <TimeInput value={value} onChange={(val) => handleFieldChange(field.id, val)}/>;
                case 8:
                    return (
                        <Contact
                            selectedContact={value}
                            setSelectedContact={(contact) => handleFieldChange(field.id, contact?.id || null)}
                            onCreateNewContact={() => {
                                setNewContactFieldId(field.id);
                                setCreateContact(true);
                            }}
                        />
                    );
            case 9:
                return (
                    <ContactList
                        value={Array.isArray(value) ? value : []}
                        onChange={(ids) => handleFieldChange(field.id, ids)}
                    />
                );
            case 10:
                return <Dropdown
                            options={field.options || "[]"}
                            value={value}
                            onChange={(index) => handleFieldChange(field.id, index)}
                            marketing_list={field.id === 225}
                        />;
            case 11:
                return <MultiSelect options={field.options || "[]"} value={value} onChange={(val) => handleFieldChange(field.id, val)} />;
            case 12:
                return <Boolean options={field.options || []} value={value != undefined ? Number(value) : 2} onChange={(selectedValue) => handleFieldChange(field.id, selectedValue)} />;
            case 13:
                return <Subheader title={field.name} />;
            case 14:
                return <Instructions instructions={field.name}/>;
            case 15:
                return <FileUpload
                    value={value}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    lead_id={lead_id}
                    section_name={sectionName}
                />
            case 16:
                return <MultiFile
                    value={value}
                    lead_id={lead_id}
                    sectionName={sectionName}
                    onChange={(val) => handleFieldChange(field.id, val)}
                />
            case 17:
                return (
                    <Calculation
                        options={field.options}
                        fieldId={field.id}
                        lead_id={lead_id}
                        fields={fields}
                        formData={formData}
                        fieldUpdates={fieldUpdates}
                        onChange={(val) => refreshAfterCalc(field.id, val)}
                    />
                );                
            case 18:
                return <DocGen
                            value={value}
                            onChange={(val) => handleFieldChange(field.id, val)}
                        />;
            case 20:
                const parsedValue = typeof value === 'string' ? JSON.parse(value || '{}') : value || {};
                return <Deadline 
                            value={{ due: parsedValue.due || '', done: parsedValue.done || '' }}
                            title={field.name}
                            onChange={(updated) => handleFieldChange(field.id, {
                                ...parsedValue,
                                ...updated
                            })}
                        />;
            case 22:
                return <SearchSelect
                            value={value}
                            onChange={(val) => handleFieldChange(field.id, val)}
                            options={field.options}
                        />;
            default:
                return null;
        }
    };

    return (
        <>
            {![13, 14, 20].includes(field.field_id) ? (
                <div className={`form-group nm ${conditional === false ? '' : 'conditional'}`}>
                    <label className='subtext'>{field.name}</label>
                    {renderFieldInput(field)}
                </div>
            ) : renderFieldInput(field)}
        </>
    );
};

export const Section = ({ folders, fetchDocuments, id, lead_id, caseName, caseType, section_id, template_id, user_id }) => {
    const [fields, setFields] = useState([]);
    const [fieldUpdates, setFieldUpdates] = useState([]);
    const [formData, setFormData] = useState({});
    const [newData, setNewData] = useState({});
    const [addItemMode, setAddItemMode] = useState(false);
    const [dataChanged, setDataChanged] = useState(false);
    const [groupedData, setGroupedData] = useState([]);
    const [sectionName, setSectionName] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [createContact, setCreateContact] = useState(false);
    const [newContactFieldId, setNewContactFieldId] = useState(null);

    const handleNewContactCreated = (contact) => {
        if (newContactFieldId !== null && contact?.id) {
            handleFieldChange(newContactFieldId, contact.id);
        }
        setCreateContact(false);
        setNewContactFieldId(null);
    };

    useEffect(() => {
        setAddItemMode(false);
        setNewData({});
        setDataChanged(false);
    }, [section_id]);

    const handleFieldChange = (fieldId, value) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
        setNewData((prev) => ({
            ...prev,
            lead_id,
            field_values: {
            ...(prev.field_values || {}),
            [fieldId]: (value && typeof value === 'object' && !Array.isArray(value))
                ? JSON.stringify(value)
                : value
            }
        }));
    };

    const refreshAfterCalc = (fieldId, value) => {
        handleFieldChange(fieldId, value);
    };

    const fetchFields = async () => {
        try {
            const res = await fetch(`https://api.casedb.co/custom_fields.php?section_id=${section_id}&template_id=${template_id}&lead_id=${lead_id}&${Date.now()}`);
            const data = await res.json();
            
            setFields(data.custom_fields || []);
            setSectionName(data.section_name);
            mergeFieldValues(data.custom_fields, data.field_updates || []);            
        } catch (error) {
            console.error("Error fetching section data:", error);
        }
    };

    const mergeFieldValues = (customFields, updates) => {
        let flat = {};
        const flatMap = {};
        const grouped = [];
    
        updates.forEach(update => {
            if (update.group_id === 0) {
                flat = update;
    
                Object.entries(update).forEach(([key, val]) => {
                    if (key !== 'group_id') {
                        const fieldDef = customFields.find(f => String(f.id) === String(key));
                
                        if (String(val) === String(key)) return;
                
                        if (fieldDef?.field_id === 17) {
                            const num = parseFloat(val);
                            flatMap[key] = isNaN(num) ? 0 : parseFloat(num.toFixed(2));
                        } else {
                            flatMap[key] = val;
                        }
                    }
                });                
            } else {
                grouped.push(update);
            }
        });
    
        setFieldUpdates((prev) => JSON.stringify(prev) !== JSON.stringify(flatMap) ? flatMap : prev);
        setGroupedData((prev) => JSON.stringify(prev) !== JSON.stringify(grouped) ? grouped : prev);        
    };

    const updateFields = (data) => {
        fetch('https://api.casedb.co/custom_fields.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    fetchFields();
                    setAddItemMode(false);
                    setNewData({});
                    setFormData({});
                    setSelectedRow(null);   
                } else {
                    console.error("Failed to update fields:", data.message);
                }
            })
            .catch(error => console.error("Error updating fields:", error));
    };

    const saveFields = async () => {
        if (selectedRow) {
            newData.group_id = selectedRow.group_id;
        }
        
        updateFields(newData);
        
        const isFile = (val) =>
            val &&
            typeof val === 'object' &&
            typeof val.name === 'string' &&
            typeof val.type === 'string' &&
            typeof val.size === 'number' &&
            typeof val.lastModified === 'number';
        
        const hasFileUploads = Object.values(formData).some(val =>
            isFile(val) || (Array.isArray(val) && val.length && isFile(val[0]))
        );
        
        if (hasFileUploads) {
            await uploadFiles();
        }
    };

    useEffect(() => {
        setDataChanged(true);
    }, [formData]);

    const resolveCalculationValue = (fieldId, visited = new Set()) => {
        if (visited.has(fieldId)) {
            console.warn(`Circular dependency detected for field ID: ${fieldId}`);
            return 0;
        }
    
        visited.add(fieldId);
    
        const field = fields.find(f => f.id === fieldId);
        if (!field || field.field_id !== 17) return getFieldValue(field);
    
        const options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
        const dependentFieldIds = JSON.parse(options?.field_ids || '[]');
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        let expression = options?.rule || '';
    
        dependentFieldIds.forEach((id, idx) => {
            let value = resolveCalculationValue(id, visited);
            if (value === '' || value === null || value === undefined) {
                const operatorBefore = expression[expression.indexOf(letters[idx]) - 1];
                value = operatorBefore === '*' || operatorBefore === '/' ? 1 : 0;
            }
            expression = expression.replaceAll(letters[idx], value);
        });
    
        try {
            if (!expression || /[^0-9+\-*/(). ]/.test(expression) || /[+\-*/]$/.test(expression)) {
                throw new SyntaxError(`Invalid or incomplete expression: "${expression}"`);
            }
    
            const result = new Function(`return ${expression}`)();
            return typeof result === 'number' ? parseFloat(result.toFixed(2)) : 0;
        } catch (e) {
            console.error(`Error evaluating calculation for field ID: ${fieldId}`, e, { expression });
            return 0;
        }
    };
    
    const getFieldValue = (field) => {
        if (field.add_item === 1) {
            return formData[field.id];
        } else {
            const val = formData[field.id];
            if (val !== undefined && val !== null) return val;
    
            const stored = fieldUpdates?.[field.id];
            if (stored !== undefined) return stored;
    
            if (field.field_id === 17) {
                return resolveCalculationValue(field.id);
            }
    
            if (field.field_id === 12) return 2;
    
            return '';
        }
    };

    const shouldDisplay = (field) => {
        if (field.add_item === 1 && !addItemMode) return false;
    
        if (Number(field.case_type_id) !== Number(caseType) && Number(field.case_type_id) !== 0) return false;
    
        const controllingField = fields.find(f => f.id === field.display_when);
        if (!field.display_when || !controllingField) return true;
    
        let controllingValue = getFieldValue(controllingField);
    
        if (field.is_answered === null || field.is_answered === "") {
            return controllingValue !== null && controllingValue !== undefined && controllingValue !== "";
        }
    
        controllingValue = normalizeValueToIndex(controllingField, controllingValue);
    
        let parsedAnswers = [];
        try {
            const parsed = JSON.parse(field.is_answered);
            if (Array.isArray(parsed)) parsedAnswers = parsed.map(v => String(v));
            else parsedAnswers = [String(parsed)];
        } catch {
            parsedAnswers = String(field.is_answered).split(',').map(v => v.trim());
        }
        
        const isNegated = parsedAnswers.every(answer => String(answer).startsWith('!'));
        const cleanAnswers = parsedAnswers.map((v) => String(v).replace(/^!/, ''));

        if (isNegated) {
            return !cleanAnswers.includes(String(controllingValue));
        } else {
            return cleanAnswers.includes(String(controllingValue));
        }
    };

    useEffect(() => {
        fetchFields();
    }, [template_id]);

    const dependencyMap = {};
    fields.forEach(field => {
        if (field.display_when) {
            if (!dependencyMap[field.display_when]) dependencyMap[field.display_when] = [];
            dependencyMap[field.display_when].push(field);
        }
    });

    const rendered = new Set();
    const output = [];
    let currentSubSection = [];

    const flushSubSection = () => {
        if (currentSubSection.length > 0) {
            if (currentSubSection[0].props.field.field_id === 13) {
                output.push(
                    <React.Fragment key={`frag-${output.length}`}>
                        {currentSubSection}
                    </React.Fragment>
                );
            } else {
                output.push(
                    <div className="sub-section" key={`sub-${output.length}`}>
                        {currentSubSection}
                    </div>
                );
            }
            currentSubSection = [];
        }
    };

    fields
        .filter(f => f.hidden !== 2 && f.obsolete !== 2)
        .sort((a, b) => a.order_id - b.order_id)
        .forEach((field, index) => {
            if (rendered.has(field.id)) return;

            const children = dependencyMap[field.id] || [];
            const visibleChildren = children.filter(shouldDisplay);
            
            const fieldEl = (
                <Field
                    key={`${field.id}-${index}`}
                    field={field}
                    value={getFieldValue(field)}
                    handleFieldChange={handleFieldChange}
                    conditional={false}
                    formData={formData}
                    fieldUpdates={fieldUpdates}
                    fields={fields}
                    lead_id={lead_id}
                    refreshAfterCalc={refreshAfterCalc}
                    sectionName={sectionName}
                    setNewContactFieldId={setNewContactFieldId}
                    setCreateContact={setCreateContact}
                />
            );
            
            const childrenEls = visibleChildren.map(child => (
                <Field
                    key={`${child.id}-${index}-child`}
                    field={child}
                    value={getFieldValue(child)}
                    handleFieldChange={handleFieldChange}
                    conditional={true}
                    formData={formData}
                    fieldUpdates={fieldUpdates}
                    fields={fields}
                    lead_id={lead_id}
                    refreshAfterCalc={refreshAfterCalc}
                    sectionName={sectionName}
                    setNewContactFieldId={setNewContactFieldId}
                    setCreateContact={setCreateContact}
                />
            ));            

            if (!shouldDisplay(field)) return;

            rendered.add(field.id);
            
            if (visibleChildren.length > 0) {
                children.forEach(child => {
                    if (shouldDisplay(child)) {
                        rendered.add(child.id);
                    }
                });
            }

            if (field.field_id === 13) {
                flushSubSection();
                currentSubSection.push(fieldEl, ...childrenEls);
                flushSubSection();
            } else {
                currentSubSection.push(fieldEl, ...childrenEls);
            }
        });

    flushSubSection();

    const sectionFields = fields.filter(f => f.hidden !== 2 && f.obsolete !== 2 && f.field_id === 13) ?? [];
    const addItemFields = [];
    const seenFieldIds = new Set();
    
    fields.forEach(f => {
        if (f.add_item === 1 && !seenFieldIds.has(f.id)) {
            addItemFields.push(f);
            seenFieldIds.add(f.id);
        }
    });

    const uploadFiles = async () => {
        const uploads = [];
    
        for (const field of fields) {
            if (formData[field.id]?.constructor?.name === "File") {
                const formDataObj = new FormData();
                formDataObj.append("case_id", id);
                formDataObj.append("section_name", sectionName);
                formDataObj.append("user_id", user_id);
                formDataObj.append("file[]", formData[field.id]);
    
                uploads.push(fetch("https://api.casedb.co/documents.php", {
                    method: "POST",
                    body: formDataObj,
                }));
            }
    
            if (Array.isArray(formData[field.id]) && formData[field.id][0] instanceof File) {
                for (const file of formData[field.id]) {
                    const formDataObj = new FormData();
                    formDataObj.append("case_id", id);
                    formDataObj.append("section_name", sectionName);
                    formDataObj.append("user_id", user_id);
                    formDataObj.append("file[]", file);
    
                    uploads.push(fetch("https://api.casedb.co/documents.php", {
                        method: "POST",
                        body: formDataObj,
                    }));
                }
            }
        }
    
        await Promise.all(uploads);
        fetchDocuments();
    };

    useEffect(() => {
        setAddItemMode(selectedRow);
    }, [selectedRow]);

    const staticSections = ['Documents', 'Activity Feed', 'Time & Billing'];
    if (staticSections.includes(sectionName)) {
        return (
            <div className={`case-section full horizontal`}>
                {sectionName === 'Documents' ? (
                    <Documents fetchDocuments={fetchDocuments} folders={folders} caseName={caseName} case_id={id} user_id={user_id}/>
                ) : sectionName === "Activity Feed" ? (
                    <ActivityFeed case_id={id} user_id={user_id} />
                ) : (
                    <TimeBilling case_id={id} />
                )}
            </div>
        );
    }

    return (
        <div className='case-section'>
            {sectionFields.some(field => (field.add_item !== 1 || addItemMode) && (field.case_type_id === Number(caseType) || field.case_type_id === 0)) && (
                <TableOfContents
                    key={section_id}
                    subheaders={sectionFields.filter(field => (field.add_item !== 1 || addItemMode) && (field.case_type_id === Number(caseType) || field.case_type_id === 0))}
                    dataChanged={dataChanged}
                    cancel={addItemMode}
                    saveFields={saveFields}
                    setAddItemMode={setAddItemMode}
                />
            )}
            {fields.some(f => f.add_item === 1) && (
                <>
                    {!addItemMode ? (
                        <div className={`add-item-btn-wrapper ${addItemMode ? 'alt' : ''}`}>
                            {!selectedRow && <button className="action alt" onClick={() => setAddItemMode(true)}>
                                Add Item
                            </button>}
                            <DataTable
                                fields={addItemFields}
                                data={groupedData}
                                onRowClick={(row) => {
                                    setSelectedRow(row);
                                    setFormData(row);
                                    setAddItemMode(true);
                                    setNewData({
                                        lead_id,
                                        group_id: row.group_id,
                                        field_values: { ...row }
                                    });
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {!sectionFields.some(field => (field.add_item !== 1 || addItemMode) && (field.case_type_id === Number(caseType) || field.case_type_id === 0)) && (
                                <div className='toc-header' style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                                <button className="action alt" onClick={() => {setAddItemMode(false); setSelectedRow(null);}} style={{ marginRight: '15px' }}>
                                    Cancel
                                </button>
                                <button className="action" onClick={() => saveFields()}>
                                    {selectedRow ? "Save" : "Create"}
                                </button>
                                </div>
                            )}
                        </>
                    )}

                </>
            )}
            {(sectionName !== "Documents" && sectionName !== "Activity Feed") && output}
            {createContact && (
                <CreateContact 
                    setCreateContact={setCreateContact} 
                    onContactCreated={handleNewContactCreated} 
                />
            )}
        </div>
      );      
};