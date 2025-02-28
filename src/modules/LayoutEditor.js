import React, { useState, useEffect } from "react";
import "../styles/LayoutEditor.css";
import { Check, StarOutlineSharp, StarSharp, Add, Close, Dashboard } from "@mui/icons-material";
import Modal from "./Modal";
import { Activity, FileText, Folder, Home, User, Settings, Bell, Calendar, Clipboard, Cloud, Code, DollarSign, Edit, Eye, File, Heart, Image, Lock, Mail, MapPin, MessageCircle, Phone, Shield, ShoppingCart, Star, Tag, Trash, Truck, Users, Video, Section, SectionIcon, LucideSection, TrashIcon, Eraser, Edit2, Trash2 } from "lucide-react";

const IconMap = {
    "Activity": Activity,
    "FileText": FileText,
    "File": Folder,
    "Home": Home,
    "User": User,
    "Settings": Settings,
    "Bell": Bell,
    "Calendar": Calendar,
    "Clipboard": Clipboard,
    "Cloud": Cloud,
    "Code": Code,
    "DollarSign": DollarSign,
    "Edit": Edit,
    "Eye": Eye,
    "Heart": Heart,
    "Image": Image,
    "Lock": Lock,
    "Mail": Mail,
    "MapPin": MapPin,
    "MessageCircle": MessageCircle,
    "Phone": Phone,
    "Shield": Shield,
    "ShoppingCart": ShoppingCart,
    "Star": Star,
    "Tag": Tag,
    "Trash": Trash,
    "Truck": Truck,
    "Users": Users,
    "Video": Video,
}

