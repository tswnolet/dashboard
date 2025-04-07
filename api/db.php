<?php
$host = 'db-casedb.cq58cae80fw0.us-east-1.rds.amazonaws.com';
$dbUsername = 'admin';
$dbPassword = 'Scorpius1!';
$dbName = 'casedb';

$conn = new mysqli($host, $dbUsername, $dbPassword, $dbName);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Database connection failed"]));
}

if (!$conn->set_charset("utf8")) {
    http_response_code(500);
    die(json_encode(["error" => "Error loading character set utf8: " . $conn->error]));
}
?>