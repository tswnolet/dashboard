<?php
require './db.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM leads";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $leads = [];
        while ($row = $result->fetch_assoc()) {
            $leads[] = $row;
        }
        echo json_encode(['success' => true, 'leads' => $leads]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No leads found']);
    }
    exit;
}