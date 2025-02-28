<?php
include 'db.php';
session_start();

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['template_id'])) {
        $template_id = intval($_GET['template_id']);
        $sql = "SELECT * FROM template_sections WHERE template_id = ? ORDER BY order_id ASC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $template_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $sections = [];
        while ($row = $result->fetch_assoc()) {
            $sections[] = $row;
        }

        echo json_encode(['success' => true, 'sections' => $sections, 'phases' => $phases]);
    } else {
        $sql = "SELECT * FROM templates";
        $result = $conn->query($sql);

        if ($result->num_rows > 0) {
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            echo json_encode(['success' => true, 'templates' => $data]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No layout found']);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['name'], $input['template_id'], $input['order_id'])) {
        $sql = "INSERT INTO template_sections (name, template_id, order_id) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $input['name'], $input['template_id'], $input['order_id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error adding section', 'error' => $conn->error]);
        }
    } else {
        $sql = "INSERT INTO templates (name, aka, description, visibility, `default`, favorite) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssii", $input['name'], $input['aka'], $input['description'], $input['visibility'], $input['default'], $input['favorite']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Layout created successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error creating layout', 'error' => $conn->error]);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id'], $input['name'], $input['order_id'])) {
        $sql = "UPDATE template_sections SET name = ?, order_id = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $input['name'], $input['order_id'], $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating section', 'error' => $conn->error]);
        }
    } else {
        $sql = "UPDATE templates SET name = ?, aka = ?, description = ?, visibility = ?, `default` = ?, favorite = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssiii", $input['name'], $input['aka'], $input['description'], $input['visibility'], $input['default'], $input['favorite'], $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Layout updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating layout', 'error' => $conn->error]);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id']) && isset($input['is_section']) && $input['is_section'] === true) {
        $sql = "DELETE FROM template_sections WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Section deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting section', 'error' => $conn->error]);
        }
    } else {
        $sql = "DELETE FROM templates WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $input['id']);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Layout deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error deleting layout', 'error' => $conn->error]);
        }
    }
}

$conn->close();
?>