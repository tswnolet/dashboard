<?php
require 'db.php';
require 's3-helper.php';
require 'folder-template-fetch.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$caseName = $data['case_name'] ?? '';
$templateId = $data['template_id'] ?? '';

if (empty($caseName) || empty($templateId)) {
    echo json_encode(['success' => false, 'message' => 'Missing required data']);
    exit;
}

$sql = "INSERT INTO cases (name, template_id) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $caseName, $templateId);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    $caseId = $stmt->insert_id;

    $folders = getFolderTemplate($templateId);
    if (createCaseFolder($caseId, $folders)) {
        echo json_encode(['success' => true, 'message' => 'Case created with folders']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Case created, but folder creation failed']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Database insert failed']);
}