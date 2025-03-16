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
    
    const [phones, setPhones] = useState([{ type: "mobile", number: "" }]);
    const [emails, setEmails] = useState([{ type: "personal", email: "" }]);
    const [addresses, setAddresses] = useState([{
        type: "home",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: ""
    }]);
    
    const addPhone = () => setPhones([...phones, { type: "mobile", number: "" }]);
    const addEmail = () => setEmails([...emails, { type: "personal", email: "" }]);
    const addAddress = () => setAddresses([...addresses, {
        type: "home", line1: "", line2: "", city: "", state: "", postal_code: ""
    }]);
    
    const handleProfilePictureChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };
    
    const createNewContact = async () => {
        const formData = new FormData();
    
        Object.keys(contactInformation).forEach(key => {
            formData.append(key, contactInformation[key]);
        });
    
        formData.set('is_company', contactInformation.is_company ? 'true' : 'false');
    
        formData.append('phones', JSON.stringify(phones));
        formData.append('emails', JSON.stringify(emails));
        formData.append('addresses', JSON.stringify(addresses));
    
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }
    
        try {
            const response = await fetch(`https://dalyblackdata.com/api/contacts.php`, {
                method: "POST",
                body: formData
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
    };    

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
                <form>
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
                    <div className="contact-picture form-box" onClick={() => document.getElementById('profilePictureInput').click()}>
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
                                    <label htmlFor="first_name">First Name<span className='required'>*</span></label>
                                    <input type="text" id="first_name" autoFocus value={contactInformation.first_name} onChange={(e) => setContactInformation({ ...contactInformation, first_name: e.target.value })} />
                                </div>
                                <div className="form-group mname">
                                    <label htmlFor="middle_name">Middle Name</label>
                                    <input type="text" id="middle_name" value={contactInformation.middle_name} onChange={(e) => setContactInformation({ ...contactInformation, middle_name: e.target.value })} />
                                </div>
                                <div className="form-group lname">
                                    <label htmlFor="last_name">Last Name<span className='required'>*</span></label>
                                    <input type="text" id="last_name" value={contactInformation.last_name} onChange={(e) => setContactInformation({ ...contactInformation, last_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nickname">Nickname</label>
                                    <input type="text" id="nickname" value={contactInformation.nickname} onChange={(e) => setContactInformation({ ...contactInformation, nickname: e.target.value })} />
                                </div>
                                <div className="form-group prefix">
                                    <label htmlFor="prefix">Prefix</label>
                                    <input type="text" id="prefix" value={contactInformation.prefix} onChange={(e) => setContactInformation({ ...contactInformation, prefix: e.target.value })} />
                                </div>
                                <div className="form-group suffix">
                                    <label htmlFor="suffix">Suffix</label>
                                    <input type="text" id="suffix" value={contactInformation.suffix} onChange={(e) => setContactInformation({ ...contactInformation, suffix: e.target.value })} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group cname">
                                    <label htmlFor="company_name">Company Name<span className='required'>*</span></label>
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
                        <label htmlFor="date_of_birth">{!contactInformation.is_company ? "Date of Birth" : "Creation Date"}<span className='required'>*</span></label>
                        <input type="date" id="date_of_birth" value={contactInformation.date_of_birth} onChange={(e) => setContactInformation({ ...contactInformation, date_of_birth: e.target.value })} />
                    </div>
                    {!contactInformation.is_company && (
                        <div className="form-group">
                            <label htmlFor="date_of_death">Date of Death</label>
                            <input type="date" id="date_of_death" value={contactInformation.date_of_death} onChange={(e) => setContactInformation({ ...contactInformation, date_of_death: e.target.value })} />
                        </div>
                    )}
                    <div className='form-group'>
                        <label htmlFor='preferred_contact_method'>Preferred Contact Method</label>
                        <select className='default-select' id='preferred_contact_method'>
                            <option value='' disabled>Select...</option>
                            <option value='email'>Email</option>
                            <option value='phone'>Phone</option>
                            <option value='mail'>Mail</option>
                        </select>
                    </div>
                    <div className='sub-title'>
                        <h4>Contact Information</h4>
                    </div>
                    <div className='contact-detail-container'>
                        {phones.map((phone, index) => (
                            <div key={`phone-${index}`} className='phone-number-container'>
                                <div className='form-group phone-type'>
                                    <label htmlFor={`phone-type-${index}`}>Phone Type</label>
                                    <select className='default-select' value={phone.type} onChange={(e) => {
                                        const newPhones = [...phones];
                                        newPhones[index].type = e.target.value;
                                        setPhones(newPhones);
                                    }}>
                                        <option value="mobile">Mobile</option>
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="fax">Fax</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className='form-group phone-input'>
                                    <label htmlFor={`phone-number-${index}`}>Number</label>
                                    <input type="tel" id={`phone-number-${index}`} value={phone.number} onChange={(e) => {
                                        const newPhones = [...phones];
                                        newPhones[index].number = e.target.value;
                                        setPhones(newPhones);
                                    }} />
                                </div>
                                <div className='form-box alt' title='Add another phone number' onClick={addPhone}>+</div>
                            </div>
                        ))}
                    </div>
                    <div className="contact-detail-container">
                        {emails.map((email, index) => (
                            <div key={`email-${index}`} className='email-container'>
                                <div className='form-group email-type'>
                                    <label htmlFor={`email-type-${index}`}>Email Type</label>
                                    <select className='default-select' id={`email-type-${index}`} value={email.type} onChange={(e) => {
                                        const newEmails = [...emails];
                                        newEmails[index].type = e.target.value;
                                        setEmails(newEmails);
                                    }}>
                                        <option value="personal">Personal</option>
                                        <option value="work">Work</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className='form-group email-input'>
                                    <label htmlFor={`email-address-${index}`}>Email</label>
                                    <input type="email" id={`email-address-${index}`} value={email.email} onChange={(e) => {
                                        const newEmails = [...emails];
                                        newEmails[index].email = e.target.value;
                                        setEmails(newEmails);
                                    }} />
                                </div>
                                <div className='form-box alt' title='Add another email' onClick={addEmail}>+</div>
                            </div>
                        ))}
                    </div>
                    <div className='contact-detail-container'>
                        {addresses.map((address, index) => (
                            <div key={index} className='address'>
                                <div className='form-group'>
                                    <label htmlFor="address-type">Type</label>
                                    <select className='default-select' value={address.type} name='address-type' onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].type = e.target.value;
                                        setAddresses(updated);
                                    }}>
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label>Address Line 1</label>
                                    <input type="text" value={address.line1} onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].line1 = e.target.value;
                                        setAddresses(updated);
                                    }} />
                                </div>
                                <div className='form-group'>
                                    <label>Address Line 2</label>
                                    <input type="text" value={address.line2} onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].line2 = e.target.value;
                                        setAddresses(updated);
                                    }} />
                                </div>
                                <div className='form-group'>
                                    <label>City</label>
                                    <input type="text" value={address.city} onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].city = e.target.value;
                                        setAddresses(updated);
                                    }} />
                                </div>
                                <div className='form-group'>
                                    <label>State</label>
                                    <input type="text" value={address.state} onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].state = e.target.value;
                                        setAddresses(updated);
                                    }} />
                                </div>
                                <div className='form-group postal'>
                                    <label>Postal Code</label>
                                    <input type="text" value={address.postal_code} onChange={(e) => {
                                        const updated = [...addresses];
                                        updated[index].postal_code = e.target.value;
                                        setAddresses(updated);
                                    }} />
                                </div>
                                <div className='form-box alt' title='Add another address' onClick={addAddress}>+</div>
                            </div>
                        ))}
                    </div>
                </form>
            </div>
        </Modal>
    )
}