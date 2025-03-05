import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Building } from "lucide-react";
import { Person, Person2, PersonOutline, PersonOutlineOutlined, PersonPinCircle } from "@mui/icons-material";

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
    const [profilePicture, setProfilePicture] = useState(null);

    const handleProfilePictureChange = (e) => {
        setProfilePicture(e.target.files[0]);
    }

    const createNewContact = async () => {
        const formData = new FormData();

        Object.keys(contactInformation).forEach((key) => {
            formData.append(key, contactInformation[key]);
        });

        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                fetchContacts();
                setCreateContact(false);
            } else {
                console.error("Error creating contact:", response.statusText);
            }
        } catch (error) {
            console.error("Error creating contact:", error);
        }
    }

    return (
        <Modal
            onClose={() => setCreateContact(false)}
            title="Create New Contact"
            wide={true}
            header={(
                <div className='modal-header-actions'>
                    <button className='action alt' onClick={() => setCreateContact(false)}>Cancel</button>
                    <button className='action' onClick={() => {
                        createNewContact();
                        setCreateContact(false);
                    }}>Save</button>
                </div>
            )}
        >
            <div className='modal-content-wrapper'>
                <div className='sub-title'>
                    <h4>Basic Information</h4>
                    <div className='person-or-company'>
                        <div
                            className={`poc person${!contactInformation.is_company ? ' active' : ''}`}
                            onClick={() => setContactInformation({ ...contactInformation, is_company: false })}
                            title='Is the contact a person?'
                        >
                            <Person />
                        </div>
                        <div
                            className={`poc company${contactInformation.is_company ? ' active' : ''}`}
                            onClick={() => setContactInformation({ ...contactInformation, is_company: true })}
                            title='Is the contact a company?'
                        >
                            <Building />
                        </div>
                    </div>
                </div>
                <form>
                <div className="contact-picture" onClick={() => document.getElementById('profilePictureInput').click()}>
                    {profilePicture ? (
                        <img className='contact-picture-listed' src={URL.createObjectURL(profilePicture)} alt="Contact" />
                    ) : (
                        <Person />
                    )}
                    <input
                        type="file"
                        id="profilePictureInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfilePictureChange}
                    />
                </div>
                    <div className='contact-name-container'>
                        {!contactInformation.is_company ? (
                            <>
                                <div className="form-group fname">
                                    <label htmlFor="first_name">First Name</label>
                                    <input type="text" id="first_name" autoFocus value={contactInformation.first_name} onChange={(e) => setContactInformation({ ...contactInformation, first_name: e.target.value })} />
                                </div>
                                <div className="form-group mname">
                                    <label htmlFor="middle_name">Middle Name</label>
                                    <input type="text" id="middle_name" value={contactInformation.middle_name} onChange={(e) => setContactInformation({ ...contactInformation, middle_name: e.target.value })} />
                                </div>
                                <div className="form-group lname">
                                    <label htmlFor="last_name">Last Name</label>
                                    <input type="text" id="last_name" value={contactInformation.last_name} onChange={(e) => setContactInformation({ ...contactInformation, last_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nickname">Nickname</label>
                                    <input type="text" id="nickname" value={contactInformation.nickname} onChange={(e) => setContactInformation({ ...contactInformation, nickname: e.target.value })} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group cname">
                                    <label htmlFor="company_name">Company Name</label>
                                    <input type="text" id="company_name" value={contactInformation.company_name} onChange={(e) => setContactInformation({ ...contactInformation, company_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nickname">Nickname</label>
                                    <input type="text" id="nickname" value={contactInformation.nickname} onChange={(e) => setContactInformation({ ...contactInformation, nickname: e.target.value })} />
                                </div>
                            </>
                        )}
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
                        <label htmlFor="date_of_birth">{!contactInformation.is_company ? "Date of Birth" : "Creation Date"}</label>
                        <input type="date" id="date_of_birth" value={contactInformation.date_of_birth} onChange={(e) => setContactInformation({ ...contactInformation, date_of_birth: e.target.value })} />
                    </div>
                    {!contactInformation.is_company && (
                        <div className="form-group">
                            <label htmlFor="date_of_death">Date of Death</label>
                            <input type="date" id="date_of_death" value={contactInformation.date_of_death} onChange={(e) => setContactInformation({ ...contactInformation, date_of_death: e.target.value })} />
                        </div>
                    )}
                </form>
            </div>
        </Modal>
    )
}