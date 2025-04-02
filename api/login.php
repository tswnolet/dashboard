<?php
require 'headers.php';
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['user'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    error_log('Missing required fields');
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$stmt = $conn->prepare('SELECT id, name, password, access_level FROM users WHERE user = ? OR email = ?');
$stmt->bind_param('ss', $username, $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    error_log('Invalid username or password');
    echo json_encode(['success' => false, 'error' => 'Invalid username or password']);
    exit;
}

$stmt->bind_result($userId, $name, $hashedPassword, $accessLevel);
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

$token = bin2hex(random_bytes(16));
$stmt = $conn->prepare('UPDATE users SET token = ? WHERE id = ?');
$stmt->bind_param('si', $token, $userId);

if ($stmt->execute()) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '.casedb.co',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None'
    ]);
    session_start();
    $_SESSION['user_id'] = $userId;
    $_SESSION['name'] = $name;
    $_SESSION['access_level'] = $accessLevel;
    echo json_encode(['success' => true, 'token' => $token, 'name' => $name, 'user_id' => $userId, 'access_level' => $accessLevel]);
} else {
    error_log('Failed to update token');
    echo json_encode(['success' => false, 'error' => 'Failed to update token']);
}

$stmt->close();
$conn->close();
?>
