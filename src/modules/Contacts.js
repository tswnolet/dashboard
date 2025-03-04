import React, { useState, useEffect } from "react";
import { CreateContact } from "./CreateContact";

export const Contacts = () => {
    const [createContact, setCreateContact] = useState(false);
    const [contacts, setContacts] = useState([]);
    const url = new URLSearchParams(window.location.search);

    useEffect(() => {
        if(url.get("new") === "true") {
            setCreateContact(true);
        } else {
            fetchContacts();
        }
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setContacts(data.contacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    }

    return (
        !createContact ? (
            <div className='page-container'>
                <div id='page-header'>
                    <h1>Contacts</h1>
                    <button className='action' onClick={() => setCreateContact(true)}>Create Contact</button>
                </div>
                <div className='contacts-list'>
                    {contacts.map((contact) => (
                        <div key={contact.id} className='contact'>
                            <div className='contact-name'>{contact.full_name}</div>
                            <div className='contact-company'>{contact.company_name}</div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <CreateContact setCreateContact={setCreateContact} fetchContacts={fetchContacts} />
        )
    );
};