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

    if (!isset($input['name'], $input['email'], $input['password'])) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $password = trim($input['password']);

    // Validate inputs
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(["error" => "All fields are required"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["error" => "Invalid email address"]);
        exit;
    }

    // Generate username from email
    $username = strstr($email, '@', true);

    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Check if the email or username already exists
    $checkSql = "SELECT COUNT(*) AS count FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(user) = LOWER(?)";
    $stmt = $conn->prepare($checkSql);
    $stmt->bind_param("ss", $email, $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row['count'] > 0) {
        echo json_encode(["error" => "Email or username already exists"]);
        exit;
    }

    // Insert the new user
    $insertSql = "INSERT INTO users (name, user, email, password) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($insertSql);
    $stmt->bind_param("ssss", $name, $username, $email, $passwordHash);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "id" => $conn->insert_id]);
    } else {
        echo json_encode(["error" => "Failed to register user"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

$conn->close();
?>