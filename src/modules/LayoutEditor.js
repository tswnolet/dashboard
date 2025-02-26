import React, { useState, useEffect } from 'react';
import '../styles/LayoutEditor.css';
import { Check, StarOutlineSharp, StarSharp } from '@mui/icons-material';
import Modal from './Modal';

export const LayoutEditor = () => {
    const [layout, setLayout] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [createTemplate, setCreateTemplate] = useState(false);
    const [defaultClicked, setDefaultClicked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        aka: '',
        description: '',
        visibility: 0,
        default: 0,
        favorite: 0
    });
    const [defaultTemplate, setDefaultTemplate] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async (template) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/layout.php${template ? `?template=${template}` : ''}`);
            const data = await response.json();
            setTemplates(data.templates ? data.templates : []);
            const defaultTemplate = data.templates.find(template => template.default === "1");
            if (defaultTemplate) {
                setDefaultTemplate(defaultTemplate.id);
            }
            console.log('Layout fetched:', data);
        } catch (error) {
            console.error('Error fetching layout:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCheckboxChange = (name) => {
        setFormData(prevState => ({
            ...prevState,
            [name]: prevState[name] === 1 ? 0 : 1
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://dalyblackdata.com/api/layout.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setCreateTemplate(false);
                fetchTemplates();
            } else {
                console.error('Error creating template:', data.message);
            }
        } catch (error) {
            console.error('Error creating template:', error);
        }
    };

    return (
        <div className="page-container">
            <header className="editor-header">
                <h2>Layout Editor</h2>
                <select 
                    onChange={(e) => fetchTemplates(e.target.value)} 
                    disabled={templates.length === 0} 
                    className="default-select"
                    value={defaultTemplate}
                >
                    <option value="" disabled>Select a template</option>
                    {templates.map((template, index) => (
                        <option key={index} value={template.id}>
                            {template.name}
                        </option>
                    ))}
                </select>
                <button className="action" onClick={() => setCreateTemplate(true)}>New Template</button>
            </header>

            {createTemplate && (
                <Modal onClose={() => setCreateTemplate(false)}>
                    <div className="new-template">
                        <h4>Create New Case Template</h4>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="aka">Nickname</label>
                                <input 
                                    type="text" 
                                    id="aka" 
                                    name="aka" 
                                    value={formData.aka} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="form-group">
                                <div className='visibility-container'>
                                    <label htmlFor="visibility">Visibility</label>
                                    <select 
                                        id="visibility" 
                                        name="visibility" 
                                        className='default-select' 
                                        value={formData.visibility} 
                                        onChange={handleInputChange}
                                    >
                                        <option value={0}>Private</option>
                                        <option value={1}>Public</option>
                                    </select>
                                </div>
                                <div className='default-container'>
                                    <label htmlFor="default">Default</label>
                                    <input 
                                        type="checkbox" 
                                        id="default" 
                                        name="default"
                                        checked={formData.default === 1} 
                                        onChange={() => handleCheckboxChange('default')}
                                        style={{display: 'none'}}
                                    />
                                    <div className={`checkbox ${formData.default === 1 ? 'checked' : ''}`} onClick={() => handleCheckboxChange('default')}>{formData.default === 1 ? <Check /> : ""}</div>
                                </div>
                                <div className='favorite-container'>
                                    <label htmlFor="favorite">Favorite</label>
                                    <input 
                                        type="checkbox"
                                        id="favorite"
                                        name="favorite"
                                        checked={formData.favorite === 1}
                                        onChange={() => handleCheckboxChange('favorite')}
                                        style={{display: 'none'}}
                                    />
                                    <div className={`favorite${formData.favorite === 1 ? 'd' : ''}`} onClick={() => handleCheckboxChange('favorite')}>{formData.favorite === 1 ? <StarSharp /> : <StarOutlineSharp />}</div>
                                </div>
                            </div>
                            <button type="submit" className="action">Save Template</button>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
};