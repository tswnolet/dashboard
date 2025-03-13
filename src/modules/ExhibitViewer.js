import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { SearchBar } from "./Nav";
import { Download, File, FolderIcon, Trash, Upload } from "lucide-react";
import { Paper } from "@mui/material";
import '../styles/Library.css';
import Loading from "./Loading";

export const FileUpload = ({ fetchFiles, currentPath }) => {
    const [files, setFiles] = useState([]);
    const [message, setMessage] = useState("");
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
    };

    const handleFolderChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
    };

    const handleUpload = async () => {
        if (files.length === 0) return setMessage("Please select a file or folder to upload.");

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files[]", file);
            formData.append("filePaths[]", file.webkitRelativePath || file.name);
        });
        formData.append("folder", currentPath);

        const response = await fetch("https://dalyblackdata.com/api/upload-file.php", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
            setMessage(`Files uploaded successfully!`);
            fetchFiles();
            setFiles([]);
            fileInputRef.current.value = "";
            folderInputRef.current.value = "";
        } else {
            setMessage(`Error: ${data.error}`);
        }
    };

    return (
        <div className="file-upload-container">
            <h2>Upload Case Exhibit</h2>
            <div className="file-upload">
                <input
                    type="file"
                    id="fileInput"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    hidden
                />
                <label htmlFor="fileInput" className="action alt">Choose Files</label>
                <input
                    type="file"
                    id="folderInput"
                    ref={folderInputRef}
                    onChange={handleFolderChange}
                    webkitdirectory="true"
                    multiple
                    hidden
                />
                <label htmlFor="folderInput" className="action alt">Choose Folder</label>

                <button className="action" onClick={handleUpload}>Upload</button>
            </div>
            {message && <p>{message}</p>}
        </div>
    );
};

export const FileList = () => {
    const [files, setFiles] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const [more, setMore] = useState(null);
    const [currentFolder, setCurrentFolder] = useState("Exhibits");
    const [activeFile, setActiveFile] = useState(null);
    const [minimizeUpload, setMinimizeUpload] = useState(true);
    const menuRef = useRef(null);
    const exhibitRef = useRef(null);

    const fetchFiles = async (folder = "") => {
        try {
            const response = await fetch(`https://dalyblackdata.com/api/list-files.php?folder=${folder}&time=${new Date().getTime()}`);
            const data = await response.json();
            setFiles(sortFiles([...data])); 
        } catch (error) {
            console.error("Error fetching files:", error);
        }
    };

    useEffect(() => { fetchFiles(currentFolder); }, [currentFolder]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMore(null);
            if (exhibitRef.current && !exhibitRef.current.contains(event.target)) setActiveFile(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDownload = async (file) => {
        if (file.isFolder) {
            await handleFolderDownload(file.name);
        } else {
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
            const response = await fetch(`https://dalyblackdata.com/api/list-files.php`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fileKey: file.fileKey, isFolder: file.isFolder }),
            });
    
            const data = await response.json();
            if (data.success) {
                setFiles(prevFiles => prevFiles.filter(f => f.fileKey !== file.fileKey));
            } else {
                console.error("Error deleting:", data.error);
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };    

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
    
    return (
        <div className="page-container case-library">
            <div id='page-header'>
                <h2>Case Library</h2>
            </div>

            {!minimizeUpload ? (
                <FileUpload fetchFiles={fetchFiles} currentPath={currentFolder} />
            ) : (
                <></>
            )}
            <button className='action' onClick={() => setMinimizeUpload(prev => !prev)}>
                {minimizeUpload ? <>Upload <Upload /></> : 'Close Upload'}
            </button>
            {currentFolder != 'Exhibits' && (
                <button onClick={handleBackClick} className="action alt">Back</button>
            )}
            {files.length > 0 ? (
                <table className='exhibits'>
                    <thead>
                        <tr>
                            <th className='file-name' onClick={() => requestSort("name")}>Name</th>
                            <th className='file-date' onClick={() => requestSort("lastModified")}>Last Modified</th>
                            <th className='file-size' onClick={() => requestSort("size")}>Size</th>
                            <th className='file-storage'>Storage Class</th>
                            <th className='file-actions'>Actions</th>
                        </tr>
                    </thead>
                    <tbody ref={exhibitRef}>
                        {files.map((file, index) => (
                            <tr key={index} className={`exhibit${activeFile === index ? ' active-file' : ''}`} onClick={() => setActiveFile(index)} onDoubleClick={() => file.isFolder ? handleFolderClick(file.path) : handleDownload(file)}>
                                <td className='file-name'>{file.isFolder ? <FolderIcon /> : <File />} {file.name}</td>
                                <td className='file-date'>{file.lastModified}</td>
                                <td className='file-size'>{!file.isFolder ? formatSize(file.size) : `${file.size || 0} items`}</td>
                                <td className='file-storage'>{file.storageClass}</td>
                                <td className='file-actions subtext'>
                                    <span className='file-actions-dots' onClick={(e) => { e.stopPropagation(); setMore(more === index ? null : index); }}>...</span>
                                    {more === index && (
                                        <div className='file-actions-menu' ref={menuRef}>
                                            <span className='file-actions-menu-child' onClick={() => handleDownload(file)}>
                                                <span>Download</span><Download />
                                            </span>
                                            <span className="file-actions-menu-child" onClick={() => {handleDelete(file); setMore(null);}}>
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
                <div className='exhibits'>
                    <Loading />
                </div>
            )}
        </div>
    );
};