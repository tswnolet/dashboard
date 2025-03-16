<?php
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
    $created_by = $_SESSION['user_id'] ?? 0;

    if (empty($case_name) || empty($template_id)) {
        echo json_encode(['success' => false, 'message' => 'Missing required data']);
        exit;
    }

    $sql = "INSERT INTO cases (case_name, contact_id, lead_id, template_id, created_by) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("siiii", $case_name, $contact_id, $lead_id, $template_id, $created_by);
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
    $id = $_GET['id'];
    $sql = "
        SELECT 
            cases.*, 
            users.user AS created_by_name, 
            COALESCE(contacts.profile_picture, 
                CONCAT(
                    UPPER(LEFT(contacts.first_name, 1)), 
                    UPPER(LEFT(contacts.last_name, 1))
                )
            ) AS contact_display 
        FROM cases 
        JOIN users ON cases.created_by = users.id 
        LEFT JOIN contacts ON cases.contact_id = contacts.id
        WHERE cases.id = ?
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();
    $case = $result->fetch_assoc();

    echo json_encode($case);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "
        SELECT 
            cases.*, 
            users.user AS created_by_name, 
            COALESCE(contacts.profile_picture, 
                CONCAT(
                    UPPER(LEFT(contacts.first_name, 1)), 
                    UPPER(LEFT(contacts.last_name, 1))
                )
            ) AS contact_display 
        FROM cases 
        JOIN users ON cases.created_by = users.id 
        LEFT JOIN contacts ON cases.contact_id = contacts.id
    ";
    
    $result = $conn->query($sql);

    $cases = [];
    while ($row = $result->fetch_assoc()) {
        $cases[] = $row;
    }

    echo json_encode($cases);
}