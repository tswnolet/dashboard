<?php
require './db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['case_type_id']) || empty($_GET['case_type_id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing case_type_id']);
        exit;
    }

    $case_type_id = intval($_GET['case_type_id']);

    $sql = "SELECT * FROM custom_fields WHERE case_type_id = ? ORDER BY order_id ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $case_type_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $fields = [];
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['options'])) {
            $row['options'] = json_decode($row['options'], true);
        }
        $fields[] = $row;
    }

    echo json_encode(['success' => true, 'fields' => $fields]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);
?>