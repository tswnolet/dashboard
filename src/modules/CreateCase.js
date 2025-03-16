import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import { Info } from "lucide-react";

export const CreateCase = ({ setCreateCase }) => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [caseData, setCaseData] = useState({
        case_name: "",
        contact_id: 0,
        lead_id: null,
        template_id: 1
    });
    const [caseTemplates, setCaseTemplates] = useState([]);
    const [createContact, setCreateContact] = useState(false);
    const [leadOrContact, setLeadOrContact] = useState("contact");

    useEffect(() => {
        console.log("Case data:", caseData);
    }, [caseData]);

    useEffect(() => {
        setCaseData((prevData) => ({
            ...prevData,
            contact_id: Number(selectedContact?.contact_id || selectedContact?.id) || null,
            lead_id: selectedContact?.contact_id ? Number(selectedContact.id) : null
        }));
    }, [selectedContact]);

    useEffect(() => {
        
    })

    const handleFieldChange = (field, value) => {
        setCaseData((prevData) => ({
            ...prevData,
            [field]: value
        }));
    };

    const handleNewContactCreated = (contact) => {
        setSelectedContact(contact);
        setCreateContact(false);
        setCreateCase(true);
    };

    const fetchCaseTemplates = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/layout.php");

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setCaseTemplates(data.templates);

        } catch (error) {
            console.error("Error fetching case templates:", error);
        }
    };

    useEffect(() => {
        fetchCaseTemplates();
    }, []);

    const handleCreateCase = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/cases.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(caseData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

        } catch (error) {
            console.error("Error creating case:", error);
        }
    };

    return (
        <>
            <Modal 
                title="Create Case" 
                onClose={() => setCreateCase(false)}
                header={(
                    <div className='modal-header-actions'>
                        <button className='action alt' onClick={() => setCreateCase(false)}>Cancel</button>
                        <button className='action' onClick={() => {
                            handleCreateCase();
                            setCreateCase(false);
                        }}>Save</button>
                    </div>
                )}
            >
                <div className='modal-content-wrapper'>
                    <div className='form-group'>
                        <label htmlFor='case_name'>Case Name<span className='required'>*</span></label>
                        <input
                            id='case_name'
                            name='case_name'
                            type="text"
                            placeholder="Case Name"
                            value={caseData.case_name}
                            onChange={(e) => handleFieldChange("case_name", e.target.value)}
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor={`${leadOrContact === 'contact' ? 'contact' : 'lead'}_id`}>{leadOrContact === 'contact' ? 'Add Contact' : 'Link Lead'}<span className='required'>*</span></label>
                        <div className='sub-group'>
                            <select className='default-select' title='Select "Lead" to use already created case detail data.' value={leadOrContact} onChange={(e) => setLeadOrContact(e.target.value)}>
                                <option value="contact">Contact</option>
                                <option value="lead">Lead</option>
                            </select>
                            <Contact 
                                selectedContact={selectedContact}
                                setSelectedContact={setSelectedContact}
                                onCreateNewContact={() => setCreateContact(true)}
                                lead={leadOrContact === "lead"}
                            />
                        </div>
                    </div>
                    <div className='form-group'>
                        <label>Case Template</label>
                        <select
                            className='default-select'
                            value={caseData.template_id || caseTemplates[0]?.id}
                            onChange={(e) => handleFieldChange("template_id", Number(e.target.value))}
                        >
                            <option value="" disabled>Select a Template</option>
                            {caseTemplates.map((template, index) => (
                                <option key={index} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
            {createContact && <CreateContact setCreateContact={setCreateContact} onContactCreated={handleNewContactCreated} />}
        </>
    );
};