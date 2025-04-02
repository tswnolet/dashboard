<?php
require 'headers.php';
require './db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT id, name, description FROM case_types";
    $result = $conn->query($query);

    if ($result) {
        $case_types = [];
        while ($row = $result->fetch_assoc()) {
            $case_types[] = $row;
        }
        echo json_encode(['success' => true, 'case_types' => $case_types]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch case types']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Name is required']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO case_types (name, description) VALUES (?, ?)");
    $stmt->bind_param('ss', $name, $description);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Case type created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create case type', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}
