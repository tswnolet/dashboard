<?php
require 'headers.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$API_KEY = "8b95d7f1";
$FORM_URL = "https://dalyblack.leaddocket.com/Opportunities/Form/14?apikey=$API_KEY";

function fetchLeadDetails($id) {
    $url = "https://dalyblack.leaddocket.com/leads/$id";
    $headers = [
        "accept: application/json",
        "api_key: f6fb37e9-58c9-418d-95a6-f867f8516850"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status == 200) {
        echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
    } else {
        http_response_code($status);
        echo json_encode(["error" => "Failed to fetch lead details"], JSON_PRETTY_PRINT);
    }
}

function submitLeadData($data) {
    global $FORM_URL;
    $ch = curl_init($FORM_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/x-www-form-urlencoded"]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status == 200) {
        echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
    } else {
        http_response_code($status);
        echo json_encode(["error" => "Failed to submit lead data"], JSON_PRETTY_PRINT);
    }
}

$requestMethod = $_SERVER["REQUEST_METHOD"];

if ($requestMethod == "GET" && isset($_GET['id'])) {
    fetchLeadDetails($_GET['id']);
} elseif ($requestMethod == "POST") {
    $data = [];
    parse_str(file_get_contents("php://input"), $data);
    submitLeadData($data);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Not found"], JSON_PRETTY_PRINT);
}
?>