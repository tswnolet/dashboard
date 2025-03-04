<?php
require './functions.php';

function getUserPreferences($conn, $userId) {
    $sql = "SELECT data_preferences FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $preferences = json_decode($result['data_preferences'], true)['data'] ?? [];
    
    if (in_array("all", $preferences)) {
        return getAllFunctionIds($conn);
    }
    
    return $preferences;
}

function getAllFunctionIds($conn) {
    $sql = "SELECT id FROM data_functions";
    $result = $conn->query($sql);
    
    $allFunctions = [];
    while ($row = $result->fetch_assoc()) {
        $allFunctions[] = $row['id'];
    }
    
    return $allFunctions;
}

function getAvailableFunctions($conn, $userFunctions) {
    if (empty($userFunctions)) return [];

    $placeholders = implode(',', array_fill(0, count($userFunctions), '?'));
    $sql = "SELECT id, function_name, display_name FROM data_functions WHERE id IN ($placeholders)";

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

    $sqlDateDiff = "SELECT DATEDIFF('$endDate', '$startDate') AS daysDiff";
    $resultDateDiff = $conn->query($sqlDateDiff);
    $dateDiff = $resultDateDiff->fetch_assoc()['daysDiff'] ?? 365;

    $timePeriod = "All Time";
    if ($dateDiff <= 7) {
        $timePeriod = "Day";
    } elseif ($dateDiff <= 30) {
        $timePeriod = "Week";
    } elseif ($dateDiff <= 365) {
        $timePeriod = "Month";
    }

    foreach ($functions as $func) {
        $funcName = $func['function_name'];
        $displayName = $func['display_name'];

        if (function_exists($funcName)) {
            $title = $displayName;
            if ($startDate && $endDate && strpos($displayName, 'Average') !== false) {
                $formattedStartDate = $dateDiff <= 365 ? date('d M', strtotime($startDate)) : $startDate;
                $formattedEndDate = $dateDiff <= 365 ? date('d M', strtotime($endDate)) : $endDate;
                $title .= " per $timePeriod from $formattedStartDate to $formattedEndDate";
            }
            $data[$funcName] = $funcName($conn, $startDate, $endDate);
        } else {
            $data[$funcName] = [
                "title" => $displayName,
                "data" => "Function not found"
            ];
        }
    }

    return $data;
}

function processFunctionData($data, $funcName) {
    switch ($funcName) {
        case 'casesByLocation':
            return processCasesByLocation($data);
        case 'totalSettlement':
            return processTotalSettlement($data);
        default:
            return $data;
    }
}
?>