import React, { useState, useEffect } from "react";
import { CreateContact } from "./CreateContact";
import '../styles/Contacts.css';
import { Person2Outlined } from "@mui/icons-material";

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
                <table className='contacts-table'>
                    <thead>
                        <tr>
                            <th className="contact-picture td">*</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Email</th>
                            <th>Phone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id} className='contact'>
                                <td className='contact-picture td'>
                                    {contact.profile_picture ? (
                                        <img className='contact-picture-listed' src={`https://dalyblackdata.com/api/${contact.profile_picture}`} alt='Profile' />
                                    ): (
                                        <div className='contact-initials'>
                                            <span>{contact?.first_name && contact?.first_name.length > 0 ? contact.first_name[0] : contact.company_name && contact.company_name.length > 0 ? contact.company_name[0] : "F"}{contact?.last_name && contact?.last_name.length > 0 ? contact.last_name[0] : contact.company_name && contact.company_name.length > 0 ? "" : "L"}</span>
                                        </div>
                                    )}
                                </td>
                                <td>{contact.contact_type === 'Company' ? contact.company_name : contact.full_name}<span className='tag'>#{contact.contact_type}</span></td>
                                <td>{contact.address}</td>
                                <td>{contact.email}</td>
                                <td>{contact.phone}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <CreateContact setCreateContact={setCreateContact} fetchContacts={fetchContacts} />
        )
    );
};