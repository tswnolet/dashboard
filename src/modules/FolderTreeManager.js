import React, { useState, useEffect } from "react";
import { Folder as FolderIcon, FolderOutlined, NoiseAware, NotificationsNone } from "@mui/icons-material";
import "../styles/FolderTree.css";
import { BadgeAlert, FolderOpenIcon, Info } from "lucide-react";
import { Alert } from "@mui/material";
import { InfoCircle } from "@mynaui/icons-react";

const FolderTree = ({ folders, parentId = null, level = 0, openFolders, toggleFolder, handleFolderNameChange, editingFolderId, setEditingFolderId }) => {
    return (
        <ul className={`folder-tree${parentId === null ? ' main' : ''}`}>
        {folders
            .filter((folder) => folder.parent_folder_id === parentId)
            .map((folder, index) => {
                const hasChildren = folders.some((f) => f.parent_folder_id === folder.id);
                return (
                    <li key={folder.id}>
                        <span onClick={() => hasChildren && toggleFolder(folder.id)} style={{ cursor: hasChildren ? "pointer" : "default" }}>
                            {hasChildren ? (openFolders[folder.id] ? <FolderOpenIcon /> : <FolderIcon />) : <FolderOutlined />}
                            {parentId === 1 ? String(index + 1).padStart(2, "0") : ""} 
                            {editingFolderId === folder.id ? (
                                <input
                                    type="text"
                                    value={folder.name}
                                    onChange={(e) => handleFolderNameChange(folder.id, e.target.value)}
                                    onBlur={() => setEditingFolderId(null)}
                                    autoFocus
                                />
                            ) : (
                                <span onDoubleClick={() => setEditingFolderId(folder.id)}>{folder.name}</span>
                            )}
                            {folder.folder_access === "Protected" ? `(${folder.folder_access})` : null}
                        </span>
                        {hasChildren && openFolders[folder.id] && (
                            <FolderTree
                                folders={folders}
                                parentId={folder.id}
                                level={level + 1}
                                openFolders={openFolders}
                                toggleFolder={toggleFolder}
                                handleFolderNameChange={handleFolderNameChange}
                                editingFolderId={editingFolderId}
                                setEditingFolderId={setEditingFolderId}
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

const ReplacementLegend = () => {
    const today = new Date();
    return (
        <div className="replacement-legend">
            <div className='replace-fields'>
                <div className='replace-fields-title'>
                    <h4>Replacement Fields</h4>
                    <p>When added to folder names, the following fields will be replaced by the project information.</p>
                </div>
                <div className='replace-fields-list'>
                    <div className='replace-field'>
                        <p>{'{{Name}}'}</p>
                        <p>Case name (or client's full name if case name is not set)</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{ClientName}}'}</p>
                        <p>Client's full name</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{ClientFirstName}}'}</p>
                        <p>Client's first name</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{ClientLastName}}'}</p>
                        <p>Clients last name</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{Date}}'}</p>
                        <p>Case creation date, e.g. {today.getFullYear()}-{String(today.getMonth() + 1).padStart(2, '0')}-{String(today.getDate()).padStart(2, '0')}</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{YYYY}}'}</p>
                        <p>Case creation year, e.g. {today.getFullYear()}</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{MM}}'}</p>
                        <p>Case creation month (numerical), e.g. {today.getMonth() + 1}</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{MMM}}'}</p>
                        <p>Case creation month (abbreviated), e.g. {today.toLocaleString('en-US', { month: 'short' })}.</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{MMMM}}'}</p>
                        <p>Case creation month, e.g. {today.toLocaleString('en-US', { month: 'long' })}</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{DD}}'}</p>
                        <p>Case creation day of the month</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{CaseID}}'}</p>
                        <p>Case ID</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{UniqueKey}}'}</p>
                        <p>Email associated with case contact</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{PrimaryFirstName}}'}</p>
                        <p>Case creator's first name</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{PrimaryLastName}}'}</p>
                        <p>Case creator's last name</p>
                    </div>
                    <div className='replace-field'>
                        <p>{'{{PrimaryUsername}}'}</p>
                        <p>Case creator's username</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FolderTreeManager = ({ folders }) => {
    const [openFolders, setOpenFolders] = useState({});
    const [editingFolderId, setEditingFolderId] = useState(null);

    useEffect(() => {
        const initialOpenState = {};
        folders.forEach((folder) => {
        initialOpenState[folder.id] = true;
        });
        setOpenFolders(initialOpenState);
    }, [folders]);

    const toggleFolder = (id) => {
        setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFolderNameChange = async (folderId, newName) => {
        const updatedFolders = folders.map((folder) =>
            folder.id === folderId ? { ...folder, name: newName } : folder
        );
        try {
            const response = await fetch(`https://api.casedb.co/folder-templates.php`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: folderId, name: newName }),
            });
            const data = await response.json();
            if (!data.success) {
                console.error("Error updating folder name:", data.message);
            }
        } catch (error) {
            console.error("Error updating folder name:", error);
        }
    };

    return (
        <div className="folder-tree-manager">
            <FolderTree
                folders={folders}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                handleFolderNameChange={handleFolderNameChange}
                editingFolderId={editingFolderId}
                setEditingFolderId={setEditingFolderId}
            />
            <div className='folder-legend'>
                <div className='folder-legend-folders'>
                    <div className='folder-legend-folder'>
                        <FolderIcon /> Folder
                    </div>
                    <div className='folder-legend-folder'>
                        <FolderOpenIcon /> Open Folder
                    </div>
                    <div className='folder-legend-folder'>
                        <FolderOutlined /> Empty Folder
                    </div>
                </div>
                <div className='folder-legend-instruction'>
                    <BadgeAlert size="20" /> Double click on a folder name to edit it.
                </div>
            </div>
            <ReplacementLegend />
        </div>
    );
};

export default FolderTreeManager;