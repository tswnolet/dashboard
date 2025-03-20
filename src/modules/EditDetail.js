import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { Building } from "lucide-react";
import { Person } from "@mui/icons-material";

export const EditDetail = ({ setEditContact, contactData, fetchContacts }) => {
    const [contactInformation, setContactInformation] = useState({
        id: contactData.id,
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
    const [phones, setPhones] = useState([]);
    const [emails, setEmails] = useState([]);
    const [addresses, setAddresses] = useState([]);

    useEffect(() => {
        if (contactData) {
            setContactInformation({
                first_name: contactData.first_name || '',
                middle_name: contactData.middle_name || '',
                last_name: contactData.last_name || '',
                full_name: contactData.full_name || '',
                nickname: contactData.nickname || '',
                prefix: contactData.prefix || '',
                suffix: contactData.suffix || '',
                company_name: contactData.company_name || '',
                job_title: contactData.job_title || '',
                department: contactData.department || '',
                date_of_birth: contactData.date_of_birth || '',
                date_of_death: contactData.date_of_death || '',
                is_company: contactData.is_company === 1
            });

            setPhones(contactData.details?.phone ? [contactData.details.phone] : [{ type: "mobile", number: "" }]);
            setEmails(contactData.details?.email ? [contactData.details.email] : [{ type: "personal", email: "" }]);
            setAddresses(contactData.address ? [contactData.address] : [{
                type: "home", line1: "", line2: "", city: "", state: "", postal_code: ""
            }]);

            setProfilePicture(contactData.profile_picture ? `https://dalyblackdata.com/api/${contactData.profile_picture}` : null);
        }
    }, [contactData]);

    const addPhone = () => setPhones([...phones, { type: "mobile", number: "" }]);
    const addEmail = () => setEmails([...emails, { type: "personal", email: "" }]);
    const addAddress = () => setAddresses([...addresses, { type: "home", line1: "", line2: "", city: "", state: "", postal_code: "" }]);

    const handleProfilePictureChange = (e) => {
        setProfilePicture(URL.createObjectURL(e.target.files[0]));
    };

    const updateContact = async () => {
        const formData = new FormData();
        Object.keys(contactInformation).forEach(key => formData.append(key, contactInformation[key]));
        formData.append('id', contactData.id);
        formData.append('phones', JSON.stringify(phones));
        formData.append('emails', JSON.stringify(emails));
        formData.append('addresses', JSON.stringify(addresses));

        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        try {
            const response = await fetch(`https://dalyblackdata.com/api/update-contact.php`, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                fetchContacts();
                setEditContact(false);
            } else {
                console.error("Error updating contact:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating contact:", error);
        }
    };

    return (
        <Modal
            onClose={() => setEditContact(false)}
            title="Edit Contact"
            wide={true}
            header={(
                <div className='modal-header-actions'>
                    <button className='action alt' onClick={() => setEditContact(false)}>Cancel</button>
                    <button className='action' onClick={updateContact}>Save</button>
                </div>
            )}
        >
            <div className='modal-content-wrapper'>
                <form>
                    <div className='sub-title'>
                        <h4>Basic Information</h4>
                        <div className='person-or-company'>
                            <div className={`poc person${!contactInformation.is_company ? ' active' : ''}`} onClick={() => setContactInformation({ ...contactInformation, is_company: false })} title='Person'>
                                <Person />
                            </div>
                            <div className={`poc company${contactInformation.is_company ? ' active' : ''}`} onClick={() => setContactInformation({ ...contactInformation, is_company: true })} title='Company'>
                                <Building />
                            </div>
                        </div>
                    </div>
                    <div className="contact-picture form-box" onClick={() => document.getElementById('profilePictureInput').click()}>
                        {profilePicture ? (
                            <img className='contact-picture-listed' src={profilePicture} alt="Contact" />
                        ) : (
                            <Person />
                        )}
                        <input type="file" id="profilePictureInput" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePictureChange} />
                    </div>

                    <div className='contact-name-container'>
                        {!contactInformation.is_company ? (
                            <>
                                <div className="form-group"><label>First Name*</label><input type="text" value={contactInformation.first_name} onChange={(e) => setContactInformation({ ...contactInformation, first_name: e.target.value })} /></div>
                                <div className="form-group"><label>Middle Name</label><input type="text" value={contactInformation.middle_name} onChange={(e) => setContactInformation({ ...contactInformation, middle_name: e.target.value })} /></div>
                                <div className="form-group"><label>Last Name*</label><input type="text" value={contactInformation.last_name} onChange={(e) => setContactInformation({ ...contactInformation, last_name: e.target.value })} /></div>
                            </>
                        ) : (
                            <div className="form-group"><label>Company Name*</label><input type="text" value={contactInformation.company_name} onChange={(e) => setContactInformation({ ...contactInformation, company_name: e.target.value })} /></div>
                        )}
                    </div>

                    <div className='sub-title'><h4>Contact Information</h4></div>
                    {phones.map((phone, index) => (
                        <div key={index} className='contact-detail-container'>
                            <div className="form-group"><label>Phone</label><input type="tel" value={phone.number} onChange={(e) => { const updated = [...phones]; updated[index].number = e.target.value; setPhones(updated); }} /></div>
                        </div>
                    ))}
                    <button type="button" onClick={addPhone}>+ Add Phone</button>

                    {emails.map((email, index) => (
                        <div key={index} className='contact-detail-container'>
                            <div className="form-group"><label>Email</label><input type="email" value={email.email} onChange={(e) => { const updated = [...emails]; updated[index].email = e.target.value; setEmails(updated); }} /></div>
                        </div>
                    ))}
                    <button type="button" onClick={addEmail}>+ Add Email</button>

                    {addresses.map((address, index) => (
                        <div key={index} className='contact-detail-container'>
                            <div className="form-group"><label>Address</label><input type="text" value={address.line1} onChange={(e) => { const updated = [...addresses]; updated[index].line1 = e.target.value; setAddresses(updated); }} /></div>
                        </div>
                    ))}
                    <button type="button" onClick={addAddress}>+ Add Address</button>
                </form>
            </div>
        </Modal>
    );
};