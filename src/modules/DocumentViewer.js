import React, { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import "../styles/DocumentViewer.css";

export const DocumentViewer = ({ file, onClose }) => {
    const [fileContent, setFileContent] = useState(null);
    const fileType = file?.name?.split(".").pop().toLowerCase();

    if (!file || !file.url) return null;

    useEffect(() => {
        if (["txt", "csv", "json"].includes(fileType)) {
            fetch(file.url)
                .then((res) => res.text())
                .then((text) => setFileContent(text))
                .catch(() => setFileContent("⚠ Unable to load content."));
        } else {
            setFileContent(file.url);
        }
    }, [file.url, fileType]);

    let content;
    if (["png", "jpg", "jpeg", "gif"].includes(fileType)) {
        content = <img src={fileContent} alt={file.name} className="image-preview" />;
    } else if (["txt", "csv", "json"].includes(fileType)) {
        content = <pre className="text-preview">{fileContent}</pre>;
    } else if (fileType === "pdf") {
        content = <embed src={fileContent} className="pdf-viewer" type="application/pdf" />;
    } else if (["doc", "docx", "xls", "xlsx"].includes(fileType)) {
        content = (
            <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`}
                className="office-viewer"
                title="Office Document Viewer"
            />
        );
    } else {
        content = <p className="unsupported-file">⚠ Preview not available.</p>;
    }

    return (
        <div className="document-viewer">
            <button className="close-viewer" onClick={onClose}>
                <XCircle /> Close
            </button>
            {content}
        </div>
    );
};
