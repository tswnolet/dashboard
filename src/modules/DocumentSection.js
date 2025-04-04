import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ChevronRight, Download, File as FileSvg, FolderOpenIcon, Trash, Upload, X } from "lucide-react";
import { SearchBar } from "./Nav";
import { Dropdown, MultiFile } from "./FieldComponents";
import Modal from "./Modal";

export const DocumentSection = ({ fetchDocuments, case_id, user_id, folderName, files, subfolders, caseName, onFolderClick, onBreadcrumbClick, setDocNav, docNav }) => {
    const hasSubfolders = Object.keys(subfolders).length > 0;
    const filteredFiles = files.filter(file => file.name !== "(Folder)");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("");
    const [uploadingFile, setUploadingFile] = useState(null);
    const [uploadWaiting, setUploadWaiting] = useState(false);
    const [activeFile, setActiveFile] = useState(null);
    const [more, setMore] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [filesToRename, setFilesToRename] = useState([]);
    const menuRef = useRef(null);

    const formatSize = (size) => {
        if (!size) return "0 KB";
        return size < 1024
            ? `${size} B`
            : size < 1024 * 1024
            ? `${(size / 1024).toFixed(1)} KB`
            : `${(size / 1024 / 1024).toFixed(1)} MB`;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const folderParts = folderName.split('/');

    const getItemCount = (folder) => {
        let count = 0;
    
        if (!folder || typeof folder !== 'object') return 0;
    
        for (const [key, value] of Object.entries(folder)) {
            if (key === '__files') {
                if (Array.isArray(value)) {
                    count += value.filter(file => file.name !== "(Folder)").length;
                }
            } else if (typeof value === 'object' && value !== null) {
                count += 1;
                count += getItemCount(value);
            }
        }
    
        return count;
    };

    const handleFileSet = (files) => {
        if (!files || files.length === 0) return;
    
        const fileList = Array.from(files).map(file => {
            const originalName = file.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const extension = originalName.split('.').pop();
    
            return { file, originalName, nameWithoutExt, extension, newName: nameWithoutExt };
        });
    
        setFilesToRename(fileList);
        setShowRenameModal(true);
    };

    const uploadRenamedFiles = async () => {
        setUploadWaiting(true);
    
        for (let item of filesToRename) {
            const renamedFile = new File(
                [item.file],
                `${item.newName}.${item.extension}`,
                { type: item.file.type }
            );
    
            const formData = new FormData();
            formData.append("case_id", case_id);
            formData.append("target_path", folderName);
            formData.append("user_id", user_id);
            formData.append("file", renamedFile);
    
            try {
                const response = await fetch("https://api.casedb.co/documents.php", {
                    method: "POST",
                    body: formData,
                });
    
                const result = await response.json();
                if (!result.success) {
                    console.warn(`Upload failed for ${item.originalName}: ${result.message}`);
                }
            } catch (error) {
                console.error("Upload error:", error);
            }
        }
    
        fetchDocuments();
        setUploadWaiting(false);
        setShowRenameModal(false);
        setFilesToRename([]);
    };

    const handleDownload = async (file) => {
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", file.name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMore(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="document-section">
            <div className="document-filters">
                <div className='form-box alt' onClick={() => setDocNav((prev) => !prev)}>
                    <ChevronRight size={16} style={{ transform: docNav ? 'rotate(180deg)' : 'rotate(0deg)'}}/>
                </div>
                <SearchBar placeholder="Search files..." expanded={true} setExpanded={() =>{}} setSearchQuery={setSearchQuery} />
                <Dropdown
                    options={["All", "Images", "Documents", "Audio", "Video"]}
                    value={searchType}
                    onChange={(value) => setSearchType(value)}
                    placeholder="Filter Search"
                    expanded={false}
                />
                <MultiFile
                    value={uploadingFile}
                    onChange={setUploadingFile}
                    lead_id={case_id}
                    upload={() => handleFileSet(uploadingFile)}
                    uploadWaiting={uploadWaiting}
                />
            </div>
            {showRenameModal && (
                <Modal
                    title="Rename Files"
                    instructions="Follow DB naming conventions."
                    onClose={() => setShowRenameModal(false)}
                    header={
                        <div className='modal-header-actions'>
                            <button onClick={uploadRenamedFiles} className="action">Upload</button>
                            <button onClick={() => setShowRenameModal(false)} className="action alt">Cancel</button>
                        </div>
                    }
                >
                    <div className='modal-content-wrapper'>
                        <div className='rename-files'>
                            {filesToRename.map((item, idx) => (
                                <div key={idx} className="form-group">
                                    <label className="subtext">{item.originalName}</label>
                                    <div className='file-rename-container'>
                                        <input
                                            type="text"
                                            value={item.newName}
                                            placeholder={item.originalName}
                                            onChange={(e) => {
                                                const updated = [...filesToRename];
                                                updated[idx].newName = e.target.value;
                                                setFilesToRename(updated);
                                            }}
                                        />
                                        <span className="subtext" style={{ paddingBottom: "5px"}}>.{item.extension}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}
            <div className="subtext document-breadcrumbs">
                {folderParts.map((part, index) => {
                    const isLast = index === folderParts.length - 1;
                    const path = folderParts.slice(0, index + 1).join('/');
                    return (
                        <>
                            {index > 0 && <ChevronRight size={16}/>}
                            <span
                                style={{ cursor: isLast ? 'default' : 'pointer', color: isLast ? 'inherit' : 'var(--primary-color)' }}
                                onClick={() => !isLast && onBreadcrumbClick && onBreadcrumbClick(path)}
                                key={index}
                            >
                                {part === "{{Name}}" ? caseName : part}
                            </span>
                        </>
                    );
                })}
            </div>
            <div className="document-content">
                {(hasSubfolders || filteredFiles.length > 0) ? (
                    <table className="exhibits">
                        <thead>
                            <tr>
                                <th className='file-name'>Name</th>
                                <th className='file-date'>Last Modified</th>
                                <th className='file-size'>Size</th>
                                <th className='file-actions'>...</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasSubfolders && Object.keys(subfolders).map((subfolderName, index) => (
                                <tr key={`sub-${index}`} onClick={() => setActiveFile(prev => prev !== `${index}sub` ? `${index}sub` : null)} onDoubleClick={() => onFolderClick && onFolderClick(subfolderName)} className={`exhibit ${`${index}sub` === activeFile ? 'active-file' : ''}`}>
                                    <td className='file-name folder subtext'>
                                        <FolderOpenIcon size={16} style={{ marginRight: 6 }} />
                                        {subfolderName}
                                    </td>
                                    <td className='file-date folder subtext'>-</td>
                                    <td className="file-size folder subtext">
                                        {getItemCount(subfolders[subfolderName])} item{getItemCount(subfolders[subfolderName]) !== 1 ? 's' : ''}
                                    </td>
                                    <td className='file-actions subtext'>
                                        <span className='file-actions-dots' onClick={(e) => { e.stopPropagation(); setMore(more === `${index}sub` ? null : `${index}sub`); }}>...</span>
                                        {more === `${index}sub` && (
                                            <div className='file-actions-menu' ref={menuRef}>
                                                <span className='file-actions-menu-child' onClick={() => handleDownload(subfolderName)}>
                                                    <span>Download</span><Download />
                                                </span>
                                                <span className="file-actions-menu-child" onClick={() => {}}>
                                                    <span>Delete</span><Trash />
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.map((file, index) => (
                                <tr key={`file-${index}`} onClick={() => setActiveFile(prev => prev !== index ? index : null)} className={`exhibit ${index === activeFile ? 'active-file' : ''}`}>
                                    <td className='file-name subtext'>
                                        <FileSvg size={16} style={{ marginRight: 6 }} />
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" title={file.name} className="subtext">{file.name.length > 35 ? `${String(file.name).split(".")[0].slice(0, 35)}(...).${String(file.name).split(".")[1]}` : file.name}</a>
                                    </td>
                                    <td className='file-date subtext'>{file.last_modified ? formatDate(file.last_modified) : "-"}</td>
                                    <td className='file-size subtext'>{formatSize(file.size)}</td>
                                    <td className='file-actions subtext'>
                                        <span className='file-actions-dots' onClick={(e) => { e.stopPropagation(); setMore(more === index ? null : index); }}>...</span>
                                        {more === index && (
                                            <div className='file-actions-menu' ref={menuRef}>
                                                <span className='file-actions-menu-child' onClick={() => handleDownload(file)}>
                                                    <span>Download</span><Download />
                                                </span>
                                                <span className="file-actions-menu-child" onClick={() => console.log(file)}>
                                                    <span>Delete</span><Trash />
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="subtext">This folder is empty.</p>
                )}
            </div>
        </div>
    );
};