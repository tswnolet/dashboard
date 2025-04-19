import { Badge, Mail, Pen, Pencil, Phone, SquareUser } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { EditDetail } from './EditDetail';
import { EditableVital } from './CaseSidebar';
import { Dropdown } from './FieldComponents';

const MetaItem = ({ icon, value, type = null, onClick }) => {
    if (!value) return null;
    return (
        <div className='item' onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            {icon}
            {type === 'phone' ? <a href={`tel:${value}`}>{value}</a> 
                : type === 'email' ? <a href={`mailto:${value}`}>{value}</a> 
                : value}
        </div>
    );
};

export const CaseHeader = ({ caseData = {}, fetchCase, vitals = [], fetchVitals, caseTypes }) => {
    const contact = caseData?.contact || {};
    const caseInfo = caseData?.case || {};
    const [tags, setTags] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [tagInput, setTagInput] = useState("");
    const tagRef = useRef(null);
    const [editContact, setEditContact] = useState(false);
    const [phases, setPhases] = useState([]);
    const [currentPhase, setCurrentPhase] = useState(null);

    useEffect(() => {
        try {
            const parsedTags = caseInfo?.tags ? Object.values(JSON.parse(caseInfo.tags)) : [];
            setTags(parsedTags);
        } catch (error) {
            console.error("Error parsing tags:", error);
            setTags([]);
        }
    }, [caseInfo?.tags]);

    useEffect(() => {
        if (editingIndex !== null) {
            tagRef.current?.focus();
        }

        const handleClickOutside = (e) => {
            if (tagRef.current && !tagRef.current.contains(e.target)) {
                setEditingIndex(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editingIndex]);

    const fetchPhases = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/phases.php`);
            const data = await response.json();
            if (data.success) {
                setPhases(data.phases);
            } else {
                console.error("Failed to fetch phases:", data.message);
            }
        } catch (error) {
            console.error("Error fetching phases:", error);
        }
    };

    const updatePhase = async () => {
        try {
            const response = await fetch(`https://api.casedb.co/phases.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ case_id: caseInfo.id, phase_id: currentPhase }),
            });

            const data = await response.json();
            if (!data.success) {
                console.error("Failed to update phase:", data.message);
            }
        } catch (error) {
            console.error("Error updating phase:", error);
        }
    };

    const handleEditTag = (index) => {
        setEditingIndex(index);
        setTagInput(tags[index]);
    };

    const handleSaveTag = async (index) => {
        if (!tagInput.trim()) return;
    
        const updatedTags = [...tags];
        updatedTags[index] = tagInput.trim();
        setTags(updatedTags);
        setEditingIndex(null);
        await updateTags(updatedTags);
    };    

    const handleAddTag = async () => {
        const newTag = "NewTag";
        const newTags = [...tags, newTag];
    
        setTags(newTags);
        setEditingIndex(tags.length);
        setTagInput(newTag);
        await updateTags(newTags);
    };    

    const handleDeleteTag = async (index) => {
        const newTags = tags.filter((_, i) => i !== index);
        setTags(newTags);
        await updateTags(newTags);
    };

    const updateTags = async (updatedTags) => {
        try {
            const response = await fetch(`https://api.casedb.co/update-tags.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ case_id: caseInfo.id, tags: updatedTags }),
            });

            const data = await response.json();
            if (!data.success) {
                console.error("Failed to update tags:", data.message);
            }
        } catch (error) {
            console.error("Error updating tags:", error);
        }
    };

    const updateVital = async (field, newValue, table) => {
        const payload = {
            case_id: caseData?.case?.case_id,
            lead_id: caseData?.lead?.id,
            field,
            value: newValue,
            table
        };

        try {
            const response = await fetch("https://api.casedb.co/update-vital.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                fetchVitals();
                if (table === 'leads' || table === 'cases')
                    fetchCase();
            } else {
                console.error("Update failed:", result.message);
            }
        } catch (error) {
            console.error("Error updating vital:", error);
        }
    };

    const contactDisplay = contact?.profile_picture
        ? <img src={`https://api.casedb.co/${contact.profile_picture}`} alt="Profile" />
        : <h2>{contact.first_name?.trim().charAt(0) + contact?.last_name?.trim().charAt(0) || "DB"}</h2>;

    useEffect(() => {
        fetchPhases();
    }, []);

    useEffect(() => {
        if (caseInfo?.phase_id !== currentPhase && currentPhase && caseInfo?.phase_id) {
            updatePhase();
        }
    }, [currentPhase]);

    useEffect(() => {
        if (caseInfo?.phase_id) {
            setCurrentPhase(caseInfo.phase_id);
        }
    }, [caseData]);

    return (
        <div className='case-header'>
            <div className='case-information-container'>
                <div className='case-information'>
                    <div className='case-initials'>
                        {contactDisplay}
                    </div>
                    <div className='details'>
                        <h2 className='case-header-title'>
                            {caseInfo?.case_name || "Loading..."}
                            <span className='subtext'> ({caseInfo?.id || "N/A"})</span>
                        </h2>
                        <div className='case-header-meta subtext'>
                            <MetaItem icon={<SquareUser size={16} />} value={contact?.full_name} onClick={() => setEditContact(true)} />
                            <MetaItem icon={<Phone size={16} />} value={contact?.details?.phone ? contact?.details?.phone[0]?.number : ""} type='phone' />
                            <MetaItem icon={<Mail size={16} />} value={contact?.details?.email ? contact?.details?.email[0]?.email : ""} type='email' />
                        </div>
                    </div>
                </div>
                <div className='case-phase'>
                    <Dropdown options={phases.map(phase => phase.phase)} onChange={(val) => setCurrentPhase(val + 1)} value={currentPhase - 1} />
                </div>
            </div>
            <div className='case-header-data'>
                <div className='case-tags'>
                    {tags.map((tag, index) => (
                        editingIndex === index ? (
                            <input
                                key={`tag-${index}`}
                                ref={tagRef}
                                value={tagInput}
                                className='tag input caps'
                                onChange={(e) => setTagInput(e.target.value)}
                                onBlur={() => handleSaveTag(index)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTag(index)}
                            />
                        ) : (
                            <span key={`tag-${index}`} className='tag caps' onDoubleClick={() => handleEditTag(index)}>
                                #{tag} <span className="remove-tag" onClick={() => handleDeleteTag(index)}>✖</span>
                            </span>
                        )
                    ))}
                    <span className='tag caps bright edit' onClick={handleAddTag}>
                        <Pencil size={16} /> Add Tag
                    </span>
                </div>
            </div>
            <div className='case-vitals'>
                <EditableVital
                    label="Case Type"
                    value={caseData?.lead?.case_type_id}
                    typeId={10}
                    field="case_type_id"
                    table="leads"
                    updateVital={updateVital}
                    options={caseTypes.map(ct => ct.name)}
                    transformValue={(name) => {
                        const match = caseTypes.find(ct => ct.name === name);
                        return match ? match.id : null;
                    }}
                />
                {vitals.map((vital) => (
                    <EditableVital
                        key={vital.id}
                        label={vital.name}
                        value={vital.value}
                        typeId={vital.custom_field_id}
                        field={vital.field_id}
                        table="custom_fields"
                        updateVital={updateVital}
                        formatDate={(date) => {}}
                        options={(() => {
                            try {
                                return JSON.parse(vital?.options ?? '[]');
                            } catch {
                                return [];
                            }
                        })()}
                        contactName={vital.contact_name}
                    />
                ))}
            </div>

            {editContact && (
                <EditDetail 
                    setEditContact={setEditContact} 
                    contactData={contact} 
                    fetchContacts={fetchCase} 
                />
            )}
        </div>
    );
};