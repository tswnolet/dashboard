import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import '../styles/Customs.css';
import { Boolean, Contact, Dropdown, Text, NumberInput, DateInput } from "./FieldComponents";
import { ArrowDown } from "@mynaui/icons-react";
import { ArrowDown01, ArrowDownIcon, ArrowDownToDot, ChevronDown, ChevronUp, Info, MoveDownIcon } from "lucide-react";
import { ArrowDownward } from "@mui/icons-material";

export const CustomFields = () => {
    const [createNew, setCreateNew] = useState(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [fields, setFields] = useState([]);
    const [caseTypes, setCaseTypes] = useState([]);
    const [fieldTypes, setFieldTypes] = useState([]);
    const [newField, setNewField] = useState({
        name: "",
        field_id: 0,
        case_type_id: 0,
        required: false,
        options: [],
        obsolete: 1,
        hidden: 1,
        add_item: null,
        default_value: "",
        display_when: null,
        is_answered: "",
        is_answer_negated: false,
        section_id: null,
        template_id: 1
    });    
    const [selectedFieldType, setSelectedFieldType] = useState(null);
    const filteredFields = fields.filter(f => f.case_type_id === newField.case_type_id);
    const selectedDisplayField = fields.find(f => String(f.id) === String(newField.display_when));
    const displayFieldOptions = Array.isArray(selectedDisplayField?.options) 
        ? selectedDisplayField.options
        : [];
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [fieldOptionsSelected, setFieldOptionsSelected] = useState({});

    useEffect(() => {
        const foundType = fieldTypes.find(ft => Number(ft.id) === Number(newField.field_id));
        setSelectedFieldType(foundType ? foundType.type : null);

        if (foundType?.type === 'boolean') {
            setNewField(prev => ({
                ...prev,
                options: ["Yes", "No", "Unknown"]
            }));
        } else if (fieldTypeNeedsOptions(foundType?.type)) {
            setNewField(prev => ({
                ...prev,
                options: []
            }));
        }
    }, [newField.field_id, fieldTypes]);

    const fieldTypeNeedsOptions = (fieldType) => {
        return ["list", "multiselect", "searchselect"].includes(fieldType);
    };
    
    const isBooleanType = (fieldType) => {
        return fieldType === "boolean";
    };

    const handleAddOption = () => {
        setNewField((prev) => ({
            ...prev,
            options: [...prev.options, ""]
        }));
    };
    
    const handleOptionChange = (index, value) => {
        const updatedOptions = [...newField.options];
        updatedOptions[index] = value;
        setNewField((prev) => ({
            ...prev,
            options: updatedOptions
        }));
    };
    
    const handleRemoveOption = (index) => {
        const updatedOptions = [...newField.options];
        updatedOptions.splice(index, 1);
        setNewField((prev) => ({
            ...prev,
            options: updatedOptions
        }));
    };

    const fetchAllData = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/custom_fields.php?time=${new Date().getTime()}`);
            const data = await response.json();
    
            if (data.success) {
                const parsedFields = data.custom_fields.map(fields => ({
                    ...fields,
                    options: fields.options ? JSON.parse(fields.options) : []
                }));
    
                setCaseTypes(data.case_types.filter(type => type.id !== "0"));
                setFields(parsedFields);
                setFieldTypes(data.fields);
            } else {
                console.error("Error fetching data:", data.message);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    
    useEffect(() => {
        fetchAllData();
    }, []);

    const createCaseType = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/case_types.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newField)
            });
            const data = await response.json();
            if (data.success) {
                setCaseTypes([...caseTypes, newField]);
                setNewField({
                    name: "",
                });
            } else {
                console.error("Error creating new case type:", data.message);
            }
        } catch (error) {
            console.error("Error creating new case type:", error);
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewField(prevState => ({
            ...prevState,
            [name]: value === "" ? "" : value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setNewField(prevState => ({
            ...prevState,
            [name]: checked
        }));
    };

    const handleFieldSubmit = async () => {
        try {
            const payload = {
                ...newField,
                options: newField.options.length > 0 ? newField.options : null,
            };
    
            const response = await fetch(`https://api.casedb.co/custom_fields.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
            if (data.success) {
                fetchAllData();
                setCreateNew(false);
                setNewField({
                    name: "",
                    field_id: 0,
                    case_type_id: 0,
                    required: false,
                    options: [],
                    obsolete: 1,
                    hidden: 1,
                    add_item: null,
                    default_value: "",
                    display_when: null,
                    is_answered: "",
                    is_answer_negated: false,
                    section_id: null,
                    template_id: 1
                });
            } else {
                console.error("Error creating custom field:", data.message);
            }
        } catch (error) {
            console.error("Error creating custom field:", error);
        }
    };

    const handleMouseMove = (event) => {
        setTooltipPos({ x: event.clientX + 10, y: event.clientY });
    };

    const handleBooleanChange = (field_id, value) => {
        setFieldOptionsSelected((prev) => ({
            ...prev,
            [field_id]: value
        }));
    };

    return (
        <>
            <div className="page-container">
                <div id='page-header'>
                    <h1>Custom Fields</h1>
                    <button className='action' onClick={() => setCreateNew('field')}>New Field</button>
                    <button className='action alt' onClick={() => setCreateNew('case type')}>New Case Type</button>
                </div>
                <h4 className='sub-title alt'>Case Types</h4>
                <div className='case-types'>
                    {caseTypes.map((type) => (
                        <div key={type.id} className='case-type'>
                            <p>{type.name} ({type.aka})</p>
                            {type.description && <p className='subtext'>{type.description}</p>}
                        </div>
                    ))}
                </div>
                <h4 className='sub-title alt'>Custom Fields</h4>
                <div className="fields-list">
                    {fields?.map((field) => (
                        <div key={field.id} className="field">
                            <p className='field-name'>{field.name}{" "}
                                <span className='subtext'>
                                ({fieldTypes?.map((fieldType, index) => 
                                        field.field_id === Number(fieldType.id) ? fieldType.name : null
                                    )})
                                </span>
                            </p>
                            <div className='form-group alt mid' style={{maxWidth: '250px'}}>
                                {(field.field_id === 1 || field.field_id === 2) && <Text type={field.field_id === 2 ? 'textarea' : 'text'} placeholder={field.name} value={fieldOptionsSelected[field.id] || ''} onChange={(e) => handleBooleanChange(field.id, e)}/>}
                                {(field.field_id === 3 || field.field_id === 4 || field.field_id === 5) && <NumberInput type={field.field_id === 3 ? 'currency' : field.field_id === 4 ? 'percent' : 'number'} value={fieldOptionsSelected[field.id] || ''} onChange={(e) => handleBooleanChange(field.id, e)}/>}
                                {field.field_id === 6  && <DateInput value={fieldOptionsSelected[field.id] || ''} onChange={(e) => handleBooleanChange(field.id, e)}/>}
                                {field.field_id === 8 && <Contact  value={fieldOptionsSelected[field.id] || ''} setSelectedContact={(e) => handleBooleanChange(field.id, e)} onCreateNewContact={() => null}/>}
                                {field.field_id === 10 && <Dropdown options={field.options} placeholder={field.name} value={fieldOptionsSelected[field.id] || ""} onChange={(e) => handleBooleanChange(field.id, e)}/>}
                                {field.field_id === 12 && <Boolean options={field.options} value={fieldOptionsSelected[field.id] || "Unknown"} onChange={(e) => handleBooleanChange(field.id, e)} />}
                            </div>
                            <div className='field-info'>
                                <p className='subtext'>
                                    {field.display_when ? `(Display when ${
                                        fields.find(f => 
                                            f.id === field.display_when && f.case_type_id === field.case_type_id
                                        ).name
                                        } is ${field.is_answered !== "" && fields.find(f => 
                                            f.id === field.display_when && f.case_type_id === field.case_type_id
                                        ).options[parseFloat(field.is_answered)] || "Anything"})` : null
                                    }
                                </p>
                                <p className="subtext">
                                    {caseTypes.map((caseTypes, index) =>
                                        field.case_type_id === caseTypes.id ? caseTypes.name : null
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {createNew === 'field' ? (
                    <Modal
                        onClose={() => setCreateNew(false)}
                        submit={handleFieldSubmit}
                    >
                        <div className='new-template'>
                            <h4>Create New Field</h4>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newField.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="field_id">Type</label>
                                <select
                                    name="field_id"
                                    value={newField.field_id}
                                    onChange={handleInputChange}
                                    className='default-select'
                                >
                                    <option value="">Select Type</option>
                                    {fieldTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            {fieldTypeNeedsOptions(selectedFieldType) && (
                                <div className="form-group" style={{alignItems: "center"}}>
                                    <label>Options (Dropdown Choices)</label>
                                    {newField.options.map((option, index) => (
                                        <div key={index} className="option-input">
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                            />
                                            <button type="button" className='form-box alt' onClick={() => handleRemoveOption(index)}>-</button>
                                        </div>
                                    ))}
                                    <button type="button" className='form-box alt' onClick={handleAddOption}>+</button>
                                </div>
                            )}
                            {isBooleanType(selectedFieldType) && (
                                <div className="form-group list">
                                    <label>Options (Yes/No/Unknown - Auto-filled)</label>
                                    <ul>
                                        <li>Yes</li>
                                        <li>No</li>
                                        <li>Unknown</li>
                                    </ul>
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor='case_type_id' className='info-label'>
                                    Case Type
                                    <Info
                                        size={16} 
                                        className='info-icon'
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={() => setShowTooltip(false)}
                                    />
                                </label>
                                <select
                                    name='case_type_id'
                                    value={newField.case_type_id}
                                    onChange={handleInputChange}
                                    className='default-select'
                                >
                                    <option value="">Select Case Type</option>
                                    {caseTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='advanced-options' onClick={() => setAdvancedOpen(prev => !prev)}>Advanced Options {advancedOpen ? <ChevronUp /> : <ChevronDown />}</div>
                            {advancedOpen && (
                                <div className='advanced-options-list'>
                                    <div className="form-group alt">
                                        <label htmlFor="required">Required</label>
                                        <input 
                                            type="checkbox" 
                                            name="required"
                                            checked={newField.required === 2}
                                            onChange={(e) => setNewField({...newField, required: e.target.checked ? 2 : 1})}
                                        />
                                        <div 
                                            className='checkbox'
                                            onClick={() => setNewField({...newField, required: newField.required === 2 ? 1 : 2})}
                                        >
                                            {newField.required === 2 ? '✓' : ''}
                                        </div>
                                    </div>
                                    <div className="form-group alt">
                                        <label htmlFor="obsolete">Obsolete</label>
                                        <input 
                                            type="checkbox" 
                                            name="obsolete"
                                            checked={newField.obsolete === 2}
                                            onChange={(e) => setNewField({...newField, obsolete: e.target.checked ? 2 : 1})}
                                        />
                                        <div 
                                            className='checkbox'
                                            onClick={() => setNewField({...newField, obsolete: newField.obsolete === 2 ? 1 : 2})}
                                        >
                                            {newField.obsolete === 2 ? '✓' : ''}
                                        </div>
                                    </div>
                                    <div className="form-group alt">
                                        <label htmlFor="hidden">Hidden</label>
                                        <input 
                                            type="checkbox" 
                                            name="hidden"
                                            checked={newField.hidden === 2}
                                            onChange={(e) => setNewField({...newField, hidden: e.target.checked ? 2 : 1})}
                                        />
                                        <div 
                                            className='checkbox'
                                            onClick={() => setNewField({...newField, hidden: newField.hidden === 2 ? 1 : 2})}
                                        >
                                            {newField.hidden === 2 ? '✓' : ''}
                                        </div>
                                    </div>
                                    <div className="form-group alt">
                                        <label htmlFor="add_item">Add Item</label>
                                        <input 
                                            type="checkbox" 
                                            name="add_item"
                                            checked={newField.add_item === 1}
                                            onChange={(e) => setNewField({...newField, add_item: e.target.checked ? 1 : null})}
                                        />
                                        <div 
                                            className='checkbox'
                                            onClick={() => setNewField({...newField, add_item: newField.add_item === 1 ? null : 1})}
                                        >
                                            {newField.add_item === 1 ? '✓' : ''}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor='default_value'>Default Value</label>
                                        {newField.options.length > 0 ? (
                                            <select
                                                name='default_value'
                                                value={newField.default_value}
                                                onChange={handleInputChange}
                                                className='default-select'
                                            >
                                                <option value=''>Select Default Value</option>
                                                {newField.options.map((option, index) => (
                                                    <option key={index} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type='text'
                                                name='default_value'
                                                placeholder='Default value...'
                                                value={newField.default_value}
                                                onChange={handleInputChange}
                                            />
                                        )}
                                    </div>
                                    <div className='form-group'>
                                        <label htmlFor='description'>Display This Field When</label>
                                        <select
                                            name="display_when"
                                            value={newField.display_when || ""}
                                            onChange={handleInputChange}
                                            className="default-select"
                                        >
                                            <option value="" disabled>Select Field</option>
                                            {filteredFields.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name.length > 50 ? `${f.name.slice(0, 50)}...` : f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className='form-group'>
                                        <label
                                            htmlFor='is_answered'
                                            onClick={() => setNewField(prev => ({
                                                ...prev,
                                                is_answered_negated: !prev.is_answered_negated
                                            }))}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {newField.is_answered_negated ? "Is Not Answered As" : "Is Answered As"}
                                        </label>
                                        <select
                                            name="is_answered"
                                            multiple
                                            value={
                                                Array.isArray(newField.is_answered)
                                                    ? newField.is_answered.map(v => String(v).replace(/^!/, ''))
                                                    : [newField.is_answered].filter(Boolean).map(v => String(v).replace(/^!/, ''))
                                            }
                                            onChange={(e) => {
                                                const selectedOptions = Array.from(e.target.selectedOptions, (opt) => {
                                                    return newField.is_answered_negated ? `!${opt.value}` : opt.value;
                                                });
                                                handleInputChange({
                                                    target: {
                                                        name: "is_answered",
                                                        value: selectedOptions
                                                    }
                                                });
                                            }}
                                            className="default-select"
                                            style={{ height: "auto", minHeight: "40px" }}
                                        >
                                            {displayFieldOptions.map((option, index) => (
                                                <option key={index} value={String(index)}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor='section_id'>Section ID</label>
                                        <input
                                            type="number"
                                            name="section_id"
                                            value={newField.section_id}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor='template_id'>Template ID</label>
                                        <input
                                            type="number"
                                            name="template_id"
                                            value={newField.template_id}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}
                            <button className='action' onClick={() => {handleFieldSubmit(); setCreateNew(null);}}>Create</button>
                        </div>
                    </Modal>
                ) : createNew === 'case type' && (
                    <Modal onClose={() => setCreateNew(null)}>
                        <div className='new-template'>
                            <h4>Create New Case Type</h4>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newField.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='description'>Description</label>
                                <textarea
                                    name='description'
                                    value={newField.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <button className='action' onClick={() => {createCaseType(); setCreateNew(null);}}>Create</button>
                        </div>
                    </Modal>
                )}
            </div>
            {showTooltip && (
                <div className="tooltip" style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}>
                    Select a case type to limit the field to only cases of that type. Leave as "Select Case Type" to show field in all cases.
                </div>
            )}
        </>
    );
}