<?php
require './db.php';
session_start();

header("Content-Type: application/json");

$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['user'], $input['password'])) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $username = $conn->real_escape_string($input['user']);
    $password = $input['password'];

    if (empty($username) || empty($password)) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $sql = "SELECT id, password FROM users WHERE LOWER(user) = LOWER(?) OR LOWER(email) = LOWER(?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['password'])) {
            $_SESSION['id'] = $row['id'];
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Invalid credentials"]);
        }
    } else {
        echo json_encode(["error" => "User not found"]);
    }
} else if ($requestMethod === 'GET') {
    if (isset($_GET['users'])) {
        $sql = "SELECT user, id, name, access_level FROM users WHERE access_level != 'no access'";
        $result = $conn->query($sql);

        $users = [];

        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode(["users" => $users]);
        exit;
    }
    if (!isset($_GET['user'])) {
        echo json_encode(["error" => "Username is required"]);
        exit;
    }

    $user = $conn->real_escape_string($_GET['user']);

    $sql = "SELECT COUNT(*) AS user_exists FROM users WHERE user = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row['user_exists'] > 0) {
        echo json_encode(["exists" => true]);
    } else {
        echo json_encode(["exists" => false]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

$conn->close();
?>