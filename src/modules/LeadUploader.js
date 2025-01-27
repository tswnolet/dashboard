import { useState, useEffect } from "react";
import { handleFileUpload, fetchLeadDetails, submitLead } from "../utils";
import { Uploader } from "./Uploader";
import DisplayFilter from "./DisplayFilter";

const API_URL = "https://dalyblackdata.com/proxy.php";

export default function LeadUploader() {
  const [file, setFile] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadDetails, setLeadDetails] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);

  const handleFileChange = (event) => {
    handleFileUpload(event, setFile, setLeads);
  };

  useEffect(() => {
    if (leads.length > 0) {
      fetchLeadDetails(leads, setLeadDetails);
      console.log("Leads initialized:", leads); // Log leads for error logging
    }
  }, [leads]);

  const handleFieldSelection = (event) => {
    const { value, checked } = event.target;
    setSelectedFields((prevFields) =>
      checked ? [...prevFields, value] : prevFields.filter((field) => field !== value)
    );
  };

  const allFields = [
    "LeadId", "FirstName", "MiddleName", "LastName", "MobilePhone", "Email", "InsuranceCompany", "IncidentDate",
    "VenueState", "TypeOfFirstPartyCase", "PolicyNumber", "ClaimNumber", "TypeOfProperty", "Deductible",
    "PolicyLimits", "EstimatedCostOfRepairs", "InsuredPropertyAddress", "TypeOfRoof", "SignerType", "Summary",
    "ClaimForPersonalProperty", "LetterOfRepresentation", "DateOfContractWithAdditionalAttorney", "EstimateReport",
    "Status", "SubStatus", "SeverityLevel", "Code", "MarketingSource", "ContactSource", "Office", "ReferredByName",
    "CreatedDate", "SignedUpDate", "LastStatusChangeDate", "Attorney", "AssignedTo", "Creator", "Notes", "Files"
  ];

    return (
        <div className='page-container'>
            <Uploader setFile={setFile} handleFileChange={handleFileChange} setLeads={setLeads} />
            <DisplayFilter allFields={allFields} selectedFields={selectedFields} handleFieldSelection={handleFieldSelection} />
            {leadDetails.length > 0 && (
                <table >
                    <thead>
                        <tr>
                            {selectedFields.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                            <th>Submit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leadDetails.map((lead, index) => (
                            <tr key={index}>
                                {selectedFields.map((field, i) => (
                                    <td key={i}>{lead[field]}</td>
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