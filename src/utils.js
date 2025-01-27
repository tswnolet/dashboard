import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = "https://dalyblackdata.com/proxy.php";

// Function to handle file upload and parse the data
export const handleFileUpload = (event, setFile, setLeads) => {
  const uploadedFile = event.target.files[0];
  setFile(uploadedFile);

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(sheet);
    setLeads(parsedData);
  };
  reader.readAsArrayBuffer(uploadedFile);
};

// Function to fetch lead details from the API
export const fetchLeadDetails = async (leads, setLeadDetails) => {
  const detailsMap = {};
  for (let lead of leads) {
    try {
      const response = await axios.get(`${API_URL}?id=${lead.LeadId}`);
      if (response.status === 200) {
        detailsMap[lead.LeadId] = response.data;
      } else {
        console.error(`Failed to fetch details for Lead ID ${lead.LeadId}, Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching lead details:`, error);
    }
  }

  const detailedLeads = leads.map((lead) => {
    const details = detailsMap[lead.LeadId] || {};
    const contact = details.Contact || {};
    const customFields = details.CustomFields || [];
    const summaryValues = extractSummaryValues(details.Summary || "");

    return {
      LeadId: lead.LeadId,
      FirstName: contact.FirstName || "",
      MiddleName: contact.MiddleName || "",
      LastName: contact.LastName || "",
      MobilePhone: formatPhoneNumber(contact.MobilePhone || ""),
      Email: contact.Email || "",
      InsuranceCompany: extractCustomField(customFields, 113).split('|')[0] || summaryValues["Insurance Company"] || "",
      IncidentDate: formatDate(details.IncidentDate) || "",
      VenueState: extractCustomField(customFields, 116) || extractCustomField(customFields, 144),
      TypeOfFirstPartyCase: extractCustomField(customFields, 1),
      PolicyNumber: extractCustomField(customFields, 8),
      ClaimNumber: extractCustomField(customFields, 7),
      TypeOfProperty: extractCustomField(customFields, 4),
      Deductible: extractCustomField(customFields, 22),
      PolicyLimits: extractCustomField(customFields, 23),
      EstimatedCostOfRepairs: extractCustomField(customFields, 24),
      InsuredPropertyAddress: summaryValues["Insured Property Address"] || "",
      TypeOfRoof: summaryValues["Type of Roof"] || "",
      SignerType: summaryValues["Signer Type"] || "",
      Summary: summaryValues["Summary"] || "",
      ClaimForPersonalProperty: extractCustomField(customFields, 19),
      LetterOfRepresentation: extractCustomField(customFields, 29),
      DateOfContractWithAdditionalAttorney: formatDate(extractCustomField(customFields, 37)),
      EstimateReport: extractCustomField(customFields, 145),
      Status: details.Status || "",
      SubStatus: details.SubStatus || "",
      SeverityLevel: details.SeverityLevel || "",
      Code: details.Code || "",
      MarketingSource: details.MarketingSource || "",
      ContactSource: details.ContactSource || "",
      Office: details.Office || "",
      ReferredByName: details.ReferredByName || "",
      CreatedDate: formatDate(details.CreatedDate) || "",
      SignedUpDate: formatDate(details.SignedUpDate) || "",
      LastStatusChangeDate: formatDate(details.LastStatusChangeDate) || "",
      Attorney: details.Attorney ? `${details.Attorney.FirstName} ${details.Attorney.LastName}` : "",
      AssignedTo: details.AssignedTo ? details.AssignedTo.map(assignee => `${assignee.FirstName} ${assignee.LastName}`).join(", ") : "",
      Creator: details.Creator ? `${details.Creator.FirstName} ${details.Creator.LastName}` : "",
      Notes: details.Notes ? details.Notes.map(note => note.Summary).join("\n") : "",
      Files: details.Files ? details.Files.map(file => file.FileName).join(", ") : "",
    };
  });

  setLeadDetails(detailedLeads);
};

// Function to extract custom field values
export const extractCustomField = (fields, id) => {
  return fields?.find(field => field.CustomFieldId === id)?.Value || "";
};

// Function to format phone numbers
export const formatPhoneNumber = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
};

// Function to extract summary values
export const extractSummaryValues = (summary) => {
  const values = {};
  if (summary) {
    summary.split('\r\n').forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        values[key.trim()] = value.trim();
      }
    });
  }
  return values;
};

// Function to format date and time
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
};

// Function to submit lead data to the API
export const submitLead = async (leadData) => {
  const data = new URLSearchParams();
  data.append("First", leadData.FirstName);
  data.append("Middle_Name", leadData.MiddleName);
  data.append("Last", leadData.LastName);
  data.append("Phone", leadData.MobilePhone);
  data.append("Email", leadData.Email);
  data.append("Insurance_Company", leadData.InsuranceCompany);
  data.append("Incident_Date", leadData.IncidentDate);
  data.append("Venue_State", leadData.VenueState);
  data.append("Language", leadData.Language);
  data.append("Address", leadData.Address);
  data.append("Address_2", leadData.Address2);
  data.append("Home_Phone", leadData.HomePhone);
  data.append("Work_Phone", leadData.WorkPhone);
  data.append("City", leadData.City);
  data.append("State", leadData.State);
  data.append("Postal_Code", leadData.PostalCode);
  data.append("Preferred_Contact_Method", leadData.PreferredContactMethod);
  data.append("Birthdate", leadData.Birthdate);
  data.append("Minor", leadData.Minor);
  data.append("Gender", leadData.Gender);
  data.append("Deceased", leadData.Deceased);
  data.append("Injuries_Sustained", leadData.InjuriesSustained);
  data.append("SCG_ID", leadData.SCG_ID);
  data.append("Type_of_First_Party_Case", leadData.TypeOfFirstPartyCase);
  data.append("Policy_Number", leadData.PolicyNumber);
  data.append("Claim_Number", leadData.ClaimNumber);
  data.append("Insured_Property_Address", leadData.InsuredPropertyAddress);
  data.append("Type_of_Roof", leadData.TypeOfRoof);
  data.append("Type_of_Property", leadData.TypeOfProperty);
  data.append("Claim_Made_for_Personal_Property", leadData.ClaimForPersonalProperty);
  data.append("Estimated_Cost_of_Repairs", leadData.EstimatedCostOfRepairs);
  data.append("Contractor_Name", leadData.ContractorName);
  data.append("Date_of_Contract_with_Additional_Attorney", leadData.DateOfContractWithAdditionalAttorney);
  data.append("Signer_Type", leadData.SignerType);
  data.append("Letter_of_Representation", leadData.LetterOfRepresentation);
  data.append("Estimate_Report", leadData.EstimateReport);
  data.append("Summary", leadData.Summary);

  try {
    const response = await axios.post(API_URL, data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (response.status === 200) {
      const responseData = response.data;
      console.log("Lead submitted successfully", responseData, data.toString());
    } else {
      console.error("Failed to submit lead", response.statusText);
    }
  } catch (error) {
    console.error("Error submitting lead", error);
  }
};