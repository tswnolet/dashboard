import { Activity, Dot, Loader2 } from "lucide-react";
import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router";
import {
    Contact,
    ContactList,
    Text,
    NumberInput,
    DateInput,
    TimeInput,
    Dropdown,
    MultiSelect,
    Boolean,
    Subheader,
    Instructions,
    FileUpload,
    MultiFile,
    Calculation,
    DocGen,
    Deadline,
    SearchSelect
} from "./FieldComponents";

const EditableVital = ({
    label,
    value,
    field,
    table,
    updateVital,
    formatDate,
    options = [],
    isContact = false,
    typeId,
    allFields = [],
    fieldUpdates = [],
    lead_id = null,
    sectionName = ''
}) => {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const [loading, setLoading] = useState(false);

    console.log(value, inputValue);

    useEffect(() => {
        setInputValue(value || "");
    }, [value]);

    const handleFieldChange = async (fieldId, newVal) => {
        await handleSave(newVal);
    };

    const handleSave = async (newValue) => {
        if (newValue !== value) {
            setLoading(true);
            await updateVital(field, newValue, table);
            setLoading(false);
        }
        setEditing(false);
    };

    const renderInputByType = () => {
        switch (typeId) {
            case 1:
                return <Text type="text" placeholder={label} value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 2:
                return <Text type="textarea" placeholder={label} value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 3:
                return <NumberInput type="currency" value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 4:
                return <NumberInput type="percent" value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 5:
                return <NumberInput type="number" value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 6:
                return <DateInput value={String(inputValue)} onChange={(val) => handleFieldChange(field, val)} />;
            case 7:
                return <TimeInput value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 8:
                return <Contact selectedContact={inputValue} setSelectedContact={(contact) => handleFieldChange(field, contact?.id || null)} />;
            case 9:
                return <ContactList value={Array.isArray(inputValue) ? inputValue : []} onChange={(ids) => handleFieldChange(field, ids)} />;
            case 10:
                return <Dropdown options={options || "[]"} value={inputValue} onChange={(index) => handleFieldChange(field, index)} />;
            case 11:
                return <MultiSelect options={options || "[]"} value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 12:
                return <Boolean options={options || []} value={inputValue != undefined ? Number(inputValue) : 2} onChange={(selectedValue) => handleFieldChange(field, selectedValue)} />;
            case 13:
                return <Subheader title={label} />;
            case 14:
                return <Instructions instructions={label} />;
            case 15:
                return <FileUpload value={inputValue} onChange={(val) => handleFieldChange(field, val)} lead_id={lead_id} section_name={sectionName} />;
            case 16:
                return <MultiFile value={inputValue} lead_id={lead_id} sectionName={sectionName} onChange={(val) => handleFieldChange(field, val)} />;
            case 17:
                return <Calculation options={options} fieldId={field} lead_id={lead_id} fields={allFields} fieldUpdates={fieldUpdates} onChange={handleSave} />;
            case 18:
                return <DocGen value={inputValue} onChange={(val) => handleFieldChange(field, val)} />;
            case 20:
                const parsedValue = typeof inputValue === 'string' ? JSON.parse(inputValue || '{}') : inputValue || {};
                return <Deadline value={{ due: parsedValue.due || '', done: parsedValue.done || '' }} title={label} onChange={(updated) => handleFieldChange(field, { ...parsedValue, ...updated })} />;
            case 22:
                return <SearchSelect value={inputValue} onChange={(val) => handleFieldChange(field, val)} options={options} />;
            default:
                return (
                    <input
                        type="text"
                        className='vital-input'
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => handleSave(inputValue)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave(inputValue)}
                        autoFocus
                    />
                );
        }
    };

    return (
        <div className='sidebar-vital' onDoubleClick={() => setEditing(true)}>
            <span className='subtext'>{label}:</span>
            {editing ? (
                loading 
                    ? <Loader2 className="spinner" /> 
                    : (
                        <div className='form-group'>
                            {renderInputByType()}
                        </div>
                    )
            ) : (
                <span className='subtext'>
                    {loading ? <Loader2 className="spinner" /> : (typeof value === 'string' && value.includes("T") ? formatDate(value)[0] : value)}
                </span>
            )}
        </div>
    );
};

