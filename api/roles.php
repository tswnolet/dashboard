<?php
require 'headers.php';
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM roles ORDER BY order_id ASC";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $roles = [];
        while ($row = $result->fetch_assoc()) {
            $roles[] = [
                'id' => (int)$row['id'],
                'role' => $row['role'],
                'order_id' => (int)$row['order_id'],
            ];
        }
        echo json_encode(['success' => true, 'roles' => $roles]);
    } else {
        echo json_encode(['success' => false, 'roles' => []]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
exit;
?>
