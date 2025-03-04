<?php
require 'db.php';

function getFolderTemplate($templateId) {
    global $conn;
    $folders = [];

    $query = "SELECT * FROM folder_templates WHERE template_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $templateId);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $path = $row['name'];
        $parentId = $row['parent_folder_id'];

        while ($parentId) {
            $parentQuery = "SELECT * FROM folder_templates WHERE id = ?";
            $parentStmt = $conn->prepare($parentQuery);
            $parentStmt->bind_param("i", $parentId);
            $parentStmt->execute();
            $parentResult = $parentStmt->get_result();
            if ($parentRow = $parentResult->fetch_assoc()) {
                $path = $parentRow['name'] . '/' . $path;
                $parentId = $parentRow['parent_folder_id'];
            } else {
                break;
            }
        }

        $folders[] = $path;
    }

    return $folders;
}