import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Contact } from "./FieldComponents";
import { CreateContact } from "./CreateContact";
import '../styles/Leads.css';

export const Leads = ({ user }) => {
    const [leads, setLeads] = useState([]);
    const [createLead, setCreateLead] = useState(false);
    const [createContact, setCreateContact] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [caseTypes, setCaseTypes] = useState([]);
    const [marketingSources, setMarketingSources] = useState([]);

    useEffect(() => {
        fetchLeads();
        fetchCaseTypes();
        fetchMarketingSources();
    }, []);

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
            return;
        }
    }

    const fetchMarketingSources = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/marketing_sources.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setMarketingSources(data.marketing_sources);
        } catch (error) {
            console.error("Error fetching marketing sources:", error);
            return [];
        }
    }

    return (
        <div className='page-container'>
            {leads?.map((lead) => (
                <div key={lead.id}>
                    <p>{lead.name}</p>
                    <p>{lead.email}</p>
                    <p>{lead.phone}</p>
                </div>
            )) || "No leads found"}

            {createLead && 
                <Modal 
                    title="Create New Lead"
                    wide={true}
                    header={(
                        <div className='modal-header-actions'>
                            <button className='action alt' onClick={() => setCreateLead(false)}>Cancel</button>
                            <button className='action' onClick={() => {
                                fetchLeads();
                                setCreateLead(false);
                            }}>Save</button>
                        </div>
                    )}
                >
                    <div className='modal-content-wrapper'>
                        <div className='sub-title'>
                            <h4>Intake</h4>
                        </div>
                        <div className='intake-details'>
                            <div className='form-group'>
                                <label>Intake By</label>
                                <input type='text' value={user} disabled/>
                            </div>
                            <div className='form-group'>
                                <label>Intake Date</label>
                                <input 
                                    type='date' 
                                    disabled 
                                    value={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                                />
                            </div>
                        </div>
                        <div className='sub-title'>
                            <h4>Intake Details</h4>
                        </div>
                        <div className='lead-setup'>
                            <div className='form-group'>
                                <label>Contact</label>
                                <Contact 
                                    selectedContact={selectedContact}
                                    onCreateNewContact={() => {
                                        setCreateContact(true);
                                    }}
                                />
                            </div>
                            <div className='form-group'>
                                <label>Case Type</label>
                                <select className='default-select'>
                                    {caseTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label>Incident Date</label>
                                <input type='date' />
                            </div>
                        </div>
                        <div className='sub-title'>
                            <h4>Marketing Information</h4>
                        </div>
                        <div className='marketing-info'>
                            <div className='form-group'>
                                <label>Marketing Source</label>
                                <select className='default-select'>
                                    <option value=''>Select...</option>
                                    {marketingSources.map((source) => (
                                        <option key={source.id} value={source.id}>{source.source_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </Modal>
            }

            {createContact && 
                <CreateContact 
                    setCreateContact={setCreateContact} 
                    onContactCreated={handleNewContactCreated}
                />
            }
        </div>
    );
};

export const CreateLead = () => {
    
}