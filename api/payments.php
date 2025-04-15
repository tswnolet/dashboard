<?php
require 'headers.php';
require 'db.php';
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $case_id = $_GET['case_id'] ?? null;
    $where = isset($case_id) ? 'WHERE case_id = ?' : '';
    
    $sql = "SELECT * FROM payments $where ORDER BY id DESC";
    $stmt = $conn->prepare($sql);
    if (isset($case_id)) {
        $stmt->bind_param("i", $case_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $payments = [];
    while ($row = $result->fetch_assoc()) {
        $payments[] = [
            'id' => (int)$row['id'],
            'total' => (float)$row['total'],
            'date' => $row['date'],
            'reference' => $row['reference'],
            'method' => $row['method'],
            'status' => $row['status'],
            'case_id' => (int)$row['case_id'],
        ];
    }
    echo json_encode(['success' => true, 'payments' => $payments]);
    exit;
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $case_id = $input['case_id'] ?? null;
    $total = $input['total'] ?? null;
    $method = $input['method'] ?? null;
    $reference = $input['reference'] ?? null;
    $date = $input['date'] ?? null;
    $created_by = $_SESSION['user_id'] ?? null;

    $sql = "INSERT INTO payments (case_id, reference, date, total, method, created_by) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("issdsi", $case_id, $reference, $date, $total, $method, $created_by);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Payment added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add payment']);
    }
    $stmt->close();
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}