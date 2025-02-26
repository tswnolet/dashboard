<?php
include 'db.php';
session_start();

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
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
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $sql = "INSERT INTO templates (name, aka, description, visibility, `default`, favorite) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssii", $input['name'], $input['aka'], $input['description'], $input['visibility'], $input['default'], $input['favorite']);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Layout created successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error creating layout', 'error' => $conn->error]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    $sql = "UPDATE templates SET name = ?, aka = ?, description = ?, visibility = ?, `default` = ?, favorite = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssiii", $input['name'], $input['aka'], $input['description'], $input['visibility'], $input['default'], $input['favorite'], $input['id']);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Layout updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating layout', 'error' => $conn->error]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);

    $sql = "DELETE FROM templates WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $input['id']);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Layout deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error deleting layout', 'error' => $conn->error]);
    }

    $stmt->close();
}

$conn->close();
?>