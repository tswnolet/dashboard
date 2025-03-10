import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import '../styles/Leads.css';
import { Text, NumberInput, DateInput, Dropdown, Boolean } from "./FieldComponents";
import { useMemo } from "react";

export const Leads = ({ user }) => {
    const [leads, setLeads] = useState([]);
    const [createLead, setCreateLead] = useState(false);
    const [createContact, setCreateContact] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [referralContact, setReferralContact] = useState(null);
    const [caseTypes, setCaseTypes] = useState([]);
    const [marketingSources, setMarketingSources] = useState([]);
    const [caseFields, setCaseFields] = useState([]);
    const [formData, setFormData] = useState({
        intakeby: user,
        created_at: new Date().toISOString().split('T')[0],
        contact: null,
        preferred_contact: '',
        case_type: '',
        incident_date: '',
        marketing_source: '',
        referral_contact: null,
        marketing_notes: '',
        summary: '',
        case_likelihood: '',
        office: '',
        assigned_to: '',
        status: '',
        notes: ''
    });
    const [filteredFields, setFilteredFields] = useState([]);

    useEffect(() => {
        const updatedFields = caseFields.filter((field) => {
            if (!field.display_when) return true;
    
            const dependentField = caseFields.find(f => f.id === field.display_when);
            if (!dependentField) return true;
    
            const dependentValue = formData[dependentField.id] ?? null;
            const expectedIndex = field.is_answered;
    
            const parsedOptions = (() => {
                try {
                    return Array.isArray(dependentField.options)
                        ? dependentField.options
                        : dependentField.options
                        ? JSON.parse(dependentField.options)
                        : [];
                } catch (error) {
                    console.error("Error parsing options:", dependentField.options, error);
                    return [];
                }
            })();
    
            const selectedIndex = parsedOptions.indexOf(dependentValue);
    
            return (expectedIndex === null && selectedIndex > -1) || Number(selectedIndex) === Number(expectedIndex);
        });
    
        setFilteredFields(updatedFields);
    }, [caseFields, formData]);    

    useEffect(() => {
        fetchLeads();
        fetchCaseTypes();
        fetchMarketingSources();
    }, []);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            contact: selectedContact?.id || null
        }));
    }, [selectedContact]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            referral_contact: referralContact?.id || null
        }));
    }, [referralContact]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("new") === "true") {
            setCreateLead(true);
        }
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/leads.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setLeads(data.leads);
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    const handleNewContactCreated = (contact) => {
        setSelectedContact(contact);
        setCreateContact(false);
        setCreateLead(true);
    };

    const fetchCaseTypes = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/custom_fields.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCaseTypes(data.case_types);
        } catch (error) {
            console.error("Error fetching case types:", error);
        }
    };

    const fetchCaseFields = async (caseTypeId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/case_fields.php?case_type_id=${caseTypeId}`);
            const data = await response.json();
            if (data.success) {
                setCaseFields(data.fields);
            } else {
                setCaseFields([]);
            }
        } catch (error) {
            console.error("Error fetching case fields:", error);
            setCaseFields([]);
        }
    };

    const handleCaseTypeChange = (e) => {
        const caseTypeId = e.target.value;
        setFormData((prev) => ({ ...prev, case_type: caseTypeId }));
        fetchCaseFields(caseTypeId);
    };

    const handleFieldChange = (fieldId, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };    

    useEffect(() => {
        if (formData.case_type) {
            fetchCaseFields(formData.case_type);
        }
    }, [formData.case_type]);

    const fetchMarketingSources = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/marketing_sources.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setMarketingSources(data.marketing_sources);
        } catch (error) {
            console.error("Error fetching marketing sources:", error);
        }
    };

    const handleCreateLead = async () => {
        const customFields = {};
        caseFields.forEach(field => {
            if (formData[field.id] !== undefined) {
                customFields[field.id] = formData[field.id];
            }
        });
    
        const requestData = {
            ...formData,
            custom_fields: customFields,
        };
    
        try {
            const response = await fetch(`https://dalyblackdata.com/api/leads.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });
    
            const data = await response.json();
    
            if (data.success) {
                fetchLeads();
                setCreateLead(false);
            } else {
                console.error("Error creating lead:", data.message);
            }
        } catch (error) {
            console.error("Error creating lead:", error);
        }
    };    

    const filteredCaseFields = useMemo(() => {
        return caseFields.filter((field) => {
            if (!field.display_when) return true;
    
            const dependentField = caseFields.find(f => f.id === field.display_when);
            if (!dependentField) return true;
    
            const dependentValue = formData[dependentField.id] ?? null;
            const expectedValue = field.is_answered;
    
            return expectedValue === null || dependentValue == expectedValue;
        });
    }, [caseFields, formData]);

    return (
        <div className='page-container'>
            {leads?.map((lead) => (
                <div key={lead.id}>
                    <p>{lead.name}</p>
                    <p>{lead.email}</p>
                    <p>{lead.phone}</p>
                </div>
            )) || "No leads found"}

            {createLead && (
                <Modal 
                    title="Create New Lead"
                    header={(
                        <div className='modal-header-actions'>
                            <button className='action alt' onClick={() => setCreateLead(false)}>Cancel</button>
                            <button className='action' onClick={handleCreateLead}>Save</button>
                        </div>
                    )}
                >
                    <div className='modal-content-wrapper'>
                        <div className='sub-title'>
                            <h4>Intake</h4>
                        </div>
                        <div className='intake-details'>
                            <div className='form-group'>
                                <label htmlFor='intake_by'>Intake By</label>
                                <input type='text' id='intakeby' name='intake_by' value={user} disabled />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='created_at'>Intake Date</label>
                                <input type='date' disabled value={formData.created_at} id='created_at' />
                            </div>
                        </div>
                        <div className='sub-title'>
                            <h4>Intake Details</h4>
                        </div>
                        <div className='lead-setup'>
                            <div className='form-group'>
                                <label htmlFor='contact_id'>Contact</label>
                                <Contact 
                                    selectedContact={selectedContact}
                                    setSelectedContact={setSelectedContact}
                                    onCreateNewContact={() => setCreateContact(true)}
                                    name='contact_id'
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='preferred-contact'>Preferred Contact Method</label>
                                <select className='default-select' id='preferred-contact' value={formData.preferred_contact} onChange={(e) => setFormData({ ...formData, preferred_contact: e.target.value })}>
                                    <option value=''>Select...</option>
                                    <option value='email'>Email</option>
                                    <option value='phone'>Phone</option>
                                    <option value='text'>Text</option>
                                </select>
                            </div>
                        </div>
                        <div className='case-specs'>
                            <div className='form-group'>
                                <label htmlFor='case-type-intake'>Case Type</label>
                                <select className='default-select' id='case-type-intake' value={formData.case_type} onChange={(e) => {setFormData({ ...formData, case_type: e.target.value }); handleCaseTypeChange(e);}}>
                                    <option value=''>Select...</option>
                                    {caseTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='incident-date'>Incident Date</label>
                                <input id='incident-date' type='date' value={formData.incident_date} onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })} />
                            </div>
                        </div>
                        <div className='sub-title'>
                            <h4>Marketing Information</h4>
                        </div>
                        <div className='marketing-info'>
                            <div className='form-group'>
                                <label htmlFor='intake-source'>Marketing Source</label>
                                <select id='intake-source' className='default-select' value={formData.marketing_source} onChange={(e) => setFormData({ ...formData, marketing_source: e.target.value })}>
                                    <option value=''>Select...</option>
                                    {marketingSources.map((source) => (
                                        <option key={source.id} value={source.id}>{source.source_name}</option>
                                    ))}
                                </select>
                            </div>
                            {marketingSources.some(source => source.id == formData.marketing_source && source.marketing_type === '3') && (
                                <div className='form-group'>
                                    <label>Referral Source</label>
                                    <Contact 
                                        selectedContact={referralContact}
                                        setSelectedContact={setReferralContact}
                                        onCreateNewContact={() => setCreateContact(true)}
                                    />
                                </div>
                            )}
                            <div className='form-group'>
                                <label htmlFor='marketing_notes'>Marketing Notes</label>
                                <textarea id='marketing_notes' value={formData.marketing_notes} onChange={(e) => setFormData({ ...formData, marketing_notes: e.target.value })}></textarea>
                            </div>
                        </div>
                        <div className='sub-title'>
                            <h4>Case Details</h4>
                        </div>
                        <div className='case-details'>
                            {filteredFields.map((field) => {
                                if (field.hidden === 2) return null;

                                switch (field.field_id) {
                                    case 1:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <Text
                                                    type="text"
                                                    placeholder={field.name}
                                                    value={formData[field.id] || ""}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                />
                                            </div>
                                        );
                                    case 2:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <Text
                                                    type="textarea"
                                                    placeholder={field.name}
                                                    value={formData[field.id] || ""}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                />
                                            </div>
                                        );
                                    case 3:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <NumberInput
                                                    type="currency"
                                                    value={formData[field.id] || ""}
                                                    onChange={(value) => handleFieldChange(field.id, value)}
                                                />
                                            </div>
                                        );
                                    case 6:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <DateInput
                                                    value={formData[field.id] || ""}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                />
                                            </div>
                                        );
                                    case 8:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label htmlFor={field.id}>{field.name}</label>
                                                <Contact
                                                    selectedContact={formData[field.id]}
                                                    setSelectedContact={(contact) => handleFieldChange(field.id, contact)}
                                                    onCreateNewContact={() => setCreateContact(true)}
                                                />
                                            </div>
                                        );
                                    case 10:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <Dropdown
                                                    options={field.options || "[]"}
                                                    value={formData[field.id] || ""}
                                                    onChange={(selectedValue) => handleFieldChange(field.id, selectedValue)}
                                                />
                                            </div>
                                        );
                                    case 12:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <Boolean
                                                    options={field.options}
                                                    value={formData[field.id] || "Unknown"}
                                                    onChange={(value) => handleFieldChange(field.id, value)}
                                                />
                                            </div>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </div>
                </Modal>
            )}

            {createContact && <CreateContact setCreateContact={setCreateContact} onContactCreated={handleNewContactCreated} />}
        </div>
    );
};