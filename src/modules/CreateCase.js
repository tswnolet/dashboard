import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import { Info } from "lucide-react";
import { CreateLead } from "./CreateLead";

export const CreateCase = ({ user, setCreateCase, fetchCases, caseTemplates }) => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [caseData, setCaseData] = useState({
        case_name: "",
        contact_id: 0,
        lead_id: null,
        template_id: 1
    });
    const [createContact, setCreateContact] = useState(false);
    const [createLead, setCreateLead] = useState(false);
    const [leadOrContact, setLeadOrContact] = useState("contact");

    useEffect(() => {
        setCaseData((prevData) => ({
            ...prevData,
            contact_id: Number(selectedContact?.contact_id || selectedContact?.id) || null,
            lead_id: selectedContact?.contact_id ? Number(selectedContact.id) : null
        }));
    }, [selectedContact]);

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

    const handleCreateCase = async () => {
        try {
            const response = await fetch("https://api.casedb.co/cases.php", {
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
            fetchCases();

        } catch (error) {
            console.error("Error creating case:", error);
        }
    };

    const handleNewLeadCreated = (lead) => {
        setSelectedLead(lead);
        setCreateLead(false);
        setCreateCase(true);
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
                        <label htmlFor='lead_id'>Link or Create Lead<span className='required'>*</span></label>
                        <Contact
                            setSelectedContact={setSelectedContact}
                            selectedContact={selectedContact}
                            onCreateNewLead={() => setCreateLead(true)}
                            lead={true}
                        />
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
            {createLead && <CreateLead setCreateLead={setCreateLead} user={user} />}
        </>
    );
};