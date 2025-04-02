import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import '../styles/Leads.css';
import { Text, NumberInput, DateInput, Dropdown, Boolean } from "./FieldComponents";

export const CreateLead = ({ user, setCreateLead }) => {
    const [createContact, setCreateContact] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [referralContact, setReferralContact] = useState(null);
    const [dbOrigination, setDbOrigination] = useState(null);
    const [caseTypes, setCaseTypes] = useState([]);
    const [marketingSources, setMarketingSources] = useState([]);
    const [caseFields, setCaseFields] = useState([]);
    const [formData, setFormData] = useState({
        intake_by: user?.user_id,
        contact_id: null,
        preferred_contact: '',
        case_type: '',
        incident_date: '',
        marketing_source: '',
        referral_contact: null,
        db_origination: null,
        marketing_notes: '',
        summary: '',
        case_likelihood: '',
        office: '',
        assigned_to: user?.user_id,
        status: '',
        notes: '',
        custom_fields: {}
    });
    const [customFields, setCustomFields] = useState({
        222: `${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, 0)}-${String(new Date().getDate()).padStart(2, 0)}`,
        223: String(new Date().toLocaleTimeString()).slice(0, 8),
        224: formData.intake_by,
        225: formData.marketing_source,
        226: formData.referral_contact,
        227: formData.db_origination
    });
    const [filteredFields, setFilteredFields] = useState([]);
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const saveFields = async (leadId) => {
        const field_values = {};
    
        for (const [fieldId, value] of Object.entries(customFields)) {
            field_values[fieldId] = typeof value === 'object' ? JSON.stringify(value) : value;
        }
    
        try {
            const response = await fetch(`https://api.casedb.co/custom_fields.php`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lead_id: leadId,
                    field_values,
                }),
            });
    
            const result = await response.json();
            if (!result.success) {
                console.error("Error saving custom fields:", result.message);
            }
        } catch (error) {
            console.error("Error posting custom fields:", error);
        }
    };    

    const fetchUsers = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/user.php?users=true&time=${new Date().getTime()}`);
            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchMarketingSources = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/marketing_sources.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setMarketingSources(data.marketing_sources);
        } catch (error) {
            console.error("Error fetching marketing sources:", error);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/statuses.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setStatuses(data.statuses);
        } catch (error) {
            console.error("Error fetching statuses:", error);
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
            custom_fields: {
                ...prev.custom_fields,
                [fieldId]: value,
            },
        }));
    };

    const handleNewContactCreated = (contact) => {
        setSelectedContact(contact);
        setCreateContact(false);
        setCreateLead(true);
    };
    
    useEffect(() => {
        if (formData.case_type) {
            fetchCaseFields(formData.case_type);
        }
    }, [formData.case_type]);

    const handleCreateLead = async () => {
        const customFields = { ...formData.custom_fields };
    
        const requestData = {
            ...formData,
            custom_fields: customFields,
        };
    
        try {
            const response = await fetch(`https://api.casedb.co/leads.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),
            });
    
            const data = await response.json();
    
            if (data.success) {
                setCreateLead(false);
                setFormData({
                    intake_by: user.user_id,
                    contact_id: null,
                    preferred_contact: '',
                    case_type: '',
                    incident_date: '',
                    marketing_source: '',
                    referral_contact: null,
                    marketing_notes: '',
                    summary: '',
                    case_likelihood: '',
                    office: '',
                    assigned_to: 0,
                    status: '',
                    notes: '',
                    custom_fields: {}
                });
                await saveFields(data.lead_id);
            } else {
                console.error("Error creating lead:", data.message);
            }
        } catch (error) {
            console.error("Error creating lead:", error);
        }
    };

    useEffect(() => {
        setCustomFields((prev) => ({
            ...prev,
            225: formData.marketing_source,
            226: formData.referral_contact,
            227: formData.db_origination
        }));
    }, [formData]);

    const fetchCaseTypes = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/custom_fields.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setCaseTypes(data.case_types);
        } catch (error) {
            console.error("Error fetching case types:", error);
        }
    };

    const fetchCaseFields = async (caseTypeId) => {
        try {
            const response = await fetch(`https://api.casedb.co/case_fields.php?case_type_id=${caseTypeId}`);
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

    useEffect(() => {
        const updatedFields = caseFields.filter((field) => {
            if (!field.display_when) return true;
    
            const dependentField = caseFields.find(f => f.id === field.display_when);
            if (!dependentField) return true;
    
            const dependentValue = formData.custom_fields[dependentField.id] ?? null;
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
        fetchCaseTypes();
        fetchMarketingSources();
        fetchStatuses();
        fetchUsers();
    }, []);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            contact_id: selectedContact?.id || null
        }));
    }, [selectedContact]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            referral_contact: referralContact?.id || null
        }));
    }, [referralContact]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            referral_contact: null,
            db_origination: dbOrigination?.id || null
        }));
    }, [dbOrigination]);

    useEffect(() => {
        setFormData({
            ...formData,
            custom_fields: {}
        });
    }, [formData.case_type]);

    return (
        <>
            <Modal 
            onClose={() => setCreateLead(false)}
                title="Create New Lead"
                header={(
                    <div className='modal-header-actions'>
                        <button className='action alt' onClick={() => setCreateLead(false)}>Cancel</button>
                        <button className='action' onClick={handleCreateLead}>Save</button>
                    </div>
                )}
                wide
            >
                <div className='modal-content-wrapper'>
                    <div className='sub-title'>
                        <h4>Intake</h4>
                    </div>
                    <div className='intake-details'>
                        <div className='form-group'>
                            <label htmlFor='intake_by'>Intake By</label>
                            <input type='text' id='intake_by' name='intake_by' value={user.user} disabled />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='created_at'>Intake Date</label>
                            <input type='date' disabled value={new Date().toISOString().split('T')[0]} id='created_at' />
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
                                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
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
                            <label htmlFor='case-type-intake'>Case Type<span className="required">*</span></label>
                            <select className='default-select' required id='case-type-intake' value={formData.case_type} onChange={(e) => {setFormData({ ...formData, case_type: e.target.value }); handleCaseTypeChange(e);}}>
                                <option value=''>Select...</option>
                                {caseTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='form-group'>
                            <label htmlFor='incident-date'>Incident Date<span className="required">*</span></label>
                            <input id='incident-date' type='date' value={formData.incident_date} onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })} />
                        </div>
                    </div>
                    <div className='sub-title'>
                        <h4>Marketing Information</h4>
                    </div>
                    <div className='marketing-info'>
                        <div className='form-group'>
                            <label htmlFor='intake-source'>Marketing Source<span className="required">*</span></label>
                            <select id='intake-source' className='default-select' value={formData.marketing_source} onChange={(e) => setFormData({ ...formData, marketing_source: e.target.value })}>
                                <option value=''>Select...</option>
                                {marketingSources.map((source) => (
                                    <option key={source.id} value={source.id}>{source.source_name}</option>
                                ))}
                            </select>
                        </div>
                        {marketingSources.some(source => source.id == formData.marketing_source && source.marketing_type === '3' && formData.marketing_source != '12') && (
                            <div className='form-group'>
                                <label>Referral Source</label>
                                <Contact 
                                    selectedContact={referralContact}
                                    setSelectedContact={setReferralContact}
                                    onCreateNewContact={() => setCreateContact(true)}
                                />
                            </div>
                        )}
                        {formData.marketing_source === '12' && (
                            <div className='form-group'>
                                <label>DB Origination</label>
                                <Contact 
                                    selectedContact={dbOrigination}
                                    setSelectedContact={setDbOrigination}
                                    onCreateNewContact={() => setCreateContact(true)}
                                />
                            </div>
                        )}
                        <div className='form-group'>
                            <label htmlFor='marketing_notes'>Marketing Notes</label>
                            <textarea id='marketing_notes' placeholder='Marketing Notes...' value={formData.marketing_notes} onChange={(e) => setFormData({ ...formData, marketing_notes: e.target.value })}></textarea>
                        </div>
                    </div>
                    {formData.case_type != '' && <div className='sub-title'>
                        <h4>Case Details</h4>
                    </div>}
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
                                                value={formData.custom_fields[field.id] ?? ""}
                                                onChange={(value) => handleFieldChange(field.id, value)}
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
                                                value={formData.custom_fields[field.id] ?? ""}
                                                onChange={(value) => handleFieldChange(field.id, value)}
                                            />
                                        </div>
                                    );
                                case 3:
                                    return (
                                        <div className='form-group' key={field.id}>
                                            <label>{field.name}</label>
                                            <NumberInput
                                                type="currency"
                                                value={formData.custom_fields[field.id] ?? ""}
                                                onChange={(value) => handleFieldChange(field.id, value)}
                                            />
                                        </div>
                                    );
                                case 6:
                                    return (
                                        <div className='form-group' key={field.id}>
                                            <label>{field.name}</label>
                                            <DateInput
                                                value={formData.custom_fields[field.id] ?? ""}
                                                onChange={(value) => handleFieldChange(field.id, value)}
                                            />
                                        </div>
                                    );
                                case 8:
                                    return (
                                        <div className='form-group' key={field.id}>
                                            <label htmlFor={field.id}>{field.name}</label>
                                            <Contact
                                                selectedContact={formData.custom_fields[field.id]}
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
                                                options={field.options ?? "[]"}
                                                value={formData.custom_fields[field.id] ?? ""}
                                                onChange={(value) => handleFieldChange(field.id, value)}
                                            />
                                        </div>
                                    );
                                case 12:
                                    return (
                                        <div className='form-group' key={field.id}>
                                            <label>{field.name}</label>
                                            <Boolean
                                                options={field.options ?? []}
                                                value={formData.custom_fields[field.id] ?? 2}
                                                onChange={(value) => handleFieldChange(field.id, value)}
                                            />
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </div>
                    <div className='sub-title'>
                        <h4>Office Details</h4>
                    </div>
                    <div className='office-details'>
                        <div className='form-group'>
                            <label htmlFor='likelihood'>Case Likelihood</label>
                            <select id='likelihood' className='default-select' value={formData.case_likelihood} onChange={(e) => setFormData({ ...formData, case_likelihood: e.target.value })}>
                                <option value='' disabled>Select...</option>
                                <option value='1'>No Case</option>
                                <option value='2'>Unlikely Case</option>
                                <option value='3'>Possible Case</option>
                                <option value='4'>Likely Case</option>
                                <option value='5'>Very Likely Case</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label htmlFor='office'>Office<span className="required">*</span></label>
                            <select id='office' className='default-select' value={formData.office} onChange={(e) => setFormData({ ...formData, office: e.target.value })}>
                                <option value='' disabled>Select...</option>
                                <option value='1'>Texas</option>
                                <option value='2'>Colorado</option>
                                <option value='3'>Louisiana</option>
                                <option value='4'>Florida</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label htmlFor='assigned-to'>Assigned To</label>
                            <select id='assigned-to' className='default-select' value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}>
                                <option value='' disabled>Select...</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className='form-group'>
                            <label htmlFor='status'>Status</label>
                            <select id='status' className='default-select' value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value='' disabled>Select...</option>
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>{status.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>
            {createContact && <CreateContact setCreateContact={setCreateContact} onContactCreated={handleNewContactCreated} />}
        </>
    );
};