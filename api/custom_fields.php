<?php
require 'headers.php';
require './db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $section_id = $_GET['section_id'] ?? null;
    $template_id = $_GET['template_id'] ?? 1;
    $lead_id = $_GET['lead_id'] ?? null;

    $query = "
        SELECT * FROM fields;";
    $result = $conn->query($query);
    $fields = [];
    while ($row = $result->fetch_assoc()) {
        $fields[] = $row;
    }

    $caseTypes = fetchCaseTypes($conn);

    if (!isset($_GET['section_id'])) {
        $customFields = fetchCustomFields($conn);
        $allCustomFields = [];

        if (isset($template_id)) {
            $allCustomFields = fetchAllFields($conn, $template_id);
        }

        echo json_encode([
            'success' => true,
            'case_types' => $caseTypes,
            'custom_fields' => $customFields,
            'all_custom_fields' => $allCustomFields,
            'fields' => $fields
        ]);
        exit;
    }

    if (isset($section_id)) {
        $customFields = fetchCustomFields($conn, $section_id, $template_id);
        $fieldUpdates = $lead_id ? fetchFieldUpdates($conn, $lead_id, $section_id) : '';
        $sectionName = sectionName($conn, $section_id);
        echo json_encode([
            'success' => true,
            'custom_fields' => $customFields,
            'field_updates' => $fieldUpdates,
            'fields' => $fields,
            'section_id' => $section_id,
            'section_name' => $sectionName
        ]);
    }

    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['field_values']) && isset($input['lead_id'])) {
        $lead_id = $input['lead_id'];
        $fieldValues = $input['field_values'];
        $group_id = isset($input['group_id']) ? (int)$input['group_id'] : getMaxGroupId($conn, $lead_id) + 1;

        foreach ($fieldValues as $field_id => $value) {
            $fieldMetaQuery = $conn->prepare("SELECT add_item FROM custom_fields WHERE id = ?");
            $fieldMetaQuery->bind_param("i", $field_id);
            $fieldMetaQuery->execute();
            $fieldMetaResult = $fieldMetaQuery->get_result();
            $fieldMeta = $fieldMetaResult->fetch_assoc();
            $isAddItem = (int)($fieldMeta['add_item'] ?? 0) === 1;
            $fieldMetaQuery->close();
        
            $usedGroupId = $isAddItem ? $group_id : 0;
        
            $stmt = $conn->prepare("SELECT id FROM field_updates WHERE field_id = ? AND lead_id = ? AND group_id = ?");
            $stmt->bind_param('iii', $field_id, $lead_id, $usedGroupId);
            $stmt->execute();
            $stmt->store_result();
        
            if ($stmt->num_rows > 0) {
                $stmt->close();
                $updateStmt = $conn->prepare("UPDATE field_updates SET value = ? WHERE field_id = ? AND lead_id = ? AND group_id = ?");
                $updateStmt->bind_param('siii', $value, $field_id, $lead_id, $usedGroupId);
                $updateStmt->execute();
                $updateStmt->close();
            } else {
                $stmt->close();
                $insertStmt = $conn->prepare("INSERT INTO field_updates (field_id, lead_id, value, group_id) VALUES (?, ?, ?, ?)");
                $insertStmt->bind_param('iisi', $field_id, $lead_id, $value, $usedGroupId);
                $insertStmt->execute();
                $insertStmt->close();
            }
        }        
    
        echo json_encode(['success' => true, 'message' => 'Field values saved.', 'group_id' => $group_id]);
        exit;
    }    

    $case_type_id = $input['case_type_id'] ?? 0;
    $field_id = $input['field_id'] ?? null;
    $name = $input['name'] ?? null;
    $required = !empty($input['required']) ? 1 : 0;
    $obsolete = !empty($input['obsolete']) ? $input['obsolete'] : 1;
    $hidden = !empty($input['hidden']) ? $input['hidden'] : 1;
    $add_item = $input['add_item'] ?? null;
    $default_value = $input['default_value'] ?? null;
    $display_when = !empty($input['display_when']) ? $input['display_when'] : null;
    $is_answered = $input['is_answered'] !== "" 
        ? (is_array($input['is_answered']) ? json_encode($input['is_answered']) : $input['is_answered']) 
        : null;
    $section_id = $input['section_id'] ?? null;
    $template_id = $input['template_id'] ?? null;

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
            obsolete, hidden, add_item, default_value, display_when, is_answered, section_id, template_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        'iisissiiiissii',
        $case_type_id, $field_id, $name, $order_id, $required, $options,
        $obsolete, $hidden, $add_item, $default_value, $display_when, $is_answered,
        $section_id, $template_id
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Custom field created successfully', 'is_answered' => $is_answered]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create custom field', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

function getMaxGroupId($conn, $lead_id) {
    $result = $conn->query("SELECT COALESCE(MAX(group_id), 0) as max_id FROM field_updates WHERE lead_id = $lead_id");
    $row = $result->fetch_assoc();
    return (int)$row['max_id'];
}

function sectionName($conn, $section_id) {
    $stmt = $conn->prepare("SELECT name FROM sections WHERE id = ?");
    $stmt->bind_param('i', $section_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    return $row['name'];
}

function fetchFieldUpdates($conn, $lead_id, $section_id = null) {
    $query = "SELECT field_id, group_id, value FROM field_updates WHERE lead_id = ?";
    if ($section_id !== null) {
        $query .= " AND field_id IN (SELECT id FROM custom_fields WHERE section_id = ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $lead_id, $section_id);
    } else {
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $lead_id);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $updates = [];

    while ($row = $result->fetch_assoc()) {
        $updates[] = $row;
    }

    return $updates;
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

function fetchCustomFields($conn, $section_id = null, $template_id = null) {
    $where = $template_id ? "WHERE (cf.section_id = ? OR cf.section_id = 0) AND cf.template_id = ?" : "";

    $query = "
        SELECT cf.*, ct.name as case_type, f.name as field_name, f.type as field_type
        FROM custom_fields cf
        JOIN case_types ct ON cf.case_type_id = ct.id
        JOIN fields f ON cf.field_id = f.id
        $where
        ORDER BY cf.case_type_id, cf.order_id
    ";

    if ($section_id) {
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ii', $section_id, $template_id);
    } else {
        $query = str_replace($where, '', $query);
        $stmt = $conn->prepare($query);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $customFields = [];
    while ($row = $result->fetch_assoc()) {
        $customFields[] = $row;
    }

    return $customFields;
}

function fetchAllFields($conn, $template_id) {
    $sql = "SELECT * FROM custom_fields WHERE template_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $template_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $fields = [];
    while ($row = $result->fetch_assoc()) {
        $fields[] = $row;
    }
    return $fields;
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