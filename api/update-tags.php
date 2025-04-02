<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $caseId = $data['case_id'] ?? null;
    $tags = $data['tags'] ?? [];

    if (!$caseId || !is_array($tags)) {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        exit;
    }

    $tagsJson = json_encode(array_values($tags));

    $stmt = $conn->prepare("UPDATE cases SET tags = ? WHERE id = ?");
    $stmt->bind_param("si", $tagsJson, $caseId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Tags updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes made']);
    }
}
?>