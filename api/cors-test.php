<?php
require 'headers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode(['success' => true, 'message' => 'CORS Test']);