export const LayoutEditor = () => {
    const [sections, setSections] = useState([]);
    const [phases, setPhases] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [createTemplate, setCreateTemplate] = useState(false);
    const [createNew, setCreateNew] = useState(null);
    const [defaultTemplate, setDefaultTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        aka: "",
        description: "",
        visibility: 0,
        default: 0,
        favorite: 0,
    });
    const [sectionData, setSectionData] = useState({ name: "", description: "", icon: "", order_id: 0 });
    const [addingField, setAddingField] = useState(null);
    const [selectedField, setSelectedField] = useState("");
    const [availableFields, setAvailableFields] = useState([]);
    const [sectionExpanded, setSectionExpanded] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [customFieldData, setCustomFieldData] = useState({ name: "", section_id: "", field_id: "", order_id: 0, rules: {} });
    const [currentFields, setCurrentFields] = useState([]);
    const [showIconModal, setShowIconModal] = useState(false);
    const [selectedTemplateHeader, setSelectedTemplateHeader] = useState(0);
    const [phaseData, setPhaseData] = useState({ phase: "", description: "", template_id: 0, order_id: 0 });

    useEffect(() => {
        fetchTemplates();
        fetchAvailableFields();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/layout.php");
            const data = await response.json();

            if (data.templates.length > 0) {
                setTemplates(data.templates);
                const firstTemplate = data.templates[0];
                setDefaultTemplate(firstTemplate);
                fetchTemplateLayout(firstTemplate.id);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const fetchTemplateLayout = async (templateId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/sections.php?template_id=${templateId}`);
            const data = await response.json();
            setSections(data.sections || []);
            setPhases(data.phases || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchAvailableFields = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/fields.php");
            const data = await response.json();
            setAvailableFields(data.fields || []);
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    };

    const fetchCurrentFields = async (sectionId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/fields.php?section_id=${sectionId}`);
            const data = await response.json();
            setCurrentFields(data.fields || []);
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    };

    const handleTemplateChange = (e) => {
        const newTemplateId = e.target.value;
        const selectedTemplate = templates.find(template => template.id === newTemplateId);
        setDefaultTemplate(selectedTemplate);
        fetchTemplateLayout(newTemplateId);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (name) => {
        setFormData((prevState) => ({
            ...prevState,
            [name]: prevState[name] === 1 ? 0 : 1,
        }));
    };

    const handleTemplateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("https://dalyblackdata.com/api/layout.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                setCreateTemplate(false);
                fetchTemplates();
            } else {
                console.error("Error creating template:", data.message);
            }
        } catch (error) {
            console.error("Error creating template:", error);
        }
    };

    const createNewSection = async () => {
        if (!defaultTemplate || !sectionData.name) return;
        const newSection = { name: sectionData.name, template_id: defaultTemplate.id, order_id: sections.length + 1 };

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSection),
            });
            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
                setCreateNew(null);
                setSectionData({ name: "" });
            }
        } catch (error) {
            console.error("Error creating section:", error);
        }
    };

    const createNewPhase = async () => {
        if (!defaultTemplate || !phaseData.phase) return;
        const newPhase = { phase: phaseData.phase, description: phaseData.description, template_id: defaultTemplate.id, order_id: phaseData.order_id || phases.length + 1 };

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPhase),
            });
            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
                setCreateNew(null);
                setPhaseData({ phase: "", description: "", template_id: 0, order_id: 0 });
            }
        } catch (error) {
            console.error("Error creating phase:", error);
        }
    };

    const addFieldToSection = async (sectionId) => {
        if (!selectedField) return;

        const newField = {
            name: customFieldData.name,
            section_id: sectionId,
            field_id: selectedField,
            order_id: customFieldData.order_id || currentFields.length + 1,
            rules: customFieldData.rules
        };

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php?add_field=true", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newField),
            });

            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
                setAddingField(null);
                setSelectedField("");
                fetchCurrentFields(sectionId);
                setCustomFieldData({ name: "", section_id: "", field_id: "", order_id: 0, rules: {} });
            }
        } catch (error) {
            console.error("Error adding field:", error);
        }
    };

    const toggleSection = (section) => {
        if (sectionExpanded !== section.id) {
            setSectionExpanded(section.id);
            fetchCurrentFields(section.id);
            setEditingSection({
                id: section.id,
                name: section.name,
                description: section.description,
                icon: section.icon,
                order_id: section.order_id
            })
        }
    };

    const handleSectionPropertyChange = (e) => {
        const { name, value } = e.target;
        setEditingSection((prevState) => ({
            ...prevState, [name]: value
        }));
    };

    const handleCustomFieldChange = (e) => {
        const { name, value } = e.target;
        setCustomFieldData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleRuleChange = (fieldId, value) => {
        setCustomFieldData((prevState) => ({
            ...prevState,
            rules: {
                ...prevState.rules,
                [fieldId]: value
            }
        }));
    };

    const closeSection = () => {
        setSectionExpanded(false);
    };

    const handleIconClick = () => {
        setShowIconModal(true);
    };

    const handleIconSelect = async (iconKey) => {
        handleSectionPropertyChange({ target: { name: 'icon', value: iconKey } });
        setShowIconModal(false);

        if (editingSection) {
            const updatedSection = { ...editingSection, icon: iconKey };
            try {
                const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedSection),
                });
                const data = await response.json();
                if (data.success) {
                    fetchTemplateLayout(defaultTemplate.id);
                } else {
                    console.error("Error updating section:", data.message);
                }
            } catch (error) {
                console.error("Error updating section:", error);
            }
        }
    };

    const handleSectionUpdate = async () => {
        if (editingSection) {
            try {
                const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editingSection),
                });
                const data = await response.json();
                if (data.success) {
                    fetchTemplateLayout(defaultTemplate.id);
                } else {
                    console.error("Error updating section:", data.message);
                }
            } catch (error) {
                console.error("Error updating section:", error);
            }
        }
    };

    return (
        <div className="page-container">
            <header className="editor-header">
                <h2>Layout Editor</h2>
                <select className="default-select" value={defaultTemplate?.id || ""} onChange={handleTemplateChange}>
                    <option value="" disabled>Select a template</option>
                    {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                            {template.name} [{template.aka}]
                        </option>
                    ))}
                </select>
                <button className="action" onClick={() => setCreateTemplate(true)}>New Template</button>
            </header>
            {createTemplate && (
                <Modal onClose={() => setCreateTemplate(false)}>
                    <div className="new-template">
                        <h4>Create New Case Template</h4>
                        <form onSubmit={handleTemplateSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="aka">Nickname</label>
                                <input type="text" id="aka" name="aka" value={formData.aka} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                            </div>
                            <button type="submit" className="action">Save Template</button>
                        </form>
                    </div>
                </Modal>
            )}
            <div id='template-container'>
                <div id='template-header'>
                    <h4 onClick={() => setSelectedTemplateHeader(0)} className={selectedTemplateHeader === 0 ? 'active' : ''}>Sections</h4>
                    <h4 onClick={() => setSelectedTemplateHeader(1)} className={selectedTemplateHeader === 1 ? 'active' : ''}>Phases</h4>
                </div>
                {selectedTemplateHeader === 0 && <div className="section-container">
                    <div className='template-container-header'>
                        <h4>{defaultTemplate?.name} Sections</h4>
                        <button className="action alt" onClick={() => setCreateNew('section')}>Add Section</button>
                    </div>
                    {sections.map((section, index) => (
                        <div key={index} className="template-section" onClick={() => toggleSection(section)}>
                            {sectionExpanded !== section.id ? (
                                <>
                                    <div className='section-header'>
                                        {IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <StarOutlineSharp />}
                                        <h4>{section.name}</h4>
                                        {section.built_in === 1  && <p>(Built In)</p>}
                                    </div>
                                    <p>{section.description}</p>
                                </>
                            ) : (
                                <>
                                    <div className='section-header far'>
                                        <h4>{section.name} Properties</h4>
                                        <Close onClick={closeSection} />
                                    </div>
                                    <div className='section-properties'>
                                        <div className='section-label'>
                                            <label htmlFor="name" >Name & Icon</label>
                                            <div className="icon-option" onClick={handleIconClick}>
                                                {IconMap[editingSection?.icon] ? React.createElement(IconMap[editingSection?.icon]) : <StarOutlineSharp />}
                                            </div>
                                            <input id='name' type="text" value={editingSection?.name} onChange={handleSectionPropertyChange} name="name" onBlur={handleSectionUpdate} />
                                        </div>
                                        <div className='section-label'>
                                            <label htmlFor="description">
                                                Description
                                            </label>
                                            <textarea id='description' className="description-text" onChange={handleSectionPropertyChange} value={editingSection?.description} name='description' onBlur={handleSectionUpdate} />
                                        </div>
                                        <div className='section-label'>
                                            <label htmlFor='order_id'>
                                                Order
                                            </label>
                                            <input id='order_id' type='number' onChange={handleSectionPropertyChange} value={editingSection?.order_id} name='order_id' onBlur={handleSectionUpdate} />
                                        </div>
                                    </div>
                                    <div className='section-fields'>
                                        <button className="action small" onClick={() => setAddingField(section.id)}>+ Field</button>
                                        {currentFields && currentFields.length > 0 && (
                                            <ul>
                                                {currentFields.map(field => (
                                                    <li key={field.id}>{field.name} ({field.type}) {field.order_id}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>}
                {selectedTemplateHeader === 1 && (
                    <div className="phase-container">
                        <div className='template-container-header'>
                            <h4>{defaultTemplate.name} Phases</h4>
                            <button className="action alt" onClick={() => setCreateNew('phase')}>Add Phase</button>
                        </div>
                        <div className='phase-list'>
                            {phases.map((phase, index) => (
                                <div key={index} className="template-phase far" onClick={() => toggleSection(phase)}>
                                    <h4 title={phase.description}>{phase.phase}</h4>
                                    <div className='phase-actions'>
                                        <Edit />
                                        <Trash2 />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {addingField && (
                <Modal onClose={() => setAddingField(null)}>
                    <div className="new-template">
                        <h4>Add Field to Section</h4>
                        <div className="form-group">
                            <label htmlFor="name">Field Prompt</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={customFieldData.field_name} 
                                onChange={handleCustomFieldChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor='field_type'>Select Field Type</label>
                            <select 
                                value={selectedField} 
                                onChange={(e) => setSelectedField(e.target.value)}
                                className="default-select"
                                name='field_type'
                            >
                                <option value="">Select a Field</option>
                                {availableFields.map(field => (
                                    <option key={field.id} value={field.id}>{field.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="order_id">Order</label>
                            <input 
                                type="number" 
                                id="order_id" 
                                name="order_id" 
                                value={customFieldData.order_id} 
                                onChange={handleCustomFieldChange} 
                            />
                        </div>
                        {selectedField && <div className="form-group">
                            <label htmlFor="visibility-rule">Visibility</label>
                            <select 
                                value={customFieldData.rules.visibility} 
                                onChange={(e) => handleRuleChange('visibility', e.target.value)}
                                className="default-select"
                                name='visibility-rule'
                            >
                                <option value="">Select Visibility</option>
                                <option value="1">Show</option>
                                <option value="0">Hide</option>
                            </select>
                        </div>}
                        {customFieldData.rules.visibility && <div className="form-group">
                            <select 
                                value={customFieldData.rules.when} 
                                onChange={(e) => handleRuleChange('when', e.target.value)}
                                className="default-select"
                            >
                                <option value="0">Always</option>
                                {currentFields.map(field => (
                                    <option key={field.id} value={field.id}>When "{field.name}"</option>
                                ))}
                            </select>
                        </div>}
                        <button className="action" onClick={() => addFieldToSection(addingField)}>Save Field</button>
                    </div>
                </Modal>
            )}
            {createNew && (
                <Modal onClose={() => setCreateNew(null)}>
                    {createNew === 'section' ? (
                        <div className="new-template">
                            <h4>Create New Section</h4>
                            <div className='form-group'>
                                <label htmlFor='name'>Section Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Section Name" 
                                    name="name" 
                                    value={sectionData.name}
                                    onChange={(e) => setSectionData({ name: e.target.value })}
                                />
                            </div>
                            <button className="action" onClick={createNewSection}>Save Section</button>
                        </div>
                    ) : (
                        <div className='new-template'>
                            <h4>Create New Phase</h4>
                            <div className='form-group'>
                                <label htmlFor='phase'>Phase Name</label>
                                <input type="text" placeholder="Phase Name" value={phaseData.phase} onChange={(e) => setPhaseData({ ...phaseData, phase: e.target.value })}/>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='description'>Description</label>
                                <textarea placeholder="Phase Description" name='description' value={phaseData.description} onChange={(e) => setPhaseData({ ...phaseData, description: e.target.value })}/>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='order_id'>Order</label>
                                <input type='number' placeholder='Order' value={phaseData.order_id} onChange={(e) => setPhaseData({ ...phaseData, order_id: e.target.value })}/>
                            </div>
                            <button className="action" onClick={createNewPhase}>Save Phase</button>
                        </div>
                    )}
                </Modal>
            )}
            {showIconModal && (
                <Modal onClose={() => setShowIconModal(false)}>
                    <div className="icon-selection">
                        {Object.keys(IconMap).map((iconKey) => (
                            <div 
                                key={iconKey} 
                                className={`icon-option ${editingSection?.icon === iconKey ? 'selected' : ''}`} 
                                onClick={() => handleIconSelect(iconKey)}
                            >
                                {React.createElement(IconMap[iconKey])}
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
};