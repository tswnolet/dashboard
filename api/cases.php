<?php
require 'headers.php';
require 'db.php';
require 's3-helper.php';
require 'folder-template-fetch.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $case_name = $data['case_name'] ?? '';
    $contact_id = $data['contact_id'] ?? '';
    $lead_id = $data['lead_id'] ?? '';
    $template_id = $data['template_id'] ?? '';
    $created_by = $_SESSION['user_id'] ?? 6;

    if (empty($case_name) || empty($template_id)) {
        echo json_encode(['success' => false, 'message' => 'Missing required data']);
        exit;
    }

    $sql = "INSERT INTO cases (case_name, contact_id, lead_id, template_id) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("siii", $case_name, $contact_id, $lead_id, $template_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $caseId = $stmt->insert_id;

        $folders = getFolderTemplate($template_id);
        if (createCaseFolder($caseId, $folders)) {
            echo json_encode(['success' => true, 'message' => 'Case created with folders']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Case created, but folder creation failed']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Database insert failed']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $caseId = $_GET['id'];

    $caseQuery = $conn->prepare("
        SELECT cases.id AS case_id, cases.*, users.user AS created_by_name, phases.phase AS phase_name, phases.id AS phase_id, cases.contact_id, cases.lead_id 
        FROM cases 
        JOIN users ON cases.created_by = users.id 
        JOIN phases ON cases.phase_id = phases.id 
        WHERE cases.id = ?");
    $caseQuery->bind_param("i", $caseId);
    $caseQuery->execute();
    $caseResult = $caseQuery->get_result();
    $caseData = $caseResult->fetch_assoc();
    
    $response = ['case' => $caseData];
    
    if ($caseData['contact_id']) {
        $contactQuery = $conn->prepare("
            SELECT contacts.*, 
            COALESCE(contacts.profile_picture, 
                CONCAT(
                    UPPER(LEFT(contacts.first_name, 1)), 
                    UPPER(LEFT(contacts.last_name, 1))
                )
            ) AS contact_display 
            FROM contacts WHERE contacts.id = ?");
        $contactQuery->bind_param("i", $caseData['contact_id']);
        $contactQuery->execute();
        $contactResult = $contactQuery->get_result();
        $response['contact'] = $contactResult->fetch_assoc();

        $contactDetailsQuery = $conn->prepare("
            SELECT * FROM contact_details WHERE contact_id = ?");
        $contactDetailsQuery->bind_param("i", $caseData['contact_id']);
        $contactDetailsQuery->execute();
        $contactDetailsResult = $contactDetailsQuery->get_result();
        $response['contact']['details'] = [];
        while ($row = $contactDetailsResult->fetch_assoc()) {
            $type = $row['detail_type'];
            $data = json_decode($row['detail_data'], true);
        
            if (!isset($response['contact']['details'][$type])) {
                $response['contact']['details'][$type] = [];
            }
        
            $response['contact']['details'][$type][] = $data;
        }        
    }
    
    if ($caseData['lead_id']) {
        $leadQuery = $conn->prepare("
            SELECT leads.*, ref_contact.full_name AS referral_contact_name
            FROM leads
            LEFT JOIN contacts AS ref_contact ON leads.referral_contact = ref_contact.id
            WHERE leads.id = ?");
        $leadQuery->bind_param("i", $caseData['lead_id']);
        $leadQuery->execute();
        $leadResult = $leadQuery->get_result();
        $response['lead'] = $leadResult->fetch_assoc();
    }
    
    echo json_encode($response);    
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT
                c.id AS case_id,
                c.case_name,
                c.contact_id,
                c.lead_id,
                c.template_id,
                c.phase_id,
                c.create_date,
                c.updated_at,
                c.tags,
                u.user AS created_by_name,
                p.phase AS phase_name,
                COALESCE(con.profile_picture, CONCAT(UPPER(LEFT(con.first_name, 1)), UPPER(LEFT(con.last_name, 1)))) AS contact_display,
                con.full_name AS contact_name
            FROM cases c
            JOIN users u ON c.created_by = u.id 
            JOIN phases p ON c.phase_id = p.id
            LEFT JOIN contacts con ON c.contact_id = con.id
            ORDER BY c.id DESC";

    $result = $conn->query($sql);
    $cases = [];
    while ($row = $result->fetch_assoc()) {
        $cases[$row['case_id']] = $row;
    }

    $leads = [];
    $leadSql = "SELECT 
                    l.id AS lead_id,
                    l.intake_by,
                    l.created_at,
                    l.contact_id,
                    l.preferred_contact,
                    l.case_type_id,
                    l.incident_date,
                    l.marketing_source,
                    l.referral_contact,
                    l.db_origination,
                    l.marketing_notes,
                    l.summary,
                    l.case_likelihood,
                    l.office,
                    l.assigned_to,
                    l.status,
                    l.notes,
                    l.referred_to,
                    c.full_name AS referred_to_name
                FROM leads l
                LEFT JOIN contacts c ON l.referred_to = c.id;";
    
    $leadResult = $conn->query($leadSql);
    while ($row = $leadResult->fetch_assoc()) {
        $leads[$row['lead_id']] = $row;
    }

    $leadUpdates = [];
    $leadUpdateSql = "SELECT 
                        lu.lead_id, 
                        JSON_ARRAYAGG(JSON_OBJECT('field_name', cf.name, 'value', lu.value, 'created_at', lu.created_at)) AS lead_updates_data
                      FROM lead_updates lu
                      LEFT JOIN custom_fields cf ON lu.field_id = cf.id
                      GROUP BY lu.lead_id";
    
    $leadUpdateResult = $conn->query($leadUpdateSql);
    while ($row = $leadUpdateResult->fetch_assoc()) {
        $leadUpdates[$row['lead_id']] = json_decode($row['lead_updates_data'], true);
    }

    foreach ($cases as &$case) {
        $leadId = $case['lead_id'];
        $case['lead_data'] = $leads[$leadId] ?? null;
        $case['lead_data']['lead_updates_data'] = $leadUpdates[$leadId] ?? [];
    }

    echo json_encode(array_values($cases));
}