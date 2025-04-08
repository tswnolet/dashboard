<?php
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = 'SELECT * FROM billing_rates';
    $result = $conn->query($sql);
    
    $rates = [];
    while ($row = $result->fetch_assoc()) {
        $rates[] = $row;
    }

    echo json_encode([
        'success' => true,
        'billing_rates' => $rates
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['name'] ?? '';
    $default = $input['def'] ?? 0;

    if (!$name) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing name'
        ]);
        exit;
    }

    if (intval($default) == 1) {
        $conn->query("UPDATE billing_rates SET def = 0");
    }

    $stmt = $conn->prepare('INSERT INTO billing_rates (name, def) VALUES (?, ?)');
    $stmt->bind_param('si', $name, $default);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $stmt->error
        ]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    
}