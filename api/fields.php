<?php
require 'headers.php';
include 'db.php';
session_start();

header("Content-Type: application/json");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['section_id'])) {
    $section_id = intval($_GET['section_id']);

    $sql = "
        SELECT fm.id, fm.name, f.type, fm.order_id, fm.rules
        FROM field_map fm
        INNER JOIN fields f ON fm.field_id = f.id
        WHERE fm.section_id = ?
        ORDER BY fm.order_id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $section_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $fields = [];
    while ($row = $result->fetch_assoc()) {
        $fields[] = $row;
    }

    echo json_encode(['success' => true, 'fields' => $fields]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['section_id'], $input['field_id'])) {
        echo json_encode(['success' => false, 'message' => 'Missing section_id or field_id']);
        exit;
    }

    $section_id = intval($input['section_id']);
    $field_id = intval($input['field_id']);
    $rules = json_encode($input['rules']);

    $sql_order = "SELECT COALESCE(MAX(order_id), 0) + 1 AS next_order FROM field_map WHERE section_id = ?";
    $stmt_order = $conn->prepare($sql_order);
    $stmt_order->bind_param("i", $section_id);
    $stmt_order->execute();
    $result_order = $stmt_order->get_result();
    $row_order = $result_order->fetch_assoc();
    $next_order = $row_order['next_order'];

    $sql = "INSERT INTO field_map (section_id, field_id, order_id, rules) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiis", $section_id, $field_id, $next_order, $rules);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Field added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding field', 'error' => $conn->error]);
    }

    $stmt->close();
    $stmt_order->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT DISTINCT name, id FROM fields";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $fields = [];
        while ($row = $result->fetch_assoc()) {
            $fields[] = $row;
        }
        echo json_encode(['success' => true, 'fields' => $fields]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No fields found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>