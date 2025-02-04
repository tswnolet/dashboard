<?php
require './functions.php';

function getUserPreferences($conn, $userId) {
    $sql = "SELECT data_preferences FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return json_decode($result['data_preferences'], true)['data'] ?? [];
}

function getAvailableFunctions($conn, $userFunctions) {
    if (empty($userFunctions)) return [];

    $placeholders = implode(',', array_fill(0, count($userFunctions), '?'));
    $sql = "SELECT id, function_name FROM data_functions WHERE id IN ($placeholders)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat("i", count($userFunctions)), ...$userFunctions);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function fetchUserData($conn, $userId, $startDate, $endDate) {
    $userFunctions = getUserPreferences($conn, $userId);
    
    if (empty($userFunctions)) {
        return ["success" => false, "message" => "No data selected"];
    }

    $functions = getAvailableFunctions($conn, $userFunctions);
    $data = ["success" => true];

    foreach ($functions as $func) {
        $funcName = $func['function_name'];

        if (function_exists($funcName)) {
            $data[$funcName] = $funcName($conn, $startDate, $endDate);
        } else {
            $data[$funcName] = "Function not found";
        }
    }

    return $data;
}
?>