export const CaseSidebar = ({ id, cases, fetchCases, caseTemplates, caseTypes, formatDate }) => {
    const [caseData, setCaseData] = useState(cases.find((c) => c.case_id === id) ?? {});
    const [leadData, setLeadData] = useState(caseData.lead_data ?? {});
    const [leadUpdates, setLeadUpdates] = useState(leadData.lead_updates_data ?? []);
    const [vitals, setVitals] = useState([]);

    const navigate = useNavigate();

    const fetchVitals = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/sections.php?vitals=true&template_id=${caseData.template_id}&lead_id=${leadData.lead_id}&${new Date().getTime()}`);
            const data = await response.json();
            if (data.success) {
                setVitals(data.vitals || []);
            }
        } catch (error) {
            console.error("Error fetching vitals:", error);
        }
    };

    useEffect(() => {
        if (caseData.template_id && caseData.case_id) {
            fetchVitals();
        }
    }, [caseData.template_id, caseData.case_id]);

    const updateVital = async (field, newValue, table) => {
        const payload = {
            case_id: caseData.case_id,
            lead_id: leadData.lead_id,
            field,
            value: newValue,
            table
        };

        try {
            const response = await fetch("https://api.casedb.co/update-vital.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                if (table === "cases") {
                    setCaseData((prev) => ({ ...prev, [field]: newValue }));
                } else if (table === "leads") {
                    setLeadData((prev) => ({ ...prev, [field]: newValue }));
                } else if (table === "lead_updates") {
                    setLeadUpdates((prev) =>
                        prev.map((item) =>
                            item.field_name === field ? { ...item, value: newValue } : item
                        )
                    );
                }
                fetchCases();
            } else {
                console.error("Update failed:", result.message);
            }
        } catch (error) {
            console.error("Error updating vital:", error);
        }
    };

    return (
        <div className='case-sidebar'>
            <div className='case-sidebar-header' onClick={() => navigate(`/case/${caseData.case_id}`)}>
                {caseData.contact_display && caseData.contact_display.includes('uploads')
                    ? <img className='contact-initials large' src={`https://api.casedb.co/${caseData.contact_display}`} alt="Profile" />
                    : <span className='contact-initials large'>{caseData.contact_display}</span>
                }
                <div className="case-info">
                    <div>{caseData.case_name || "Unknown Case"}</div>
                    <div className='case-id subtext'>ID: {caseData.case_id}</div>
                </div>
            </div>

            <div className='case-sidebar-breakdown subtext'>
                {caseTemplates.find((template) => template.id === caseData.template_id)?.name || "No Template"}
                {caseData.phase_name && (<><Dot size={16} /> {caseData.phase_name}</>)}
                {caseData.team?.first_primary && (<><Dot size={16} /> {caseData.team?.first_primary}</>)}
                {caseData.create_date && (
                    <><Dot size={16} /> Created: {formatDate(caseData.create_date)[0]}</>
                )}
                {caseData.updated_at && (
                    <><Dot size={16} /> Last Activity: {formatDate(caseData.updated_at)[0]} {formatDate(caseData.updated_at)[2]}</>
                )}
            </div>

            <div className="divider horizontal"></div>

            <div className='case-sidebar-vitals'>
                <div className='sidebar-vital-header'><Activity size={16}/>{" "}Vitals</div>
                {vitals.map((vital) => (
                    <EditableVital
                        key={vital.id}
                        label={vital.name}
                        value={vital.value}
                        typeId={vital.custom_field_id}
                        field={vital.field_id}
                        table="custom_fields"
                        updateVital={updateVital}
                        formatDate={formatDate}
                    />
                ))}
            </div>
        </div>
    );
};