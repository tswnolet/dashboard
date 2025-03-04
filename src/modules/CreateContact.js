import React, { useState, useEffect } from "react";
import Modal from "./Modal";

export const CreateContact = ({ setCreateContact, fetchContacts }) => {
    const [contactInformation, setContactInformation] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        full_name: '',
        nickname: '',
        prefix: '',
        suffix: '',
        company_name: '',
        job_title: '',
        department: '',
        date_of_birth: '',
        date_of_death: '',
        is_company: false
    });

    const createNewContact = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactInformation),
            });
            fetchContacts();
        } catch (error) {
            console.error("Error creating contact:", error);
        }
    }

    return (
        <Modal onClose={() => setCreateContact(false)} wide={true}>
                <h2>Create Contact</h2>
                <div className='modal-content-wrapper'>
                    <div className="form-group">
                        <label htmlFor="first_name">First Name</label>
                        <input type="text" id="first_name" autoFocus value={contactInformation.first_name} onChange={(e) => setContactInformation({ ...contactInformation, first_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="middle_name">Middle Name</label>
                        <input type="text" id="middle_name" value={contactInformation.middle_name} onChange={(e) => setContactInformation({ ...contactInformation, middle_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">Last Name</label>
                        <input type="text" id="last_name" value={contactInformation.last_name} onChange={(e) => setContactInformation({ ...contactInformation, last_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nickname">Nickname</label>
                        <input type="text" id="nickname" value={contactInformation.nickname} onChange={(e) => setContactInformation({ ...contactInformation, nickname: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prefix">Prefix</label>
                        <input type="text" id="prefix" value={contactInformation.prefix} onChange={(e) => setContactInformation({ ...contactInformation, prefix: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="suffix">Suffix</label>
                        <input type="text" id="suffix" value={contactInformation.suffix} onChange={(e) => setContactInformation({ ...contactInformation, suffix: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="company_name">Company Name</label>
                        <input type="text" id="company_name" value={contactInformation.company_name} onChange={(e) => setContactInformation({ ...contactInformation, company_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="job_title">Job Title</label>
                        <input type="text" id="job_title" value={contactInformation.job_title} onChange={(e
                        ) => setContactInformation({ ...contactInformation, job_title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <input type="text" id="department" value={contactInformation.department} onChange={(e) => setContactInformation({ ...contactInformation, department: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date_of_birth">Date of Birth</label>
                        <input type="date" id="date_of_birth" value={contactInformation.date_of_birth} onChange={(e) => setContactInformation({ ...contactInformation, date_of_birth: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date_of_death">Date of Death</label>
                        <input type="date" id="date_of_death" value={contactInformation.date_of_death} onChange={(e) => setContactInformation({ ...contactInformation, date_of_death: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="is_company">Is Company?</label>
                        <input type="checkbox" id="is_company" value={contactInformation.is_company} onChange={(e) => setContactInformation({ ...contactInformation, is_company: e.target.checked })} />
                    </div>
                    <button onClick={() => {createNewContact(); setCreateContact(false)}} className='action'>Create Contact</button>
                </div>
        </Modal>
    )
}