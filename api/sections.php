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

        $sections = [];
        while ($row = $result->fetch_assoc()) {
            $sections[] = $row;
        }

        $phases = [];
        while ($row = $result2->fetch_assoc()) {
            $phases[] = $row;
        }

        echo json_encode(['success' => true, 'sections' => $sections, 'phases' => $phases]);
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

    if (isset($input['name'], $input['template_id'], $input['order_id'])) {
        $sql = "INSERT INTO sections (name, template_id, order_id) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $input['name'], $input['template_id'], $input['order_id']);
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
    } else {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id'])) {
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