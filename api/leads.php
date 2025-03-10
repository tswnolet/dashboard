<?php
require './db.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "
        SELECT leads.*, 
               users.name AS intake_by_name, 
               contacts.full_name AS contact_name, 
               case_types.name AS case_type_name, 
               marketing_sources.source_name AS marketing_source_name, 
               locations.name AS office_name, 
               statuses.name AS status_name
        FROM leads
        LEFT JOIN users ON leads.intake_by = users.id
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
            $leads[] = $row;
        }
        echo json_encode(['success' => true, 'leads' => $leads]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No leads found']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $intake_by = $input['intake_by'] ?? null;
    $created_at = $input['created_at'] ?? date('Y-m-d H:i:s');
    $contact_id = $input['contact_id'] ?? null;
    $preferred_contact = $input['preferred_contact'] ?? '';
    $case_type_id = $input['case_type_id'] ?? null;
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

    if (!$intake_by || !$contact_id || !$case_type_id || !$marketing_source || !$office || !$assigned_to || !$status) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    if ($incident_date) {
        $incident_date = date('Y-m-d H:i:s', strtotime($incident_date));
    } else {
        $incident_date = null;
    }

    $stmt = $conn->prepare("
        INSERT INTO leads (intake_by, created_at, contact_id, preferred_contact, case_type_id, incident_date, marketing_source, referral_contact, marketing_notes, summary, case_likelihood, office, assigned_to, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('isisississsiiis', 
        $intake_by, $created_at, $contact_id, $preferred_contact, $case_type_id, $incident_date, 
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
