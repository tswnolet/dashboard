<?php
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['user'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    error_log('Missing required fields');
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Check if the user exists
$stmt = $conn->prepare('SELECT id, password, access_level FROM users WHERE user = ?');
$stmt->bind_param('s', $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    error_log('Invalid username or password');
    echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
    exit;
}

$stmt->bind_result($userId, $hashedPassword, $accessLevel);
$stmt->fetch();

if (!password_verify($password, $hashedPassword)) {
    error_log('Invalid username or password');
    echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
    exit;
}

if ($accessLevel === 'no access') {
    error_log('Waiting for Admin Approval');
    echo json_encode(['success' => false, 'error' => 'Waiting for Admin Approval']);
    exit;
}

// Generate a token for the session
$token = bin2hex(random_bytes(16));
$stmt = $conn->prepare('UPDATE users SET token = ? WHERE id = ?');
$stmt->bind_param('si', $token, $userId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'token' => $token]);
} else {
    error_log('Failed to update token');
    echo json_encode(['success' => false, 'error' => 'Failed to update token']);
}

$stmt->close();
$conn->close();
?>
