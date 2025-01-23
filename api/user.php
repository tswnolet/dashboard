<?php
session_set_cookie_params([
    'lifetime' => 365 * 24 * 60 * 60, // 1 year
    'path' => '/',
    'domain' => '*', // Your domain
    'secure' => true, // For HTTPS
    'httponly' => true,
    'samesite' => 'None', // Required for cross-origin
]);
session_start();

require './headers.php';
require './db.php';

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