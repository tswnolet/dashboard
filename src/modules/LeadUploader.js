import { useState, useEffect } from "react";
import { handleFileUpload, fetchLeadDetails, submitLead } from "../utils";
import { Uploader } from "./Uploader";
import Select from "react-select";

export default function LeadUploader() {
    const [file, setFile] = useState(null);
    const [leads, setLeads] = useState([]);
    const [leadDetails, setLeadDetails] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);

    useEffect(() => {
        if (leads.length > 0) {
            fetchLeadDetails(leads, setLeadDetails);
            console.log("Leads initialized:", leads);
        }
    }, [leads]);

    const handleFileChange = (event) => {
        handleFileUpload(event, setFile, setLeads);
    };

    const allFields = [
        "LeadId", "FirstName", "MiddleName", "LastName", "MobilePhone", "Email", "InsuranceCompany", "IncidentDate",
        "VenueState", "TypeOfFirstPartyCase", "PolicyNumber", "ClaimNumber", "TypeOfProperty", "Deductible",
        "PolicyLimits", "EstimatedCostOfRepairs", "InsuredPropertyAddress", "TypeOfRoof", "SignerType", "Summary",
        "ClaimForPersonalProperty", "LetterOfRepresentation", "DateOfContractWithAdditionalAttorney", "EstimateReport",
        "Status", "SubStatus", "SeverityLevel", "Code", "MarketingSource", "ContactSource", "Office", "ReferredByName",
        "CreatedDate", "SignedUpDate", "LastStatusChangeDate", "Attorney", "AssignedTo", "Creator", "Notes", "Files"
    ];

    const defaultFields = [
        "LeadId", "FirstName", "MiddleName", "LastName", "MobilePhone",
        "Email", "InsuranceCompany", "IncidentDate", "VenueState", "EstimatedCostOfRepairs"
    ];

    // Ensure default fields are only set once and avoid duplication
    useEffect(() => {
        if (selectedFields.length === 0) {
            setSelectedFields([...new Set(defaultFields)]);
        }
    }, []);

    const fieldOptions = allFields.map(field => ({
        value: field,
        label: field.replace(/([A-Z])/g, " $1").trim() // Format as "Camel Case"
    }));

    const handleFieldSelection = (selectedOptions) => {
        setSelectedFields([...new Set(selectedOptions.map(option => option.value))]); // Ensure unique values
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            background: "var(--secondary-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "5px",
            boxShadow: "none",
            color: "var(--text-color)",
            "&:hover": { borderColor: "var(--hover-color)" },
        }),
        menu: (base) => ({ ...base, background: "var(--secondary-color)", borderRadius: "8px" }),
        option: (base, { isFocused, isSelected }) => ({
            ...base,
            background: isSelected ? "var(--graph-color)" : isFocused ? "var(--hover-color)" : "transparent",
            color: isSelected ? "var(--secondary-color)" : "var(--text-color)",
            padding: "10px",
            cursor: "pointer",
        }),
        multiValue: (base) => ({ ...base, background: "var(--line-color)", borderRadius: "4px", padding: "3px 6px", color: "var(--text-color)" }),
        multiValueLabel: (base) => ({ ...base, color: "var(--text-color)" }),
        multiValueRemove: (base) => ({
            ...base,
            color: "var(--subtext-color)",
            "&:hover": { background: "var(--graph-color)", color: "var(--secondary-color)" },
        }),
    };

    return (
        <div className='page-container'>
            <Uploader setFile={setFile} handleFileChange={handleFileChange} setLeads={setLeads} />

            <div className="field-selector">
                <label>Select Fields:</label>
                <Select
                    options={fieldOptions}
                    isMulti
                    value={fieldOptions.filter(option => selectedFields.includes(option.value))}
                    onChange={handleFieldSelection}
                    styles={customStyles}
                    className="multi-select"
                    placeholder="Select fields to display..."
                />
            </div>

            {leadDetails.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            {/* Use new Set() to prevent duplicate headers */}
                            {[...new Set(selectedFields)].map((header) => (
                                <th key={header}>
                                    {header.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                            <th>Submit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leadDetails.map((lead, index) => (
                            <tr key={index}>
                                {[...new Set(selectedFields)].map((field, i) => (
                                    <td key={i} title={lead[field]}>
                                        {lead[field]?.length > 15 ? lead[field].slice(0, 15) + "..." : lead[field]}
                                    </td>
                                ))}
                                <td>
                                    <button onClick={() => submitLead(lead)}>Submit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}