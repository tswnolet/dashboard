<?php
require 'headers.php';
require './db.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM marketing_sources ORDER BY order_id ASC";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $marketing_sources = [];
        while ($row = $result->fetch_assoc()) {
            $marketing_sources[] = $row;
        }
        echo json_encode(['success' => true, 'marketing_sources' => $marketing_sources]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No marketing sources found']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $source_name = $input['source_name'] ?? '';
    $marketing_type = $input['marketing_type'] ?? '';
    $description = $input['description'] ?? '';
    $template_id = $input['template_id'] ?? '';
    $requested_order_id = $input['order_id'] ?? null;

    if (empty($source_name)) {
        echo json_encode(['success' => false, 'message' => 'Source name is required']);
        exit;
    }

    if ($requested_order_id === null) {
        $stmt = $conn->prepare("SELECT COALESCE(MAX(order_id), 0) + 1 FROM marketing_sources WHERE template_id = ?");
        $stmt->bind_param("i", $template_id);
        $stmt->execute();
        $stmt->bind_result($requested_order_id);
        $stmt->fetch();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("UPDATE marketing_sources SET order_id = order_id + 1 WHERE template_id = ? AND order_id >= ?");
        $stmt->bind_param("ii", $template_id, $requested_order_id);
        $stmt->execute();
    }

    $stmt = $conn->prepare("
        INSERT INTO marketing_sources (source_name, marketing_type, description, template_id, order_id) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sisii', $source_name, $marketing_type, $description, $template_id, $requested_order_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Marketing source created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create marketing source', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['moved_source_id'], $input['original_order_id'], $input['target_order_id'], $input['template_id'])) {
        $conn->begin_transaction();
        try {
            $movedSourceId = $input['moved_source_id'];
            $originalOrderId = $input['original_order_id'];
            $targetOrderId = $input['target_order_id'];
            $templateId = $input['template_id'];

            $stmtTemp = $conn->prepare("UPDATE marketing_sources SET order_id = NULL WHERE id = ?");
            $stmtTemp->bind_param("i", $movedSourceId);
            $stmtTemp->execute();

            if ($targetOrderId < $originalOrderId) {
                for ($i = $originalOrderId - 1; $i >= $targetOrderId; $i--) {
                    $newOrderId = $i + 1;
                    $stmt = $conn->prepare("UPDATE marketing_sources SET order_id = ? WHERE template_id = ? AND order_id = ?");
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            } else {
                for ($i = $originalOrderId + 1; $i <= $targetOrderId; $i++) {
                    $newOrderId = $i - 1;
                    $stmt = $conn->prepare("UPDATE marketing_sources SET order_id = ? WHERE template_id = ? AND order_id = ?");
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            }

            $stmt = $conn->prepare("UPDATE marketing_sources SET order_id = ? WHERE id = ?");
            $stmt->bind_param("ii", $targetOrderId, $movedSourceId);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Marketing sources reordered successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error reordering marketing sources', 'error' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id'])) {
        $stmt = $conn->prepare("DELETE FROM marketing_sources WHERE id = ?");
        $stmt->bind_param("i", $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Marketing source deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting marketing source', 'error' => $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing marketing source ID']);
    }
}

$conn->close();
?>