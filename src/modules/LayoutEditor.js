import React, { useState, useEffect } from 'react';

export const LayoutEditor = () => {
    const [layout, setLayout] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [createTemplate, setCreateTemplate] = useState(false);

    useEffect(() => {
        fetchTemplate();
    }, []);

    const fetchTemplate = async (template) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/layout.php${template ? `?template=${template}` : ''}`);
            const data = await response.json();
            setTemplates(data.templates ? data.templates : []);
            console.log('Layout fetched:', data);
        } catch (error) {
            console.error('Error fetching layout:', error);
        }
    };

    return (
        <div className='page-container'>
            <header>
                <h2>Layout Editor</h2>
                <select onChange={(e) => fetchTemplate(e.target.value)} disabled={templates.length > 0}>
                    Select
                    <option value='' disabled>Select a template</option>
                    {templates.map((template, index) => (
                        <option key={index} value={template}>{template}</option>
                    ))}
                </select>
                <button className='action' onClick={() => setCreateTemplate(true)}>Create New Template</button>
            </header>
        </div>
    );
}