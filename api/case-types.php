<?php
require 'headers.php';
require 'db.php';

$query = "SELECT id, name, aka, description FROM case_types";
$result = $conn->query($query);

$caseTypes = [];
while ($row = $result->fetch_assoc()) {
    $caseTypes[] = $row;
}

echo json_encode(['case_types' => $caseTypes]);

$conn->close();
exit;