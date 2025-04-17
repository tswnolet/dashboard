import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ChevronRight, Download, File as FileSvg, FolderOpenIcon, FolderPlus, Pencil, Trash, Upload, X } from "lucide-react";
import { SearchBar } from "./Nav";
import { Checkbox, Dropdown, FolderUpload, MultiFile } from "./FieldComponents";
import Modal from "./Modal";
import { Folder } from "@mynaui/icons-react";

const CreateFolder = ({ folderName, setFolderName, onClick=(() => {}) }) => {
    return (
        <Modal
            title="Create Folder"
            instructions="Enter a name for the new folder."
            onClose={onClick}
            footer={
                <div className='modal-footer-actions'>
                    <button onClick={onClick} className="action">Create</button>
                    <button onClick={onClick} className="action alt">Cancel</button>
                </div>
            }
        >
            <div className='modal-content-wrapper'>
                <div className='form-group mid'>
                    <label className="subtext">Folder Name</label>
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Enter folder name"
                    />
                </div>
            </div>
        </Modal>
    );
};

export const DocumentSection = ({ fetchDocuments, case_id, user_id, folderName, files, subfolders, caseName, onFolderClick, onBreadcrumbClick, setDocNav, docNav }) => {
    const hasSubfolders = Object.keys(subfolders).length > 0;
    const filteredFiles = files.filter(file => file.name !== "(Folder)");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("");
    const [multiFiles, setMultiFiles] = useState(null);
    const [folderFiles, setFolderFiles] = useState(null);
    const [uploadWaiting, setUploadWaiting] = useState(false);
    const [activeFile, setActiveFile] = useState(null);
    const [more, setMore] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [filesToRename, setFilesToRename] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [createFolder, setCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
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
    
        const formData = new FormData();
        formData.append("case_id", case_id);
        formData.append("target_path", folderName);
        formData.append("user_id", user_id);
    
        for (let item of filesToRename) {
            const renamedFile = new File(
                [item.file],
                `${item.newName}.${item.extension}`,
                { type: item.file.type }
            );
    
            formData.append("file[]", renamedFile);
            formData.append("relative_paths[]", item.file.webkitRelativePath || renamedFile.name);
        }
    
        try {
            const response = await fetch("https://api.casedb.co/documents.php", {
                method: "POST",
                body: formData,
            });
    
            const result = await response.json();
            if (!result.success) {
                console.warn("Some files failed to upload:", result.message);
            }
        } catch (error) {
            console.error("Upload error:", error);
        }
    
        fetchDocuments();
        setUploadWaiting(false);
        setShowRenameModal(false);
        setFilesToRename([]);
    };

    const createFolderOnS3 = async ({ caseId, folderName, currentPath }) => {
        const fullPath = `cases/${caseId}/{{Name}}/${currentPath ? currentPath + '/' : ''}${folderName}/`;
    
        try {
            const response = await fetch('https://api.casedb.co/documents.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_id: caseId,
                    path: fullPath
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating folder:', error);
            return { success: false, message: error.message };
        }
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

    const handleBulkDownload = async () => {
        if (selectedKeys.length === 0) return;
    
        try {
            const response = await fetch('https://api.casedb.co/documents.php?zip=1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    keys: selectedKeys, 
                    case_id: case_id
                }),
            });
    
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'documents.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Bulk download error:", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedKeys.length === 0) return;
    
        if (window.confirm(`Are you sure you want to delete ${selectedKeys.length} item(s)?`)) {
            try {
                const response = await fetch('https://api.casedb.co/documents.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keys: selectedKeys })
                });
    
                const result = await response.json();
                if (result.success) {
                    fetchDocuments();
                    setSelectedKeys([]);
                } else {
                    console.error("Delete error:", result.message);
                }
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    const normalizeFolderKey = (caseId, folderName, subfolderName = '') => {
        const base = `cases/${caseId}/{{Name}}`;
        const cleanedFolderName = folderName.replace(/^{{Name}}\/?|\/?{{Name}}$/g, '').replace(/\/+/g, '');
        const prefix = cleanedFolderName ? `${base}/${cleanedFolderName}` : base;
        return `${prefix}/${subfolderName ? `${subfolderName}/` : ''}`;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMore(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setMultiFiles(null);
        setFolderFiles(null);
    }, [folderName]);
    

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
                    value={multiFiles}
                    onChange={setMultiFiles}
                    lead_id={case_id}
                    upload={() => handleFileSet(multiFiles)}
                    uploadWaiting={uploadWaiting}
                />
                <FolderUpload
                    value={folderFiles}
                    onChange={setFolderFiles}
                    lead_id={case_id}
                    upload={() => handleFileSet(folderFiles)}
                    uploadWaiting={uploadWaiting}
                />
                <button className='action tertiary' onClick={() => setCreateFolder(true)}><FolderPlus /></button>
                {createFolder && 
                    <CreateFolder 
                        folderName={newFolderName} 
                        setFolderName={setNewFolderName}
                        onClick={() => {
                            setCreateFolder(false);
                            createFolderOnS3({ caseId: case_id, folderName: newFolderName, currentPath: folderName.replace('{{Name}}', '') });
                        }} 
                    />
                }
                {selectedKeys.length > 0 && (
                    <>
                        <button className="action" onClick={handleBulkDelete}>
                            Delete
                        </button>
                        <button className="action alt" onClick={handleBulkDownload}>
                            Download Selected
                        </button>
                    </>
            )}
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
                                <div key={`${idx}-${item}`} className="form-group">
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
                        <thead style={{ width: '100%' }}>
                            <tr>
                                <th className='file-name'>
                                    <div className='file-select'>
                                        <Checkbox
                                            value={
                                                filteredFiles.length + Object.keys(subfolders).length > 0 &&
                                                selectedKeys.length === filteredFiles.length + Object.keys(subfolders).length
                                            }
                                            onChange={() => {
                                                const folderKeys = Object.keys(subfolders).map(
                                                    subfolderName => normalizeFolderKey(case_id, folderName, subfolderName)
                                                );

                                                const fileKeys = filteredFiles.map(file => file.key);
                                                const allKeys = [...folderKeys, ...fileKeys];

                                                const allSelected = allKeys.every(key => selectedKeys.includes(key));
                                                setSelectedKeys(allSelected ? [] : allKeys);
                                            }}
                                            mini
                                        />
                                    </div>
                                    Name
                                </th>
                                <th className='file-date'>Last Modified</th>
                                <th className='file-size'>Size</th>
                                <th className='file-actions'>...</th>
                            </tr>
                        </thead>
                        <tbody style={{ width: '100%' }}>
                            {hasSubfolders && Object.keys(subfolders).map((subfolderName, index) => {
                                const folderKey = normalizeFolderKey(case_id, folderName, subfolderName);

                                return (
                                    <tr 
                                        key={`sub-${index}`} 
                                        onClick={() => {
                                            const alreadySelected = selectedKeys.includes(folderKey);
                                            const newKeys = alreadySelected
                                                ? selectedKeys.filter(k => k !== folderKey)
                                                : [...selectedKeys, folderKey];

                                            setSelectedKeys(newKeys);
                                            setActiveFile(prev => prev !== `${index}sub` ? `${index}sub` : null);
                                        }}
                                        onDoubleClick={() => onFolderClick && onFolderClick(subfolderName)} 
                                        className={`exhibit ${`${index}sub` === activeFile ? 'active-file' : ''}`}>
                                        <td className='file-name folder subtext'>
                                            <div className='file-select'>
                                                <Checkbox
                                                    value={selectedKeys.includes(folderKey)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const alreadySelected = selectedKeys.includes(folderKey);
                                                        const newKeys = alreadySelected
                                                            ? selectedKeys.filter(k => k !== folderKey)
                                                            : [...selectedKeys, folderKey];
                                                        setSelectedKeys(newKeys);
                                                    }}
                                                    mini
                                                />
                                            </div>
                                            <FolderOpenIcon size={16} style={{ marginRight: 6 }} />
                                            {subfolderName.length > 65 ? `${String(subfolderName).split(".")[0].slice(0, 35)}(...)` : subfolderName}
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
                                                        <span>Rename</span><Pencil />
                                                    </span>
                                                    <span className="file-actions-menu-child" onClick={() => {}}>
                                                        <span>Delete</span><Trash />
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredFiles.map((file, index) => (
                                <tr 
                                    key={`file-${index}`} 
                                    onClick={() => {
                                        const alreadySelected = selectedKeys.includes(file.key);
                                        const newKeys = alreadySelected
                                            ? selectedKeys.filter(k => k !== file.key)
                                            : [...selectedKeys, file.key];

                                        setSelectedKeys(newKeys);
                                        setActiveFile(prev => prev !== index ? index : null)}
                                    }
                                    className={`exhibit ${index === activeFile ? 'active-file' : ''}`}
                                >
                                    <td className='file-name subtext'>
                                        <div className='file-select'>
                                            <Checkbox
                                                value={selectedKeys.includes(file.key)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    const alreadySelected = selectedKeys.includes(file.key);
                                                    const newKeys = alreadySelected
                                                        ? selectedKeys.filter(k => k !== file.key)
                                                        : [...selectedKeys, file.key];
                                                    setSelectedKeys(newKeys);
                                                }}
                                                mini
                                            />
                                        </div>
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
                                                <span className="file-actions-menu-child" onClick={() => {}}>
                                                    <span>Rename</span><Pencil />
                                                </span>
                                                <span className="file-actions-menu-child" onClick={() => {}}>
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