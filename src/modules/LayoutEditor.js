import React, { useState, useEffect } from "react";
import "../styles/LayoutEditor.css";
import Modal from "./Modal";
import FolderTreeManager from "./FolderTreeManager";
import { Boolean, Contact, DateInput, Dropdown, NumberInput, Text } from "./FieldComponents";
import { IconMap } from "./IconMap";
import { StarOutlineSharp, Close, Archive } from "@mui/icons-material";
import { Edit, Loader2, Trash2 } from "lucide-react";

const Vital = ({ vital, description }) => {
    return (
        <div className="vital">
            <div className='form-group small'>
                <label className='vital-name'>{vital}</label>
                {/*false === true && <Dropdown options={caseTypes.map((type) => type.name)}/>*/}
            </div>
            <div className='vital-description'>
                <p className='subtext'>{description}</p>
            </div>
        </div>
    );
}

export const LayoutEditor = () => {
    const [sections, setSections] = useState([]);
    const [phases, setPhases] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [createTemplate, setCreateTemplate] = useState(false);
    const [createNew, setCreateNew] = useState(null);
    const [defaultTemplate, setDefaultTemplate] = useState(null);
    const [isSaving, setIsSaving] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        aka: "",
        description: "",
        visibility: 0,
        default: 0,
        favorite: 0,
    });
    const [sectionData, setSectionData] = useState({ name: "", description: "", icon: "Star", order_id: 0 });
    const [addingField, setAddingField] = useState(null);
    const [selectedField, setSelectedField] = useState("");
    const [sectionExpanded, setSectionExpanded] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [customFieldData, setCustomFieldData] = useState({ name: "", section_id: "", field_id: "", order_id: 0, rules: {} });
    const [currentFields, setCurrentFields] = useState([]);
    const [showIconModal, setShowIconModal] = useState(false);
    const [selectedTemplateHeader, setSelectedTemplateHeader] = useState(0);
    const [phaseData, setPhaseData] = useState({ phase: "", description: "", template_id: 0, order_id: 0 });
    const [editPhase, setEditPhase] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [vitalData, setVitalData] = useState({ name: "", description: "", icon: "", order_id: 0 });
    const [folderData, setFolderData] = useState({ name: "", parent_folder_id: 0, folder_access: "Standard" });
    const [folders, setFolders] = useState([]);
    const [fieldTypes, setFieldTypes] = useState([]);
    const [marketingSource, setMarketingSource] = useState({
        source_name: "",
        marketing_type: 0,
        description: "",
        template_id: 0,
        order_id: null
    });
    const [marketingSources, setMarketingSources] = useState([]);
    const [fieldLimit, setFieldLimit] = useState(4);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [hoveredField, setHoveredField] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const [statuses, setStatuses] = useState([]);
    const [statusData, setStatusData] = useState({ name: "", description: "" });
    const [statusExpanded, setStatusExpanded] = useState(null);
    const [caseTypes, setCaseTypes] = useState([]);
    const [currentSection, setCurrentSection] = useState(null);
    const [allFields, setAllFields] = useState([]);
    
    const handleMouseEnter = (fieldId) => {
        if (hoverTimeout) clearTimeout(hoverTimeout);

        setHoveredField(fieldId);
    };
    
    const handleMouseLeave = () => {
        setHoveredField(null);
    };

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchFolderStructure = async (templateId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/folder-templates.php?template_id=${templateId}&time=${new Date().getTime()}`);
            const data = await response.json();
            setFolders(data.folders || []);
        } catch (error) {
            console.error("Error fetching folder structure:", error);
        }
    };

    const fetchStatuses = async () => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/statuses.php?time=${new Date().getTime()}`);
            const data = await response.json();
            setStatuses(data.statuses || []);
        } catch (error) {
            console.error("Error fetching statuses:", error);
        }
    };

    const postStatuses = async () => {
        setIsSaving('statuses');
        try {
            const response = await fetch(`https://dalyblackdata.com/api/statuses.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(statusData),
            });
            const data = await response.json();
            if (data.success) {
                fetchStatuses();
                setCreateNew(null);
                setStatusData({ name: "", description: "" });
            } else {
                console.error("Error posting status:", data.message);
            }
        } catch (error) {
            console.error("Error posting status:", error);
        }
        setIsSaving(null);
    };

    const createFolder = async () => {
        if (!folderData.name) return;
        setIsSaving('folder');
    
        const newFolder = {
            template_id: defaultTemplate.id,
            parent_folder_id: folderData.parent_folder_id || null,
            name: folderData.name,
            folder_access: folderData.folder_access,
        };
    
        try {
            const response = await fetch("https://dalyblackdata.com/api/folder-templates.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newFolder),
            });
    
            const data = await response.json();
            if (data.success) {
                fetchFolderStructure(defaultTemplate.id);
                setCreateNew(null);
                setFolderData({ name: "", parent_folder_id: null, folder_access: "Standard" });
            } else {
                alert("Failed to create folder");
            }
        } catch (error) {
            console.error("Error creating folder:", error);
        }
        setIsSaving(null);
    };

    useEffect(() => {
        fetchTemplates();
        fetchMarketingSources();
        fetchStatuses();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/layout.php");
            const data = await response.json();

            if (data.templates.length > 0) {
                setTemplates(data.templates.filter((template) => template.visibility !== "2"));
                const firstTemplate = data.templates.filter((template) => template.default === "1")[0];
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
            fetchFolderStructure(templateId);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchCurrentFields = async (sectionId = null, templateId = null) => {
        setCurrentFields([]);
        setCurrentSection(sectionId || null);

        templateId = templateId || 1;

        try {
            const response = await fetch(`https://dalyblackdata.com/api/custom_fields.php?${sectionId ? `section_id=${sectionId}&template_id=${templateId}&` : `template_id=${templateId}&`}time=${new Date().getTime()}`);
            const data = await response.json();
            setCurrentFields(data.custom_fields || []);
            setFieldTypes(data.fields);
            setCaseTypes(data.case_types || []);
            setAllFields(data.all_custom_fields.length > 0 ? data.all_custom_fields : allFields);
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
        setIsSaving('template');

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
    
        setIsSaving(null);
    };

    const createNewSection = async () => {
        if (!defaultTemplate || !sectionData.name) {
            console.log("No template or section name" + defaultTemplate + Object.entries(sectionData));
            return;
        }
        const newSection = { name: sectionData.name, icon: editingSection.icon, template_id: defaultTemplate.id, description: sectionData.description, order_id: sections.length + 1 };
        setIsSaving('section');
        
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
                setSectionData({ name: "", description: '', icon: "Star", order_id: 0 });
                setEditingSection(null);
            }
        } catch (error) {
            console.error("Error creating section:", error);
        }
        setIsSaving(null);
    };

    const createNewPhase = async () => {
        if (!defaultTemplate || !phaseData.phase) return;
        const newPhase = { phase: phaseData.phase, description: phaseData.description, template_id: defaultTemplate.id, order_id: phaseData.order_id || phases.length + 1 };
        setIsSaving('phase');

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
        setIsSaving(null);
    };

    const updatePhase = async () => {
        if (!phaseData.phase) return;

        console.log(phaseData);

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...phaseData, id: editPhase }),
            });
            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
                setEditPhase(null);
                setPhaseData({ phase: "", description: "", template_id: 0, order_id: 0 });
            }
        } catch (error) {
            console.error("Error updating phase:", error);
        }
    };

    const deletePhase = async (phaseId) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/sections.php?phase_id=${phaseId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
            } else {
                console.error("Error deleting phase:", data.message);
            }
        } catch (error) {
            console.error("Error deleting phase:", error);
        }
    };

    const addFieldToSection = async (sectionId) => {
        if (!selectedField) return;

        setIsSaving('addingfield');

        const newField = {
            section_id: sectionId,
            id: selectedField,
            template_id: defaultTemplate.id,
            order_id: currentFields.length + 1,
        };

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newField),
            });

            const data = await response.json();
            if (data.success) {
                fetchTemplateLayout(defaultTemplate.id);
                setAddingField(null);
                setSelectedField("");
                fetchCurrentFields(sectionId, defaultTemplate.id);
                setCustomFieldData({ section_id: null, id: 0, template_id: null, order_id: 0});
            }
        } catch (error) {
            console.error("Error adding field:", error);
        }
        setIsSaving(null);
    };

    const toggleSection = (section) => {
        if (sectionExpanded !== section.id) {
            setSectionExpanded(section.id);
            fetchCurrentFields(section.id, defaultTemplate.id);
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
        setEditingSection(null);
        setCurrentSection(null);
    };

    const handleIconClick = () => {
        setShowIconModal(true);
    };

    const handleIconSelect = async (iconKey) => {
        handleSectionPropertyChange({ target: { name: 'icon', value: iconKey } });
        setShowIconModal(false);

        console.log(iconKey, editingSection);

        if (editingSection?.length > 1 || editingSection?.icon !== iconKey && createNew != 'section') {
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

    const handleDragStart = (index) => {
        setDragging(index);
    };

    const handleDragEnter = (index) => {
        if (dragging === null) return;
        const newPhases = [...phases];
        const draggedPhase = newPhases[dragging];
        newPhases.splice(dragging, 1);
        newPhases.splice(index, 0, draggedPhase);
        setDragging(index);
        setPhases(newPhases);
    };

    const handleDragEnd = async () => {
        setDragging(null);
        const updatedPhases = phases.map((phase, index) => ({
            ...phase,
            order_id: index
        }));
        setPhases(updatedPhases);

        const movedPhase = phases[dragging];
        const originalOrderId = movedPhase.order_id;
        const targetOrderId = updatedPhases.findIndex(phase => phase.id === movedPhase.id);

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    phases: updatedPhases,
                    moved_phase_id: movedPhase.id,
                    original_order_id: originalOrderId,
                    target_order_id: targetOrderId,
                    template_id: defaultTemplate.id
                }),
            });
            const data = await response.json();
            if (!data.success) {
                console.error("Error updating phase order:", data.message);
            }
        } catch (error) {
            console.error("Error updating phase order:", error);
        }
    };

    const handleSectionDragStart = (index) => {
        setDragging(index);
    };

    const handleSectionDragEnter = (index) => {
        if (dragging === null) return;
        const newSections = [...sections];
        const draggedSection = newSections[dragging];
        newSections.splice(dragging, 1);
        newSections.splice(index, 0, draggedSection);
        setDragging(index);
        setSections(newSections);
    };

    const handleSectionDragEnd = async () => {
        setDragging(null);
        const updatedSections = sections.map((section, index) => ({
            ...section,
            order_id: index
        }));
        setSections(updatedSections);

        const movedSection = sections[dragging];
        const originalOrderId = movedSection.order_id;
        const targetOrderId = updatedSections.findIndex(section => section.id === movedSection.id);

        try {
            const response = await fetch("https://dalyblackdata.com/api/sections.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    sections: updatedSections,
                    moved_section_id: movedSection.id,
                    original_order_id: originalOrderId,
                    target_order_id: targetOrderId,
                    template_id: defaultTemplate.id
                }),
            });
            const data = await response.json();
            if (!data.success) {
                console.error("Error updating section order:", data.message);
            }
        } catch (error) {
            console.error("Error updating section order:", error);
        }
    };

    const fetchMarketingSources = async () => {
        try {
            const response = await fetch("https://dalyblackdata.com/api/marketing_sources.php");
            const data = await response.json();
            setMarketingSources(data.marketing_sources || []);
        } catch (error) {
            console.error("Error fetching marketing sources:", error);
        }
    };

    const postMarketingSource = async (newSource) => {
        marketingSource.template_id = defaultTemplate.id;
        marketingSource.order_id = marketingSource.order_id === null ? marketingSources.length + 1 : marketingSource.order_id;
        setIsSaving('marketing');

        try {
            const response = await fetch("https://dalyblackdata.com/api/marketing_sources.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(marketingSource),
            });
    
            const data = await response.json();
    
            if (data.success) {
                fetchMarketingSources();
                setMarketingSource({
                    source_name: "",
                    marketing_type: 0,
                    description: "",
                    template_id: defaultTemplate.id,
                    order_id: null,
                });
                setCreateNew(null);
            } else {
                console.error("Error creating marketing source:", data.message);
            }
        } catch (error) {
            console.error("Error posting marketing source:", error);
        }
        setIsSaving(null);
    };

    const handleFieldChange = (fieldId, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    const renderFieldInput = (field) => {
        switch (field.field_id) {
            case 1:
                return (
                    <Text type="text" placeholder={field.name} disable/>
                );
            case 2:
                return (
                    <Text type="textarea" placeholder={field.name} disable/>
                );
            case 3:
                return (
                    <NumberInput type="currency" />
                );
            case 6:
                return (
                    <DateInput disable/>
                );
            case 8:
                return (
                    <Contact selectedContact={formData[field.id]} />
                );
            case 10:
                return (
                    <Dropdown options={field.options || "[]"} />
                );
            case 12:
                return (
                    <Boolean
                        options={field.options || []}
                        value={"Unknown"}
                        onChange={(selectedValue) => handleFieldChange(field.id, selectedValue)}
                    />
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        fetchCurrentFields();
    }, []);

    return (
        <div className="page-container">
            <header>
                <div id='page-header'>
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
                </div>
                <div id='template-header'>
                    {screenWidth < 729 ? (
                        <select className='default-select' value={selectedTemplateHeader} onChange={(e) => setSelectedTemplateHeader(Number(e.target.value))}>
                            <option value={0}>Sections</option>
                            <option value={1}>Phases</option>
                            <option value={2}>Vitals</option>
                            <option value={3}>Folder Structure</option>
                            <option value={4}>Marketing Sources</option>
                            <option value={5}>Lead Statuses</option>
                        </select>
                    )  : (
                        <>
                            <h4 onClick={() => setSelectedTemplateHeader(0)} className={selectedTemplateHeader === 0 ? 'active' : ''}>Sections</h4>
                            <h4 onClick={() => setSelectedTemplateHeader(1)} className={selectedTemplateHeader === 1 ? 'active' : ''}>Phases</h4>
                            <h4 onClick={() => setSelectedTemplateHeader(2)} className={selectedTemplateHeader === 2 ? 'active' : ''}>Vitals</h4>
                            <h4 onClick={() => setSelectedTemplateHeader(3)} className={selectedTemplateHeader === 3 ? 'active' : ''}>Folder Structure</h4>
                            <h4 onClick={() => setSelectedTemplateHeader(4)} className={selectedTemplateHeader === 4 ? 'active' : ''}>Marketing Sources</h4>
                            <h4 onClick={() => setSelectedTemplateHeader(5)} className={selectedTemplateHeader === 5 ? 'active' : ''}>Lead Statuses</h4>
                        </>
                    )}
                </div>
                <div className='template-container-header'>
                    <h4>
                        {defaultTemplate?.name}
                        {" "}
                        {selectedTemplateHeader === 0 
                            ? 'Sections' 
                                : selectedTemplateHeader === 1 
                            ? 'Phases' 
                                : selectedTemplateHeader === 2 
                            ? 'Vitals' 
                                : selectedTemplateHeader === 3 
                            ? 'Folder Structure' 
                                : selectedTemplateHeader === 4 
                            ? 'Marketing Sources' 
                                : 'Lead Statuses'
                        }
                    </h4>
                    <button className="action alt" onClick={() => {
                        switch (selectedTemplateHeader) {
                            case 0:
                                setCreateNew('section');
                                break;
                            case 1:
                                setCreateNew('phase');
                                break;
                            case 2:
                                setCreateNew('vitals');
                                break;
                            case 3:
                                setCreateNew('folder');
                                break;
                            case 4:
                                setCreateNew('marketing');
                                break;
                            case 5:
                                setCreateNew('statuses');
                                break;
                            default:
                                break;
                        }
                    }}>
                        Add {
                            selectedTemplateHeader === 0 
                                ? 'Section' 
                                : selectedTemplateHeader === 1 
                                ? 'Phase' 
                                : selectedTemplateHeader === 2 
                                ? 'Vital' 
                                : selectedTemplateHeader === 3 
                                ? 'Folder'
                                : selectedTemplateHeader === 4
                                ? "Marketing Source"
                                : 'Lead Status'
                        }
                    </button>
                </div>
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
                                <textarea id="description" name="description" value={formData.description || ""} onChange={handleInputChange} />
                            </div>
                            <button type="submit" className="action">Save Template</button>
                        </form>
                    </div>
                </Modal>
            )}
            <div id='template-container'>
                {selectedTemplateHeader === 0 ? (
                    <div className="section-container">
                        {sections.map((section, index) => (
                            <div 
                                key={index} 
                                className="template-section" 
                                onClick={() => toggleSection(section)}
                                onDragStart={() => handleSectionDragStart(index)}
                                onDragEnter={() => handleSectionDragEnter(index)}
                                onDragEnd={handleSectionDragEnd}
                                draggable
                            >
                                {sectionExpanded !== section.id ? (
                                    <>
                                        <div className='section-header'>
                                            {IconMap[section.icon] ? React.createElement(IconMap[section.icon]) : <StarOutlineSharp />}
                                            <h4>{section.name}</h4>
                                            {section.built_in === 1  && <p>(Built In)</p>}
                                        </div>
                                        <p>{section.description || section.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className='section-header far'>
                                            <h4>{section.name} Properties</h4>
                                            <Close onClick={closeSection} />
                                        </div>
                                        <div className='section-properties'>
                                            <div className='section-label'>
                                                <label htmlFor="name" className='section-floating-label'>Name & Icon</label>
                                                <div className="icon-option" onClick={handleIconClick}>
                                                    {IconMap[editingSection?.icon] ? React.createElement(IconMap[editingSection?.icon]) : <StarOutlineSharp />}
                                                </div>
                                                <input id='name' type="text" value={editingSection?.name} onChange={handleSectionPropertyChange} name="name" onBlur={handleSectionUpdate} />
                                            </div>
                                            <div className='section-label'>
                                                <label htmlFor="description" className='section-floating-label'>
                                                    Description
                                                </label>
                                                <textarea id='description' className="description-text" onChange={handleSectionPropertyChange} value={editingSection?.description ?? ""} name='description' onBlur={handleSectionUpdate} />
                                            </div>
                                            <div className='section-label'>
                                                <label htmlFor='order_id' className='section-floating-label'>
                                                    Order
                                                </label>
                                                <input id='order_id' type='number' onChange={handleSectionPropertyChange} value={editingSection?.order_id} name='order_id' onBlur={handleSectionUpdate} />
                                            </div>
                                        </div>
                                        <div className='section-fields'>
                                            <button className="action small" onClick={() => setAddingField(section.id)}>+ Field</button>
                                            {currentFields.length > 0 && currentSection === section.id &&
                                                currentFields.map((field, index) => {
                                                    if (index <= fieldLimit) {
                                                        return (
                                                            <div 
                                                                className='group-fields' 
                                                                key={field.id}
                                                                onMouseOver={() => handleMouseEnter(field.id)}
                                                                onMouseLeave={handleMouseLeave}
                                                            >
                                                                <h4>{field.name}</h4>
                                                                {fieldTypes.map((type, index) => {
                                                                    if (Number(type.id) === Number(field.field_id)) {
                                                                        return (
                                                                            <span className='subtext' key={index}>{type.name}</span>
                                                                        )
                                                                    }
                                                                })}
                                                                {field.id === hoveredField && (
                                                                    <div className='form-group middle' key={field.id}>
                                                                        {renderFieldInput(field)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                })
                                            }
                                            {currentFields.length > fieldLimit ? (
                                                <button className='action alt'onClick={() => setFieldLimit(currentFields.length)}>Show More Fields</button>
                                            ) : (currentFields.length > 0 && currentFields.length > 4 && 
                                                <button className='action alt'onClick={() => setFieldLimit(4)}>Show Less Fields</button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (selectedTemplateHeader === 1 ? (
                        <div className="phase-container">
                            <div className='phase-list'>
                                {phases.map((phase, index) => (
                                    <div 
                                        key={index} 
                                        className="template-phase far" 
                                        onDragStart={() => handleDragStart(index)}
                                        onDragEnter={() => handleDragEnter(index)}
                                        onDragEnd={handleDragEnd}
                                        draggable
                                    >
                                        <div className='phase-title' title={phase.description}>
                                            <h4>{phase.phase}</h4>
                                            {phase.phase === "Archived" ? <Archive size="15" color="var(--hover-color)"/> : <></>}
                                        </div>
                                        <div className='phase-actions'>
                                            <Edit onClick={() => {
                                                    setEditPhase(phase.id)
                                                    setPhaseData({ phase: phase.phase, description: phase.description, order_id: phase.order_id })
                                                }
                                            }/>
                                            <Trash2 onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete the ${phase.phase} phase?`)) {
                                                    deletePhase(phase.id);
                                                }
                                            }}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (selectedTemplateHeader === 2 ? (
                        <div className='vitals-container'>
                            <div className='vitals-list'>
                                <Vital vital='Case Type' description={'The type of case being managed. Value assigned during lead creation.'} />
                                <Vital vital='Intake Data' description={'The date the case was created. Value assigned during lead creation.'} />
                                <Vital vital='Intake Time' description={'The time the case was created. Value assigned during lead creation.'} />
                                <Vital vital='Intake User' description={'The user who created the case. Value assigned during lead creation.'} />
                                <Vital vital='Marketing Source' description={'The source of the lead. Value assigned during lead creation.'} />
                                <Vital vital='Referred By' description={'The person or company who referred the lead. Value assigned during lead creation.'} />
                                <Vital vital='DB Origination' description={'The Daly & Black employee who referred the lead. Value assigned during lead creation.'} />
                                
                            </div>
                        </div>
                    ) : (selectedTemplateHeader === 3 ? (
                        <FolderTreeManager 
                            templateId={defaultTemplate?.id} 
                            folders={folders}
                        />
                    ) : (selectedTemplateHeader === 4 ? (
                        <div className='marketing-source-container'>
                            {marketingSources.map((source, index) => (
                                <div key={index} className="marketing-source">
                                    <h4>{source.source_name}</h4>
                                    <p>{source.description}</p>
                                    <p>({source.marketing_type === '1' ? "Marketing Source" : source.marketing_type === '2' ? "Contact Source" : "Referral Source"})</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='lead-status-container'>
                            {statuses.map((status, index) => status.substatus === null && (
                                <div 
                                    key={index} 
                                    className={`lead-status${statusExpanded === status.id ? ' stacked' : ''}`}
                                    onClick={() => {
                                            setStatusExpanded(statusExpanded === status.id || statuses.reduce((acc, s) => acc += s.substatus === status.id ? 1 : 0, 0) === 0 ? null : status.id);
                                            console.log()
                                        }
                                    }
                                >
                                    <h4>{status.name}</h4>
                                    <p>{status.description}</p>
                                    {statusExpanded !== status.id && <p>Substatuses: {statuses.reduce((acc, s) => acc += s.substatus === status.id ? 1 : 0, 0)}</p>}
                                    {statusExpanded === status.id && (
                                        <div className='sub-statuses'>
                                            Substatuses:
                                            {statuses.map((substatus, index) => substatus.substatus === status.id && (
                                                <p className='subtext sub-status' key={index}>
                                                    {substatus.name}
                                                    <span>
                                                        {substatus.description ? `(${substatus.description})` : null} 
                                                    </span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                )))}
            </div>
            {addingField && (
                <Modal onClose={() => setAddingField(null)}>
                    <div className="new-template">
                        <h4>Add Field to Section</h4>
                        <div className="form-group">
                            <label htmlFor='field_type'>Select Field</label>
                            <select 
                                value={selectedField} 
                                onChange={(e) => setSelectedField(e.target.value)}
                                className="default-select"
                                name='field_type'
                            >
                                <option value="">Select a Field</option>
                                {currentFields.filter((field) => field.section_id === 0).map((field) => (
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
                                value={customFieldData.order_id || currentFields.length + 1} 
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
                                <label htmlFor='name'>Section Name & Icon</label>
                                <div className='section-label max'>
                                    <div className="icon-option" onClick={handleIconClick}>
                                        {IconMap[editingSection?.icon] ? React.createElement(IconMap[editingSection?.icon]) : <StarOutlineSharp />}
                                    </div>
                                    <input
                                        type="text" 
                                        placeholder="Section Name" 
                                        name="name" 
                                        value={sectionData.name}
                                        onChange={(e) => setSectionData({ ...sectionData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor='description'>Description</label>
                                <textarea placeholder="Section Description" name='description' value={sectionData.description} onChange={(e) => setSectionData({...sectionData, description: e.target.value })}/>
                            </div>
                            <button className="action" onClick={createNewSection}>{isSaving === 'section' ? <Loader2 className="spinner" /> : "Save Section"}</button>
                        </div>
                    ) : createNew === 'phase' ? (
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
                    ) : (createNew === 'vitals' ? (
                        <div className='new-template'>
                            <h4>Create New Vital</h4>
                            <div className='form-group'>
                                <label htmlFor='vital_name'>Vital Name</label>
                                <input type="text" id='vital_name' onChange={(e) => setVitalData({ ...vitalData, vital_name: e.target.value })} value={vitalData.vital_name} name='vital_name' placeholder="Vital Name"/>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='vital_field'>Vital Field</label>
                                <select className='default-select' onChange={(e) => setVitalData({ ...vitalData, vital_field: e.target.value })} value={vitalData.vital_field} >
                                    <option value=''>Select Vital Field</option>
                                    {currentFields.map(field => (
                                        <option key={field.id} value={field.id}>{field.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (createNew === 'folder' ? (
                            <div className='new-template'>
                                <h4>Create New Folder</h4>
                                <div className='form-group'>
                                    <label htmlFor='name'>Folder Name</label>
                                    <input type="text" placeholder="Folder Name" value={folderData.name} onChange={(e) => setFolderData({ ...folderData, name: e.target.value })}/>
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='parent_folder_id'>Parent Folder</label>
                                    <select
                                        className="default-select"
                                        value={folderData.parent_folder_id || ""}
                                        onChange={(e) => setFolderData({ ...folderData, parent_folder_id: e.target.value })}
                                    >
                                        <option value={0}>Root Folder</option>
                                        {folders.map(folder => (
                                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='folder_access'>Folder Access</label>
                                    <select
                                        className="default-select"
                                        value={folderData.folder_access}
                                        onChange={(e) => setFolderData({ ...folderData, folder_access: e.target.value })}
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="Protected">Protected</option>
                                    </select>
                                </div>
                                <button className="action" onClick={createFolder}>{isSaving === 'folder' ? <Loader2 className='spinner'/> : "Folder"}</button>
                            </div>
                        ) : (createNew === 'marketing' ? (
                            <div className='new-template'>
                                <h4>Create New Marketing Source</h4>
                                <div className='form-group'>
                                    <label htmlFor='source_name'>Source Name</label>
                                    <input type="text" id='source_name' onChange={(e) => setMarketingSource({ ...marketingSource, source_name: e.target.value })} value={marketingSource.source_name} name='source_name' placeholder="Source Name"/>
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='description'>Description</label>
                                    <textarea placeholder="Source Description"  onChange={(e) => setMarketingSource({ ...marketingSource, description: e.target.value })} value={marketingSource.description} />
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='source_type'>Source Type</label>
                                    <select className='default-select'  onChange={(e) => setMarketingSource({ ...marketingSource, marketing_type: e.target.value })} value={marketingSource.marketing_type} >
                                        <option value=''>Select Source Type</option>
                                        <option value='1'>Marketing Source</option>
                                        <option value='2'>Contact Source</option>
                                        <option value='3'>Referral Source</option>
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='order_id'>Order</label>
                                    <input type='number' placeholder='Order' onChange={(e) => setMarketingSource({ ...marketingSource, order_id: e.target.value})}/>
                                </div>
                                <button className="action" onClick={postMarketingSource}>Save New Source</button>
                            </div>
                        ) : (createNew === 'statuses' ? (
                            <div className='new-template'>
                                <h4>Create New Lead Status</h4>
                                <div className="form-group">
                                    <label htmlFor='status_name'>Status Name</label>
                                    <input type="text" placeholder="Status Name" value={statusData.name} onChange={(e) => setStatusData({ ...statusData, name: e.target.value })}/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor='status_name'>Status Description</label>
                                    <textarea placeholder="Status Description" value={statusData.description} onChange={(e) => setStatusData({ ...statusData, description: e.target.value })}/>
                                </div>
                                <button className="action" onClick={postStatuses}>Save Status</button>
                            </div>
                        ) : <></>
                    ))))}
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
                                title={iconKey}
                            >
                                {React.createElement(IconMap[iconKey])}
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
            {editPhase !== null && (
                <Modal onClose={() => {setEditPhase(null); setPhaseData({ phase: "", description: "", template_id: 0, order_id: 0 })}}>
                    <div className="new-template">
                        <h4>Edit Phase</h4>
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
                        <button className="action" onClick={updatePhase}>Save Phase</button>
                    </div>
                </Modal>  
            )}
        </div>
    );
};