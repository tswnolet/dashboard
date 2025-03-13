<?php
require './db.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "
            SELECT leads.*,
                contact_details.detail_data,
                contact_details.detail_type,
                assigned_user.name AS assigned_to_name, 
                intake_user.name AS intake_by_name,
                referral_user.full_name AS referral_contact_name,
                contacts.full_name AS contact_name, 
                case_types.name AS case_type_name, 
                marketing_sources.source_name AS marketing_source_name, 
                locations.name AS office_name,
                locations.city AS office_city,
                statuses.name AS status_name
            FROM leads
            LEFT JOIN users AS assigned_user ON leads.assigned_to = assigned_user.id
            LEFT JOIN users AS intake_user ON leads.intake_by = intake_user.id
            LEFT JOIN contacts AS referral_user ON leads.referral_contact = referral_user.id
            LEFT JOIN contact_details ON leads.contact_id = contact_details.contact_id
            LEFT JOIN contacts ON leads.contact_id = contacts.id
            LEFT JOIN case_types ON leads.case_type_id = case_types.id
            LEFT JOIN marketing_sources ON leads.marketing_source = marketing_sources.id
            LEFT JOIN locations ON leads.office = locations.id
            LEFT JOIN statuses ON leads.status = statuses.id
            ORDER BY leads.created_at DESC
    ";
    
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $leads = [];

        while ($row = $result->fetch_assoc()) {
            $lead_id = $row['id'];

            if (!isset($leads[$lead_id])) {
                $leads[$lead_id] = [
                    'id' => $row['id'],
                    'intake_by_name' => $row['intake_by_name'],
                    'assigned_to' => $row['assigned_to_name'],
                    'created_at' => $row['created_at'],
                    'contact_id' => $row['contact_id'],
                    'contact_name' => $row['contact_name'],
                    'preferred_contact' => $row['preferred_contact'],
                    'case_type_id' => $row['case_type_id'],
                    'incident_date' => $row['incident_date'],
                    'marketing_source_name' => $row['marketing_source_name'],
                    'referral_contact' => $row['referral_contact_name'],
                    'marketing_notes' => $row['marketing_notes'],
                    'summary' => $row['summary'],
                    'case_likelihood' => $row['case_likelihood'],
                    'case_type_name' => $row['case_type_name'],
                    'office' => $row['office'],
                    'office_name' => $row['office_city'] . ', ' . $row['office_name'],
                    'status_name' => $row['status_name'],
                    'detail_data' => []
                ];
            }

            if (!empty($row['detail_type']) && !empty($row['detail_data'])) {
                $leads[$lead_id]['detail_data'][$row['detail_type']] = json_decode($row['detail_data'], true);
            }
        }

        echo json_encode(['success' => true, 'leads' => array_values($leads)]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No leads found']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $intake_by = $input['intake_by'] ?? 1;
    $contact_id = $input['contact_id'] ?? null;
    $preferred_contact = $input['preferred_contact'] ?? '';
    $case_type = $input['case_type'] ?? null;
    $incident_date = $input['incident_date'] ?? null;
    $marketing_source = $input['marketing_source'] ?? null;
    $referral_contact = $input['referral_contact'] ?? null;
    $marketing_notes = $input['marketing_notes'] ?? '';
    $summary = $input['summary'] ?? '';
    $case_likelihood = $input['case_likelihood'] ?? null;
    $office = $input['office'] ?? null;
    $assigned_to = $input['assigned_to'] ?? null;
    $status = $input['status'] ?? null;
    $notes = $input['notes'] ?? '';
    $custom_fields = $input['custom_fields'] ?? [];

    if (!$intake_by || !$contact_id || !$case_type || !$marketing_source || !$office || !$assigned_to || !$status) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    if ($incident_date) {
        $incident_date = date('Y-m-d H:i:s', strtotime($incident_date));
    } else {
        $incident_date = null;
    }

    $stmt = $conn->prepare("
        INSERT INTO leads (intake_by, contact_id, preferred_contact, case_type_id, incident_date, marketing_source, referral_contact, marketing_notes, summary, case_likelihood, office, assigned_to, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('iisississsiiis', 
        $intake_by, $contact_id, $preferred_contact, $case_type, $incident_date, 
        $marketing_source, $referral_contact, $marketing_notes, $summary, 
        $case_likelihood, $office, $assigned_to, $status, $notes
    );

    if ($stmt->execute()) {
        $lead_id = $stmt->insert_id;
        $stmt->close();

        if (!empty($custom_fields)) {
            $field_stmt = $conn->prepare("INSERT INTO lead_updates (field_id, lead_id, value) VALUES (?, ?, ?)");
            
            foreach ($custom_fields as $field_id => $value) {
                $field_stmt->bind_param('iis', $field_id, $lead_id, $value);
                $field_stmt->execute();
            }
            $field_stmt->close();
        }

        echo json_encode(['success' => true, 'message' => 'Lead created successfully', 'lead_id' => $lead_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create lead', 'error' => $stmt->error]);
    }

    $conn->close();
    exit;
}
?>
