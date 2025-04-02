<?php
require 'headers.php';
include 'db.php';

$conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (!isset($_GET['ids']) || empty($_GET['ids'])) {
    echo json_encode(['error' => 'No school IDs provided']);
    exit;
}

$schoolIds = explode(',', $_GET['ids']);
$schoolIds = array_map('intval', $schoolIds);
$schoolIdsString = implode(',', $schoolIds);

$sql = "
    SELECT 
        id,
        school_name,
        district_name,
        address,
        city,
        county,
        enrollment,
        district_size
    FROM 
        schools
    WHERE 
        id IN ($schoolIdsString)
";

if ($result = $conn->query($sql)) {
    $data = array();

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($data);
    $result->free();
} else {
    echo json_encode(['error' => 'Query execution failed: ' . $conn->error]);
}

$conn->close();
?>