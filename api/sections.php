<?php
include 'db.php';
session_start();

header("Content-Type: application/json");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => "Connection failed: " . $conn->connect_error]));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['template_id']) && !empty($_GET['template_id'])) {
        $template_id = intval($_GET['template_id']);

        $sql = "SELECT * FROM sections WHERE template_id = ? ORDER BY order_id ASC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $template_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $sql2 = "SELECT * FROM phases WHERE template_id = ? ORDER BY order_id ASC";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param("i", $template_id);
        $stmt2->execute();
        $result2 = $stmt2->get_result();

        $sql3 = "SELECT * FROM vitals WHERE template_id = ?";
        $stmt3 = $conn->prepare($sql3);
        $stmt3->bind_param("i", $template_id);
        $stmt3->execute();
        $result3 = $stmt3->get_result();

        $sections = [];
        while ($row = $result->fetch_assoc()) {
            $sections[] = $row;
        }

        $phases = [];
        while ($row = $result2->fetch_assoc()) {
            $phases[] = $row;
        }

        $vitals = [];
        while ($row = $result3->fetch_assoc()) {
            $vitals[] = $row;
        }

        echo json_encode(['success' => true, 'sections' => $sections, 'phases' => $phases,'vitals' => $vitals]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No template_id provided']);
        exit;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['add_field'])) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['name'], $input['section_id'], $input['field_id'], $input['order_id'], $input['rules'])) {
        $rules = json_encode($input['rules']);
        $sql = "INSERT INTO field_map (name, section_id, field_id, order_id, rules) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("siiis", $input['name'], $input['section_id'], $input['field_id'], $input['order_id'], $rules);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Field added to section']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error adding field', 'error' => $conn->error]);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $icon = $input['icon'] ?? 'Star';
    $description = $input['description'] ?? '';

    if (isset($input['name'], $input['template_id'], $input['order_id'])) {
        $sql = "INSERT INTO sections (name, icon, template_id, description, order_id) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssisi", $input['name'], $icon, $input['template_id'], $description, $input['order_id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section created successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating section', 'error' => $conn->error]);
        }
    } elseif (isset($input['phase'], $input['description'], $input['template_id'], $input['order_id'])) {
        $sql = "INSERT INTO phases (phase, description, template_id, order_id) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssii", $input['phase'], $input['description'], $input['template_id'], $input['order_id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Phase created successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating phase', 'error' => $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id'], $input['name'], $input['description'], $input['order_id'], $input['icon'])) {
        $sql = "UPDATE sections SET name = ?, description = ?, order_id = ?, icon = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssisi", $input['name'], $input['description'], $input['order_id'], $input['icon'], $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating section', 'error' => $conn->error]);
        }
    } elseif (isset($input['id'], $input['phase'], $input['description'], $input['order_id'])) {
        $sql = "UPDATE phases SET phase = ?, description = ?, order_id = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssii", $input['phase'], $input['description'], $input['order_id'], $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Phase updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating phase', 'error' => $conn->error]);
        }
    } elseif (isset($input['phases'])) {
        $conn->begin_transaction();
        try {
            $movedPhaseId = $input['moved_phase_id'];
            $sqlTemp = "UPDATE phases SET order_id = NULL WHERE id = ?";
            $stmtTemp = $conn->prepare($sqlTemp);
            $stmtTemp->bind_param("i", $movedPhaseId);
            $stmtTemp->execute();

            $originalOrderId = $input['original_order_id'];
            $targetOrderId = $input['target_order_id'];
            $templateId = $input['template_id'];

            if ($targetOrderId < $originalOrderId) {
                for ($i = $originalOrderId - 1; $i >= $targetOrderId; $i--) {
                    $newOrderId = $i + 1;
                    $sql = "UPDATE phases SET order_id = ? WHERE template_id = ? AND order_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            } else {
                for ($i = $originalOrderId + 1; $i <= $targetOrderId; $i++) {
                    $newOrderId = $i - 1;
                    $sql = "UPDATE phases SET order_id = ? WHERE template_id = ? AND order_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            }

            $sql = "UPDATE phases SET order_id = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $targetOrderId, $movedPhaseId);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Phases reordered successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error reordering phases', 'error' => $e->getMessage()]);
        }
    } elseif (isset($input['sections'])) {
        $conn->begin_transaction();
        try {
            $movedSectionId = $input['moved_section_id'];
            $sqlTemp = "UPDATE sections SET order_id = NULL WHERE id = ?";
            $stmtTemp = $conn->prepare($sqlTemp);
            $stmtTemp->bind_param("i", $movedSectionId);
            $stmtTemp->execute();

            $originalOrderId = $input['original_order_id'];
            $targetOrderId = $input['target_order_id'];
            $templateId = $input['template_id'];

            if ($targetOrderId < $originalOrderId) {
                for ($i = $originalOrderId - 1; $i >= $targetOrderId; $i--) {
                    $newOrderId = $i + 1;
                    $sql = "UPDATE sections SET order_id = ? WHERE template_id = ? AND order_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            } else {
                for ($i = $originalOrderId + 1; $i <= $targetOrderId; $i++) {
                    $newOrderId = $i - 1;
                    $sql = "UPDATE sections SET order_id = ? WHERE template_id = ? AND order_id = ?";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("iii", $newOrderId, $templateId, $i);
                    $stmt->execute();
                }
            }

            $sql = "UPDATE sections SET order_id = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ii", $targetOrderId, $movedSectionId);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Sections reordered successfully']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error reordering sections', 'error' => $e->getMessage()]);
        }
    } elseif (isset($input['section_id'], $input['id'], $input['template_id'], $input['order_id'])) {
        $sql = "UPDATE custom_fields SET section_id = ?, order_id = ?, template_id = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiii", $input['section_id'], $input['order_id'], $input['template_id'], $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Field updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating field', 'error' => $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if(isset($_GET['phase_id'])) {
        $sql = "DELETE FROM phases WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $_GET['phase_id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Phase deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting phase', 'error' => $conn->error]);
        }
    } elseif (isset($input['id'])) {
        $sql = "DELETE FROM sections WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting section', 'error' => $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing section ID']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>