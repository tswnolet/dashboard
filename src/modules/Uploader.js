import React, { useState } from 'react';
import { handleFileUpload } from "../utils";

export const Uploader = ({ setFile, setLeads, handleFileChange }) => {
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        const uploadedFile = event.dataTransfer.files[0];
        setFileName(uploadedFile.name);
        handleFileUpload({ target: { files: [uploadedFile] } }, setFile, setLeads);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (event) => {
        if (event.target === event.currentTarget) {
            setDragging(false);
        }
    };

    const handleChange = (event) => {
        handleFileChange(event);
        setFileName(event.target.files[0]?.name || '');
    };

    return (
        <>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className='file-upload'
            >
                {dragging ? "Drop the file here..." : (fileName || "Drag and drop a file here or click to upload")}
                <label>
                    <input 
                        type="file" 
                        onChange={handleChange} 
                        accept=".csv,.xlsx" 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    />
                    {fileName ? 'Change file' : "Choose a file"}
                </label>
            </div>
        </>
    );
}