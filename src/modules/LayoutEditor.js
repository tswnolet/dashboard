import React, { useState, useEffect } from "react";
import "../styles/LayoutEditor.css";
import { Check, StarOutlineSharp, StarSharp, Add, Close } from "@mui/icons-material";
import Modal from "./Modal";
import { Activity, FileText, Folder } from "lucide-react";

const IconMap = {
    "Activity": Activity,
    "file-text": FileText,
    "File": Folder,
}

export const LayoutEditor = () => {
    const [layout, setLayout] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [createTemplate, setCreateTemplate] = useState(false);
    const [createSection, setCreateSection] = useState(false);
    const [defaultTemplate, setDefaultTemplate] = useState("");
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
                const firstTemplateId = data.templates[0];
                setDefaultTemplate(firstTemplateId);
                fetchSections(firstTemplateId.id);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const fetchSections = async (templateId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/sections.php?template_id=${templateId}`);
            const data = await response.json();
            setLayout(data.sections || []);
            console.log(data.sections);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchAvailableFields = async (section) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/fields.php?section_id=${section}`);
            const data = await response.json();
            setAvailableFields(data.fields || []);
        } catch (error) {
            console.error("Error fetching fields:", error);
        }
    };    

    const handleTemplateChange = (e) => {
        const newTemplateId = e.target.value;
        setDefaultTemplate(newTemplateId);
        fetchSections(newTemplateId);
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
        const newSection = { name: sectionData.name, template_id: defaultTemplate.id, order_id: layout.length + 1 };

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSection),
            });
            const data = await response.json();
            if (data.success) {
                fetchSections(defaultTemplate.id);
                setCreateSection(false);
                setSectionData({ name: "" });
            }
        } catch (error) {
            console.error("Error creating section:", error);
        }
    };

    const addFieldToSection = async (sectionId) => {
        if (!selectedField) return;
    
        const newField = {
            section_id: sectionId,
            field_id: selectedField,
            order_id: layout.length + 1
        };
    
        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php?add_field=true", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newField),
            });
    
            const data = await response.json();
            if (data.success) {
                fetchSections(defaultTemplate.id);
                setAddingField(null);
                setSelectedField("");
            }
        } catch (error) {
            console.error("Error adding field:", error);
        }
    };

    const toggleSection = (section) => {
        if (sectionExpanded !== section.id) {
            setSectionExpanded(section.id);
            fetchAvailableFields(section.id);
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
    
    const closeSection = () => {
        setSectionExpanded(false);
    };

    return (
        <div className="page-container">
            <header className="editor-header">
                <h2>Layout Editor</h2>
                <select className="default-select" value={defaultTemplate.id} onChange={handleTemplateChange}>
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
            {layout.length > 0 && (
                <div className="section-container">
                    <div className='section-container-header'>
                        {defaultTemplate.name && <h3>{defaultTemplate.name} Sections</h3>}
                        <button className="action alt" onClick={() => setCreateSection(true)}>Add Section</button>
                    </div>
                    {layout.map((section, index) => (
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
                                            <label htmlFor="name" >Name</label>
                                            <input id='name' type="text" value={editingSection?.name} onChange={handleSectionPropertyChange} name="name"/>
                                        </div>
                                        <div className='section-label'>
                                            <label htmlFor="description">
                                                Description
                                            </label>
                                            <textarea id='description' className="description-text" onChange={handleSectionPropertyChange} value={editingSection?.description} name='description'/>
                                        </div>
                                        <div className='section-label'>
                                            <label htmlFor='order'>
                                                Order
                                            </label>
                                            <input id='order' type='number' onChange={handleSectionPropertyChange} value={editingSection?.order_id} name='order' />
                                        </div>
                                    </div>
                                    <div className='section-fields'>
                                        <button className="action small" onClick={() => setAddingField(section.id)}>+ Field</button>
                                        {section.fields && section.fields.length > 0 && (
                                            <ul>
                                                {section.fields.map(field => (
                                                    <li key={field.id}>{field.name} ({field.type})</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {addingField && (
                <Modal onClose={() => setAddingField(null)}>
                    <div className="new-template">
                        <h4>Add Field to Section</h4>
                        <select 
                            value={selectedField} 
                            onChange={(e) => setSelectedField(e.target.value)}
                        >
                            <option value="">Select a Field</option>
                            {availableFields.map(field => (
                                <option key={field.id} value={field.id}>{field.name}</option>
                            ))}
                        </select>
                        <button className="action" onClick={() => addFieldToSection(addingField)}>Save Field</button>
                    </div>
                </Modal>
            )}
            {createSection && (
                <Modal onClose={() => setCreateSection(false)}>
                    <div className="new-template">
                        <h4>Create New Section</h4>
                        <input 
                            type="text" 
                            placeholder="Section Name" 
                            name="name" 
                            value={sectionData.name}
                            onChange={(e) => setSectionData({ name: e.target.value })}
                        />
                        <button className="action" onClick={createNewSection}>Save Section</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};