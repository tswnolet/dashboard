import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { SearchBar } from "./Nav";
import { Download, File, FolderIcon, Trash, Upload, XCircle, Loader2, FolderPlus } from "lucide-react";
import '../styles/Library.css';
import Loading from "./Loading";
import { sort } from "d3";

export const FileUpload = ({ fetchFiles, currentPath }) => {
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showFolderInput, setShowFolderInput] = useState(false);
    const [fileConflict, setFileConflict] = useState(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [messageTimer, setMessageTimer] = useState(null);

    useEffect(() => {
        if (message) {
            clearTimeout(messageTimer);
            setMessageTimer(setTimeout(() => setMessage(""), 5000));
        }
    },[message]);

    const handleFileChange = (event) => {
        setFiles(Array.from(event.target.files));
    };

    const handleFolderChange = (event) => {
        setFiles(Array.from(event.target.files));
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const response = await fetch("https://dalyblackdata.com/api/create-folder.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderName: `${currentPath}/${newFolderName}` }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage(`Folder "${newFolderName}" created successfully!`);
                fetchFiles();
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setMessage("Failed to create folder. Try again.");
        }

        setNewFolderName("");
        setShowFolderInput(false);
    };

    const handleUpload = async (overwrite = false) => {
        if (files.length === 0) return setMessage("Please select a file or folder to upload.");

        setIsUploading(true);
        setMessage("");

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files[]", file);
            formData.append("filePaths[]", file.webkitRelativePath || file.name);
        });
        formData.append("folder", currentPath);
        if (overwrite) formData.append("overwrite", "true");

        try {
            const response = await fetch("https://dalyblackdata.com/api/upload-file.php", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.exists) {
                setFileConflict(data.fileName);
            } else {
                setMessage(data.success ? "Files uploaded successfully!" : `Error: ${data.error}`);
                fetchFiles();
                setFiles([]);
                fileInputRef.current.value = "";
                folderInputRef.current.value = "";
            }
        } catch (error) {
            setMessage("Upload failed. Please try again.");
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="file-upload-container">
            <h2>Upload Case Exhibit</h2>
            <div className="file-upload">
                <div className="upload-actions">
                    <input type="file" id="fileInput" ref={fileInputRef} onChange={handleFileChange} multiple hidden />
                    <label htmlFor="fileInput" className="action alt">Choose Files</label>

                    <input type="file" id="folderInput" ref={folderInputRef} onChange={handleFolderChange} webkitdirectory="true" multiple hidden />
                    <label htmlFor="folderInput" className="action alt">Choose Folder</label>
                </div>

                {showFolderInput ? (
                    <div className="folder-creation">
                        <input
                            type="text"
                            placeholder="Enter folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <button className="action" onClick={handleCreateFolder}>Create</button>
                        <button className="action alt" onClick={() => setShowFolderInput(false)}>Cancel</button>
                    </div>
                ) : (
                    <button className="action alt" onClick={() => setShowFolderInput(true)}>
                        <FolderPlus /> New Folder
                    </button>
                )}

                {files.length > 0 && (
                    <div className="file-list">
                        {files.map((file, index) => index < 5 && (
                            <span key={index}>{file.webkitRelativePath || file.name}</span>
                        ))}
                    </div>
                )}

                <button className="action upload-button" onClick={() => handleUpload(false)} disabled={isUploading}>
                    {isUploading ? <Loader2 className="spinner" /> : "Upload"}
                </button>
            </div>
            {message && <p>{message}</p>}

            {fileConflict && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>File Conflict</h3>
                        <p>"{fileConflict}" already exists in this folder. What would you like to do?</p>
                        <button className="action" onClick={() => handleUpload(true)}>Overwrite</button>
                        <button className="action alt" onClick={() => setFileConflict(null)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const FileList = () => {
    const [files, setFiles] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [more, setMore] = useState(null);
    const [currentFolder, setCurrentFolder] = useState("Exhibits");
    const [activeFile, setActiveFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [minimizeUpload, setMinimizeUpload] = useState(true);
    const menuRef = useRef(null);
    const exhibitRef = useRef(null);
    const [expanded, setExpanded] = useState(true);
    const [fetchingFiles, setFetchingFiles] = useState(false);

    const fetchFiles = async (folder = "") => {
        setFetchingFiles(true);
        try {
            const response = await fetch(`https://dalyblackdata.com/api/list-files.php?folder=${folder}&time=${new Date().getTime()}`);
            const data = await response.json();
            setFiles(sortFiles([...data]));
            setFilteredFiles(sortFiles([...data]));
        } catch (error) {
            console.error("Error fetching files:", error);
        }
        setFetchingFiles(false);
    };

    useEffect(() => {
        if (!searchQuery) {
            setFilteredFiles(files);
        } else {
            const filtered = files.filter(file => 
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFiles(filtered);
        }
    }, [searchQuery, files]);

    useEffect(() => { fetchFiles(currentFolder); }, [currentFolder]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMore(null);
            if (exhibitRef.current && !exhibitRef.current.contains(event.target)) setActiveFile(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const sortFiles = (fileList) => {
        return fileList.sort((a, b) => {
            if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
            const isAscending = sortConfig.direction === "asc" ? 1 : -1;
            if (a[sortConfig.key] < b[sortConfig.key]) return -isAscending;
            if (a[sortConfig.key] > b[sortConfig.key]) return isAscending;
            return 0;
        });
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
        setFiles(sortFiles([...files]));
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
    
    const handleFolderDownload = async (folderName) => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/list-folder.php?folder=${folderName}`);
            const fileList = await response.json();

            const zip = new JSZip();

            for (const file of fileList) {
                const fileResponse = await fetch(file.url);
                const fileBlob = await fileResponse.blob();
                zip.file(file.name, fileBlob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipUrl = window.URL.createObjectURL(zipBlob);

            const link = document.createElement("a");
            link.href = zipUrl;
            link.setAttribute("download", `${folderName}.zip`);
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(zipUrl);
        } catch (error) {
            console.error("Folder download error:", error);
        }
    };

    const handleDelete = async (file) => {
        try {
            const requestBody = file.isFolder 
                ? { folderPath: file.path } 
                : { fileKey: file.fileKey };
    
            const response = await fetch("https://dalyblackdata.com/api/list-files.php", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
    
            const data = await response.json();
            if (data.success) {
                setFiles((prevFiles) => prevFiles.filter(f => 
                    file.isFolder ? f.path !== file.path : f.fileKey !== file.fileKey
                ));
            } else {
                console.error("Error deleting:", data.error);
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };      

    const handleFolderClick = (folderPath) => {
        setCurrentFolder(folderPath);
        setFiles([]);
        fetchFiles(folderPath);
    };

    const handleBackClick = () => {
        const parentFolder = currentFolder.split("/").slice(0, -1).join("/");
        setCurrentFolder(parentFolder);
        setFiles([]);
        fetchFiles(parentFolder);
    };

    const formatSize = (size) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
        return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };

    const handleDoubleClick = async (file) => {
        if (file.isFolder) {
            handleFolderClick(file.path);
            return;
        }

        const fileType = file.name.split('.').pop().toLowerCase();
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (["png", "jpg", "jpeg", "gif"].includes(fileType)) {
                setFilePreview(<img src={url} alt={file.name} />);
            } else if (["txt", "csv", "json"].includes(fileType)) {
                const text = await blob.text();
                setFilePreview(<pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{text}</pre>);
            } else if (fileType === "pdf") {
                setFilePreview(<iframe src={url} style={{ width: "100%", height: "500px" }} />);
            } else if (["doc", "docx", "xls", "xlsx"].includes(fileType)) {
                setFilePreview(
                    <iframe
                        src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.url)}`}
                    />
                );
            } else {
                setFilePreview(<p>Preview not available for this file type.</p>);
            }
        } catch (error) {
            console.error("Error loading preview:", error);
        }
    };

    const formatDate = (date) => {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const dateObject = new Date(date);
        return [months[dateObject.getMonth()] + " " + dateObject.getDate() + ", " + dateObject.getFullYear(), dateObject.toLocaleString()];
    };

    return (
        <div className="page-container case-library">
            <div id='page-header'>
                <h2>Case Library</h2>
            </div>
            <SearchBar expanded={expanded} setExpanded={setExpanded} setSearchQuery={setSearchQuery}/>
            {!minimizeUpload ? (
                <FileUpload fetchFiles={fetchFiles} currentPath={currentFolder} />
            ) : (
                <></>
            )}
            <button className='action' onClick={() => setMinimizeUpload(prev => !prev)}>
                {minimizeUpload ? <>Upload <Upload /></> : 'Close Upload'}
            </button>
            {currentFolder !== 'Exhibits' && (
                <button onClick={handleBackClick} className="action alt">Back</button>
            )}
            {!fetchingFiles ? (
                <table className='exhibits'>
                    <thead>
                        <tr>
                            <th className='file-name' onClick={() => requestSort('name')}>Name</th>
                            <th className='file-date' onClick={() => requestSort('lastModified')}>Last Modified</th>
                            <th className='file-size' onClick={() => requestSort('size')}>Size</th>
                            <th className='file-actions'>Actions</th>
                        </tr>
                    </thead>
                    <tbody ref={exhibitRef}>
                        {filteredFiles.map((file, index) => (
                            <tr key={index} className={`exhibit${activeFile === index ? ' active-file' : ''}`}
                                onClick={() => setActiveFile(index)}
                                onDoubleClick={() => handleDoubleClick(file)}>
                                <td className='file-name'>{file.isFolder ? <FolderIcon /> : <File />} {file.name}</td>
                                <td className='file-date' title={file.lastModified ? formatDate(file.lastModified)[1] : '-'}>{file.lastModified ? formatDate(file.lastModified)[0] : '-'}</td>
                                <td className='file-size'>{!file.isFolder ? formatSize(file.size) : `${file.size || 0} items`}</td>
                                <td className='file-actions subtext'>
                                    <span className='file-actions-dots' onClick={(e) => { e.stopPropagation(); setMore(more === index ? null : index); }}>...</span>
                                    {more === index && (
                                        <div className='file-actions-menu' ref={menuRef}>
                                            <span className='file-actions-menu-child' onClick={() => handleDownload(file)}>
                                                <span>Download</span><Download />
                                            </span>
                                            <span className="file-actions-menu-child" onClick={() => { handleDelete(file); setMore(null); }}>
                                                <span>Delete</span><Trash />
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                        {filePreview && (
                        <>
                            <div className='modal-overlay'></div>
                            <div className="file-preview">
                                <button className="close-preview action alt" onClick={() => setFilePreview(null)}>
                                    <XCircle />
                                </button>
                                {filePreview}
                            </div>
                        </>
                    )}
                </table>
            ) : (
                <div className="exhibits">
                    <Loading />
                </div>
            )}


        </div>
    );
};