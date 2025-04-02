<?php
require 'headers.php';
require './db.php';
require './user_functions.php';

session_start();
header('Content-Type: application/json');

$startDate = $_GET["startDate"] ?? null;
$endDate = $_GET["endDate"] ?? "3000-01-01";
$userId = $_SESSION['id'] ?? 1;

$response = fetchUserData($conn, $userId, $startDate, $endDate);

$conn->close();

echo json_encode($response, JSON_PRETTY_PRINT);
?>