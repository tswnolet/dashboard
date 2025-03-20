import { Badge, Mail, Pen, Pencil, Phone, SquareUser } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { EditDetail } from './EditDetail';

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

export const CaseHeader = ({ caseData = {}, fetchCases }) => {
    const contact = caseData?.contact || {};
    const caseInfo = caseData?.case || {};
    const [tags, setTags] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [tagInput, setTagInput] = useState("");
    const tagRef = useRef(null);
    const [editContact, setEditContact] = useState(false);

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
            const response = await fetch(`https://dalyblackdata.com/api/update-tags.php`, {
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

    const contactDisplay = contact?.profile_picture
        ? <img src={`https://dalyblackdata.com/api/${contact.profile_picture}`} alt="Profile" />
        : <h2>{contact.full_name?.charAt(0) || "N/A"}</h2>;

    return (
        <div className='case-header'>
            <div className='case-information'>
                <div className='case-initials'>
                    {contactDisplay}
                </div>
                <div className='details'>
                    <h2 className='case-header-title'>
                        {caseInfo?.case_name || "No Case Name"}
                        <span className='subtext'> ({caseInfo?.id || "N/A"})</span>
                    </h2>
                    <div className='case-header-meta subtext'>
                        <MetaItem icon={<SquareUser size={16} />} value={contact?.full_name} onClick={() => setEditContact(true)} />
                        <MetaItem icon={<Phone size={16} />} value={contact?.details?.phone?.number} type='phone' onClick={() => setEditContact(true)} />
                        <MetaItem icon={<Mail size={16} />} value={contact?.details?.email?.email} type='email' onClick={() => setEditContact(true)} />
                    </div>
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

            {editContact && (
                <EditDetail 
                    setEditContact={setEditContact} 
                    contactData={contact} 
                    fetchContacts={fetchCases} 
                />
            )}
        </div>
    );
};