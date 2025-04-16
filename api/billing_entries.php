<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $case_id = $_GET['case_id'] ?? null;
    $where = isset($case_id) ? 'WHERE case_id = ?' : '';

    $sql = "SELECT 
                be.*, 
                br.rate AS billing_rate, 
                br.timekeeper_id, 
                br.classification_id, 
                u.name AS user_name
            FROM billing_entries be
            LEFT JOIN billing_rate br ON be.billing_rate_id = br.id
            LEFT JOIN users u ON br.user_id = u.id
            $where
            ORDER BY be.id DESC
        ";
    $stmt = $conn->prepare($sql);
    if (isset($case_id)) {
        $stmt->bind_param("i", $case_id);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $billing_entries = [];
    while ($row = $result->fetch_assoc()) {
        $billing_entries[] = $row;
    }
    echo json_encode(['success' => true, 'billing_entries' => $billing_entries]);
    exit;
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $uuid = generateGUID();
    $case_id = $input['case_id'] ?? null;
    $billing_rate_id = $input['billing_rate_id'] ?? null;
    $created_by = $_SESSION['user_id'] ?? null;
    $user_id = $input['user_id'] ?? null;
    $date = $input['date'] ?? null;
    $rate = $input['rate'] ?? null;
    $raw_quantity = $input['hours'] ?? null;
    $description = $input['description'] ?? null;
    $draft = $input['draft'] ?? null;
    $billable = $input['billable'] ?? null;
    $chargeable = $input['chargeable'] ?? null;

    $sql = "INSERT INTO billing_entries (uuid, case_id, billing_rate_id, created_by, user_id, date, rate, raw_quantity, description, draft, billable, chargeable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("siiissdissii", $uuid, $case_id, $billing_rate_id, $created_by, $user_id, $date, $rate, $raw_quantity, $description, $draft, $billable, $chargeable);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Billing entry added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add billing entry']);
    }
    $stmt->close();
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

function generateGUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
};