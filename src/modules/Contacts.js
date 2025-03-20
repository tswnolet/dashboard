import React, { useState, useEffect } from "react";
import { CreateContact } from "./CreateContact";
import { EditDetail } from "./EditDetail"; // Import EditDetail
import "../styles/Contacts.css";

export const Contacts = () => {
    const [createContact, setCreateContact] = useState(false);
    const [editContact, setEditContact] = useState(false); // State to handle edit modal
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null); // Store the contact being edited
    const [renderMobile, setRenderMobile] = useState(false);
    const url = new URLSearchParams(window.location.search);
    
    useEffect(() => {
        if (url.get("new") === "true") {
            setCreateContact(true);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [createContact, editContact]); // Re-fetch when a contact is created or edited

    useEffect(() => {
        function handleResize() {
            setRenderMobile(window.innerWidth < 768);
        }

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setContacts(data.contacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    const handleClick = (contact) => {
        setSelectedContact(contact); // Store selected contact for editing
        setEditContact(true); // Open the edit modal
    };

    return (
        <>
            {!createContact && !editContact ? (
                <div className="page-container">
                    <div id="page-header">
                        <h1>Contacts</h1>
                        <button className="action" onClick={() => setCreateContact(true)}>Create Contact</button>
                    </div>
                    <table className="contacts-table">
                        <thead>
                            <tr>
                                <th className="contact-picture td">*</th>
                                <th>Name</th>
                                {!renderMobile && (
                                    <>
                                        <th style={{ width: "150%" }}>Address</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <tr key={contact.id} className="contact" onClick={() => handleClick(contact)}>
                                    <td className="contact-picture td">
                                        {contact.profile_picture ? (
                                            <img className="contact-picture-listed" src={`https://dalyblackdata.com/api/${contact.profile_picture}`} alt="Profile" />
                                        ) : (
                                            <div className="contact-initials">
                                                <span>
                                                    {contact?.first_name ? contact.first_name[0] : contact.company_name?.[0] || "F"}
                                                    {contact?.last_name ? contact.last_name[0] : contact.company_name ? "" : "L"}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {contact.contact_type === "Company" ? contact.company_name : contact.full_name}
                                        {!renderMobile && <span className="tag">#{contact.contact_type}</span>}
                                    </td>
                                    {!renderMobile && (
                                        <>
                                            <td style={{ width: "150%" }}>
                                                {contact.addresses[0]?.line1}
                                                {contact.addresses[0]?.line2 ? `, ${contact.addresses[0]?.line2}` : ""}
                                                {contact.addresses[0]?.city ? `, ${contact.addresses[0]?.city}` : ""}
                                                {contact.addresses[0]?.state ? `, ${contact.addresses[0]?.state}` : ""}
                                                {contact.addresses[0]?.postal_code}
                                            </td>
                                            <td>{contact.phones.length > 0 ? contact.phones[0].number : ""}</td>
                                            <td>{contact.emails.length > 0 ? contact.emails[0].email : ""}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : createContact ? (
                <CreateContact setCreateContact={setCreateContact} fetchContacts={fetchContacts} />
            ) : (
                editContact && selectedContact && (
                    <EditDetail setEditContact={setEditContact} contactData={selectedContact} fetchContacts={fetchContacts} />
                )
            )}
        </>
    );
};