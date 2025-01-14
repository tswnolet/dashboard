<?php
$servername = "localhost";
$username = "tpugramy_social";
$password = "tpugramy_social";
$dbname = "Dalyblack300!";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$user_id = $_SESSION['user_id'];
$sql = "SELECT user, email FROM user WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$stmt->bind_result($username, $email);
$stmt->fetch();
$stmt->close();
$conn->close();

header('Content-Type: application/json');
echo json_encode(['user' => $username, 'email' => $email]);
?>