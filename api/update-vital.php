<?php
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$case_id = $data['case_id'] ?? null;
$lead_id = $data['lead_id'] ?? null;
$field = $data['field'] ?? null;
$value = $data['value'] ?? null;
$table = $data['table'] ?? null;

if (!$case_id || !$field || !$table) {
    echo json_encode(["success" => false, "message" => "Missing required data"]);
    exit;
}

$updateQuery = "";
$params = [];
$types = "";

if ($table === "cases") {
    $updateQuery = "UPDATE cases SET $field = ?, updated_at = NOW() WHERE id = ?";
    $params = [$value, $case_id];
    $types = "si";
} elseif ($table === "leads") {
    $updateQuery = "UPDATE leads SET $field = ?, updated_at = NOW() WHERE id = ?";
    $params = [$value, $lead_id];
    $types = "si";
} elseif ($table === "lead_updates") {
    $updateQuery = "UPDATE lead_updates SET value = ?, created_at = NOW() WHERE lead_id = ? AND field_name = ?";
    $params = [$value, $lead_id, $field];
    $types = "sis";
}

$stmt = $conn->prepare($updateQuery);
$stmt->bind_param($types, ...$params);
$success = $stmt->execute();

echo json_encode(["success" => $success]);
?>