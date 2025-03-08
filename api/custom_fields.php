<?php
require './db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $caseTypes = fetchCaseTypes($conn);
    $customFields = fetchCustomFields($conn);
    $fieldTypes = fetchFieldTypes($conn);

    echo json_encode([
        'success' => true,
        'case_types' => $caseTypes,
        'custom_fields' => $customFields,
        'field_types' => $fieldTypes
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $case_type_id = $input['case_type_id'] ?? 0;
    $field_id = $input['field_id'] ?? null;
    $name = $input['name'] ?? null;
    $required = !empty($input['required']) ? 1 : 0;
    $obsolete = !empty($input['obsolete']) ? $input['obsolete'] : 1;
    $hidden = !empty($input['hidden']) ? $input['hidden'] : 1;
    $default_value = $input['default_value'] ?? null;
    $display_when = !empty($input['display_when']) ? $input['display_when'] : null;
    $is_answered = $input['is_answered'] !== "" ? $input['is_answered'] : null ?? null;

    if (empty($field_id) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Field type and name are required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT COALESCE(MAX(order_id), 0) + 1 AS next_order FROM custom_fields WHERE case_type_id = ?");
    $stmt->bind_param('i', $case_type_id);
    $stmt->execute();
    $orderResult = $stmt->get_result();
    $orderRow = $orderResult->fetch_assoc();
    $order_id = $orderRow['next_order'] ?? 1;
    $stmt->close();

    $options = !empty($input['options']) ? json_encode($input['options']) : null;

    $stmt = $conn->prepare("
        INSERT INTO custom_fields (
            case_type_id, field_id, name, order_id, required, options, 
            obsolete, hidden, default_value, display_when, is_answered
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        'iisissiiisi',
        $case_type_id, $field_id, $name, $order_id, $required, $options,
        $obsolete, $hidden, $default_value, $display_when, $is_answered
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Custom field created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create custom field', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

function fetchCaseTypes($conn) {
    $query = "SELECT id, name, aka, description FROM case_types";
    $result = $conn->query($query);

    $caseTypes = [];
    while ($row = $result->fetch_assoc()) {
        $caseTypes[] = $row;
    }
    return $caseTypes;
}

function fetchCustomFields($conn) {
    $query = "
        SELECT cf.id, cf.case_type_id, cf.name, cf.options, cf.default_value, cf.obsolete, cf.display_when, cf.is_answered, ct.name as case_type, cf.field_id, f.name as field_name, f.type as field_type, 
               cf.order_id, cf.required
        FROM custom_fields cf
        JOIN case_types ct ON cf.case_type_id = ct.id
        JOIN fields f ON cf.field_id = f.id
        ORDER BY cf.case_type_id, cf.order_id
    ";
    $result = $conn->query($query);

    $customFields = [];
    while ($row = $result->fetch_assoc()) {
        $customFields[] = $row;
    }
    return $customFields;
}

function fetchFieldTypes($conn) {
    $query = "SELECT id, name, type FROM fields";
    $result = $conn->query($query);

    $fieldTypes = [];
    while ($row = $result->fetch_assoc()) {
        $fieldTypes[] = $row;
    }
    return $fieldTypes;
}