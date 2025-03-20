import { Activity, Dot, Loader2 } from "lucide-react";
import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router";
import { Contact } from "./FieldComponents";

const EditableVital = ({ 
    label, 
    value, 
    field, 
    table, 
    caseId, 
    leadId, 
    updateVital, 
    formatDate, 
    options = [], 
    isContact = false 
}) => {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const [loading, setLoading] = useState(false);

    const isDateField = ["incident_date", "mediation_date", "updated_at", "create_date"].includes(field);
    const isDropdown = options.length > 0;

    useEffect(() => {
        if (isDateField && value) {
            setInputValue(value ? new Date(value).toISOString().slice(0, 10) : ""); 
        } else {
            setInputValue(value || "");
        }
    }, [value]);

    const handleSave = async (newValue) => {
        if (isDateField) {
            newValue = new Date(newValue).toISOString().slice(0, 10);
        }

        if (newValue !== value) {
            setLoading(true);
            await updateVital(field, newValue, table);
            setLoading(false);
        }
        setEditing(false);
    };

    return (
        <div className='sidebar-vital' onDoubleClick={() => setEditing(true)}>
            <span className='subtext'>{label}:</span>
            {editing ? (
                isContact ? (
                    <Contact 
                        selectedContact={{ id: inputValue, full_name: value }}
                        setSelectedContact={(contact) => handleSave(contact.id)}
                        onCreateNewContact={() => console.log("Create new contact clicked")} 
                    />
                ) : isDropdown ? (
                    <select
                        className='default-select'
                        value={inputValue}
                        onChange={(e) => handleSave(e.target.value)}
                        onBlur={() => setEditing(false)}
                        autoFocus
                    >
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={isDateField ? "date" : "text"}
                        className='vital-input'
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => handleSave(inputValue)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave(inputValue)}
                        autoFocus
                    />
                )
            ) : (
                <span className='subtext'>
                    {loading ? <Loader2 className="spinner" /> : (isDateField ? formatDate(value)[0] : value)}
                </span>
            )}
        </div>
    );
};

export const CaseSidebar = ({ id, cases, fetchCases, caseTemplates, caseTypes, formatDate }) => {
    const [caseData, setCaseData] = useState(cases.find((c) => c.case_id === id) ?? {});
    const [leadData, setLeadData] = useState(caseData.lead_data ?? {});
    const [leadUpdates, setLeadUpdates] = useState(leadData.lead_updates_data ?? []);

    const navigate = useNavigate();

    const updateVital = async (field, newValue, table) => {
        const payload = {
            case_id: caseData.case_id,
            lead_id: leadData.lead_id,
            field,
            value: newValue,
            table
        };

        try {
            const response = await fetch("https://dalyblackdata.com/api/update-vital.php", {
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
                    ? <img className='contact-initials large' src={`https://dalyblackdata.com/api/${caseData.contact_display}`} alt="Profile" />
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
                <EditableVital 
                    label='Case Type' 
                    value={caseTypes.find((type) => type.id === leadData.case_type_id)?.name}
                    field="case_type_id"
                    table="leads"
                    caseId={caseData.case_id}
                    leadId={leadData.lead_id}
                    updateVital={updateVital}
                    formatDate={formatDate}
                    options={caseTypes} 
                />
                <EditableVital 
                    label={`Type of ${caseTypes.find((type) => type.id === leadData.case_type_id)?.name} Case`}
                    value={leadUpdates.find((data) => data.field_name === `Type of ${caseTypes.find((type) => type.id === leadData.case_type_id)?.name} Case`)?.value}
                    field="type_of_case"
                    table="lead_updates"
                    caseId={caseData.case_id}
                    leadId={leadData.lead_id}
                    updateVital={updateVital}
                    formatDate={formatDate}
                />
                <EditableVital 
                    label='Incident Date' 
                    value={leadData.incident_date}
                    field="incident_date"
                    table="leads"
                    caseId={caseData.case_id}
                    leadId={leadData.lead_id}
                    updateVital={updateVital}
                    formatDate={formatDate}
                />
                <EditableVital
                    label='Primary Attorney'
                    value={caseData?.team?.first_primary ?? ""}
                    field="team.first_primary"
                    table="cases"
                    caseId={caseData.case_id}
                    leadId={leadData.lead_id}
                    updateVital={updateVital}
                />
                <EditableVital 
                    label="Referred To" 
                    value={leadData.referred_to_name}
                    field="referred_to"
                    table="leads"
                    caseId={caseData.case_id}
                    leadId={leadData.lead_id}
                    updateVital={updateVital}
                    isContact={true}
                />
            </div>
        </div>
    );
};