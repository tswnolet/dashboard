<?php
$host = 'localhost';
$dbUsername = 'lehzrxmy_DB';
$dbPassword = 'Dalyblack300!';
$dbName = 'lehzrxmy_WPSGZ';

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