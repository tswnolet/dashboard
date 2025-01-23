<?php
require './headers.php';
require './db.php';
session_start(); // Add this line to start the session

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $title = $conn->real_escape_string($input['title']);
    $value = $conn->real_escape_string($input['value']);
    $col = (int)$input['col'];
    $row = (int)$input['row'];
    $startDate = $conn->real_escape_string($input['startDate']);
    $endDate = $conn->real_escape_string($input['endDate']);

    $sql = "INSERT INTO data (title, value, col, `row`, startDate, endDate) VALUES ('$title', '$value', $col, $row, '$startDate', '$endDate')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true, 'data' => $input]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding data', 'error' => $conn->error]);
    }
} else {
    $sql = 'SELECT * FROM data';
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $value = [];
        while ($row = $result->fetch_assoc()) {
            $value[] = $row;
        }
        echo json_encode(['data' => $value]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No data found']);
    }
}

$conn->close();
?>
