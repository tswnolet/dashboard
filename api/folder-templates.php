<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $templateId = isset($_GET['template_id']) ? intval($_GET['template_id']) : 0;

    if ($templateId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid template_id']);
        exit;
    }

    $folders = [];

    $query = "SELECT * FROM folder_templates WHERE template_id = ? ORDER BY id ASC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $templateId);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $folders[] = $row;
    }

    echo json_encode(['success' => true, 'folders' => $folders]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $templateId = isset($data['template_id']) ? intval($data['template_id']) : 0;
    $parentFolderId = isset($data['parent_folder_id']) ? intval($data['parent_folder_id']) : null;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $folderAccess = isset($data['folder_access']) ? trim($data['folder_access']) : 'Standard';

    if (empty($templateId) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $query = "INSERT INTO folder_templates (template_id, parent_folder_id, name, folder_access) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("iiss", $templateId, $parentFolderId, $name, $folderAccess);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Folder created']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create folder']);
    }
    exit;
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $folderId = isset($data['id']) ? intval($data['id']) : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';

    if ($folderId <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Invalid folder id or name']);
        exit;
    }

    $query = "UPDATE folder_templates SET name = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $name, $folderId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Folder name updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update folder name']);
    }
    exit;
}

if ($method === 'DELETE') {
    parse_str(file_get_contents('php://input'), $data);
    $folderId = isset($data['id']) ? intval($data['id']) : 0;

    if ($folderId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid folder id']);
        exit;
    }

    $checkChildrenQuery = "SELECT COUNT(*) AS children_count FROM folder_templates WHERE parent_folder_id = ?";
    $checkStmt = $conn->prepare($checkChildrenQuery);
    $checkStmt->bind_param("i", $folderId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();

    if ($checkRow['children_count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete folder with subfolders']);
        exit;
    }

    $deleteQuery = "DELETE FROM folder_templates WHERE id = ?";
    $stmt = $conn->prepare($deleteQuery);
    $stmt->bind_param("i", $folderId);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Folder deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete folder']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Unsupported method']);
exit;
