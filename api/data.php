<?php
header('Content-Type: application/json');

// Database credentials
$host = 'localhost';
$db = 'tpugramy_social';
$user = 'tpugramy_social';
$pass = 'Dalyblack300!';

// Create connection
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed', 'error' => $conn->connect_error]));
}

// Fetch data from the table
$sql = 'SELECT * FROM data';
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode(['data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'No data found']);
}

$conn->close();
?>
