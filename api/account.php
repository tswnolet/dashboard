<?php
require './db.php';
session_start();

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $updates = [];

    if (!empty($input['user'])) {
        $user = $conn->real_escape_string($input['user']);
        $updates[] = "user = '$user'";
    }
    if (!empty($input['email'])) {
        $email = $conn->real_escape_string($input['email']);
        $updates[] = "email = '$email'";
    }
    if (!empty($input['password'])) {
        $password = password_hash($conn->real_escape_string($input['password']), PASSWORD_DEFAULT);
        $updates[] = "password = '$password'";
    }

    if (count($updates) > 0) {
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = {$_SESSION['user_id']}";
        if ($conn->query($sql) === TRUE) {
            echo json_encode(['success' => true, 'message' => 'Account updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating account', 'error' => $conn->error]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes were made']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT user, name, email FROM users WHERE id = {$_SESSION['user_id']}";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $data = $result->fetch_assoc();
        echo json_encode($data);
    } else {
        echo json_encode(['success' => false, 'message' => 'No account found']);
    }
}

$conn->close();
?>