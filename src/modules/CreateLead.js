import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import '../styles/Leads.css';
import { Text, NumberInput, DateInput, Dropdown, Boolean } from "./FieldComponents";
import { useMemo } from "react";
import { Star } from "lucide-react";
import { StarOutlineSharp, StarRate, StarRateOutlined, StarRateSharp, StarSharp, TheaterComedyTwoTone } from "@mui/icons-material";

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
        assigned_to: user.user_id,
        status: '',
        notes: '',
        custom_fields: {}
    });
    const [filteredFields, setFilteredFields] = useState([]);
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [displayHeaders, setDisplayHeaders] = useState({
        assigned_to: true,
        created_at: true,
        case_type: true,
        marketing_source: true,
        case_likelihood: true,
        office: true
    });
    const caseLikelihood = ["No Case", "Unlikely Case", "Possible Case", "Likely Case", "Very Likely Case"];

    const getDaysSinceCreation = (createdAt) => {
        if (!createdAt) return "N/A";
    
        const createdDate = new Date(createdAt);
        const currentDate = new Date();
        const timeDiff = currentDate - createdDate;
        const daysSince = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
        switch (daysSince) {
            case 0:
                return "<1 day ago";
            case 1:
                return "1 day ago";
            default:
                break;
        }
        return `${daysSince} days ago`;
    };    

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("new") === "true") {
            setCreateLead(true);
        }
    }, []);

    useEffect(() => {
        const updateDisplayHeaders = () => {
            const width = window.innerWidth;

            setDisplayHeaders({
                name: true,
                status: true,
                office: width > 1350,
                case_likelihood: width > 1150,
                marketing_source: width > 1026,
                assigned_to: width > 768,
                created_at: width > 600,
                case_type: width > 500
            });
        };

        window.addEventListener("resize", updateDisplayHeaders);
        updateDisplayHeaders();

        return () => window.removeEventListener("resize", updateDisplayHeaders);
    }, []);

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
        fetchLeads();
        fetchCaseTypes();
        fetchMarketingSources();
        fetchUsers();
        fetchStatuses();
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

    const fetchUsers = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/user.php?users=true&time=${new Date().getTime()}`);
            const data = await response.json();
            setUsers(data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/statuses.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setStatuses(data.statuses);
        } catch (error) {
            console.error("Error fetching statuses:", error);
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
            custom_fields: {
                ...prev.custom_fields,
                [fieldId]: value,
            },
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
        const customFields = { ...formData.custom_fields };
    
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
            } else {
                console.error("Error creating lead:", data.message);
            }
        } catch (error) {
            console.error("Error creating lead:", error);
        }
    };

    return (
        <div className='page-container'>
            <div id='page-header'>
                <h1>Leads</h1>
                <button className='action' onClick={() => setCreateLead(true)}>Create Lead</button>
            </div>
            <table className='leads-table'>
                <thead>
                    <tr>
                        <th>Name</th>
                        {displayHeaders.assigned_to && <th>Assigned To</th>}
                        <th>Status</th>
                        {displayHeaders.created_at && <th>Days Since Creation</th>}
                        {displayHeaders.case_type && <th>Case Type</th>}
                        {displayHeaders.marketing_source && <th>Marketing Source</th>}
                        {displayHeaders.case_likelihood && <th>Likelihood</th>}
                        {displayHeaders.office && <th>Office</th>}
                    </tr>
                </thead>
                <tbody>
                    {leads.length > 0 ? (
                        leads.map((lead, index) => (
                            <tr key={lead.id} className='lead'>
                                <td className='stacked'>
                                    {lead.contact_name}{" "}
                                    {displayHeaders.case_type && (
                                        <span className='subtext'>
                                            {lead?.preferred_contact != null && Object.values(lead.detail_data).length > 0
                                                ? `(${lead.preferred_contact === "email"
                                                    ? lead.detail_data?.email?.email
                                                    : lead.preferred_contact === "phone"
                                                        ? lead.detail_data?.phone?.number
                                                        : ""})`
                                                : ""}
                                        </span>
                                    )}
                                </td>
                                {displayHeaders.assigned_to && <td>{lead.assigned_to}</td>}
                                <td>{lead.status_name}</td>
                                {displayHeaders.created_at && (
                                    <td title={lead.created_at}>{getDaysSinceCreation(lead.created_at)}</td>
                                )}
                                {displayHeaders.case_type && <td>{lead.case_type_name}</td>}
                                {displayHeaders.marketing_source && (
                                    <td className='stacked'>
                                        {lead.marketing_source_name}
                                        {lead.referral_contact && (
                                            <span className='subtext'>({lead.referral_contact})</span>
                                        )}
                                    </td>
                                )}
                                {displayHeaders.case_likelihood && (
                                    <td title={`${lead.case_likelihood} - ${caseLikelihood[lead.case_likelihood - 1]}`}>
                                        {Array.from({ length: lead.case_likelihood }, (_, index) => (
                                            <StarSharp key={index} className="star-icon" />
                                        ))}
                                        {Array.from({ length: 5 - lead.case_likelihood }, (_, index) => (
                                            <StarOutlineSharp key={index} className="star-icon empty" />
                                        ))}
                                    </td>
                                )}
                                {displayHeaders.office && <td>{lead.office_name}</td>}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="no-data">No leads found</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {createLead && (
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
                                <textarea id='marketing_notes' placeholder='Marketing Notes...' value={formData.marketing_notes} onChange={(e) => setFormData({ ...formData, marketing_notes: e.target.value })}></textarea>
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
                                                    value={formData.custom_fields[field.id] || ""}
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
                                                    value={formData.custom_fields[field.id] || ""}
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
                                                    value={formData.custom_fields[field.id] || ""}
                                                    onChange={(value) => handleFieldChange(field.id, value)}
                                                />
                                            </div>
                                        );
                                    case 6:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <DateInput
                                                    value={formData.custom_fields[field.id] || ""}
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
                                                    options={field.options || "[]"}
                                                    value={formData.custom_fields[field.id] || ""}
                                                    onChange={(value) => handleFieldChange(field.id, value)}
                                                />
                                            </div>
                                        );
                                    case 12:
                                        return (
                                            <div className='form-group' key={field.id}>
                                                <label>{field.name}</label>
                                                <Boolean
                                                    options={field.options}
                                                    value={formData.custom_fields[field.id] || "Unknown"}
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
                                <label htmlFor='office'>Office</label>
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
            )}

            {createContact && <CreateContact setCreateContact={setCreateContact} onContactCreated={handleNewContactCreated} />}
        </div>
    );
};