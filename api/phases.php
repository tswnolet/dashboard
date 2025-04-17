<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM phases ORDER BY order_id ASC";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $phases = [];
        while ($row = $result->fetch_assoc()) {
            $phases[] = $row;
        }
        echo json_encode(['success' => true, 'phases' => $phases]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No phases found']);
    }
    exit;
};

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    $case_id = $input['case_id'] ?? null;
    $phase_id = $input['phase_id'] ?? null;

    if (!$case_id || !$phase_id) {
        echo json_encode(['success' => false, 'message' => 'Missing case_id or phase_id']);
        exit;
    }

    $sql = "UPDATE cases SET phase_id = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $phase_id, $case_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Phase updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update phase or no change detected']);
    }
    exit;
}