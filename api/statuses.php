<?php
require 'headers.php';
require './db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = 'SELECT * FROM statuses';
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $statuses = [];
        while ($row = $result->fetch_assoc()) {
            $statuses[] = $row;
        }
        echo json_encode(['statuses' => $statuses]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No statuses found']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Name is required']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO statuses (name, description) VALUES (?, ?)");
    $stmt->bind_param('ss', $name, $description);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Status created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create status', 'error' => $stmt->error]);
    }

    $stmt->close();

    exit;
}

$conn->close();
?>