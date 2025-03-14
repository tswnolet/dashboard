import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";

export const CreateCase = ({ setCreateCase }) => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [caseData, setCaseData] = useState({
        caseName: "",
        contact: null,
        template: ""
    });
    const [caseTemplates, setCaseTemplates] = useState([]);
    const [createContact, setCreateContact] = useState(false);

    useEffect(() => {
        console.log("Case data:", caseData);
    }, [caseData]);

    useEffect(() => {
        setCaseData((prevData) => ({
            ...prevData,
            contact: selectedContact
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
            console.log(data.templates);

        } catch (error) {
            console.error("Error fetching case templates:", error);
        }
    };

    useEffect(() => {
        fetchCaseTemplates();
    }, []);

    const handleCreateCase = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/create_case.php", {
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
            console.log("Case created:", data);

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
                        <label>Case Name</label>
                        <input
                            type="text"
                            placeholder="Case Name"
                            value={caseData.caseName}
                            onChange={(e) => handleFieldChange("caseName", e.target.value)}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Add Contact</label>
                        <Contact 
                            selectedContact={selectedContact}
                            setSelectedContact={setSelectedContact}
                            onCreateNewContact={() => setCreateContact(true)}
                        />
                    </div>
                    <div className='form-group'>
                        <label>Case Template</label>
                        <select
                            className='default-select'
                            value={caseData.template || caseTemplates[0]?.name}
                            onChange={(e) => handleFieldChange("template", e.target.value)}
                        >
                            <option value="" disabled>Select a Template</option>
                            {caseTemplates.map((template, index) => (
                                <option key={index} value={template.name}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
            {createContact && <CreateContact setCreateContact={setCreateContact} onContactCreated={handleNewContactCreated} />}
        </>
    );
};