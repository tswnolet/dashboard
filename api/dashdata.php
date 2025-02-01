<?php
require './db.php';
session_start();
header('Content-Type: application/json');

function fetchTotalSettlement($conn) {
    // Get the average suit percentage for cases where it exists
    $sqlAvg = "SELECT AVG(suit_percentage / 100) AS avgSuitPercentage FROM cases WHERE suit_percentage / 100 IS NOT NULL";
    $resultAvg = $conn->query($sqlAvg);
    $avgSuitPercentage = $resultAvg->fetch_assoc()['avgSuitPercentage'] ?? 1.0; // Default to 1.0 if no data

    // Calculate the total adjusted settlement using suit_percentage if available, otherwise use the average
    $sql = "SELECT SUM(
                settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)
            ) AS totalAdjustedSettlement 
            FROM cases 
            WHERE settlement_amount IS NOT NULL";
    
    $result = $conn->query($sql);
    return $result->fetch_assoc()['totalAdjustedSettlement'] ?? 0;
}

// Fetch cases by location
function fetchCasesByLocation($conn) {
    $sql = "SELECT location, COUNT(*) AS count FROM cases GROUP BY location";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $state = $row['location'];
        if (!in_array($state, ['TX', 'LA', 'CO', 'FL'])) {
            $state = 'TX'; // Assign all unknown states to TX
        }
        $data[$state] = ($data[$state] ?? 0) + intval($row['count']);
    }
    return $data;
}

// Fetch cases by practice type
function fetchCasesByPracticeType($conn) {
    $sql = "SELECT practice_type, COUNT(*) AS count FROM cases GROUP BY practice_type";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $type = $row['practice_type'];
        if (in_array($type, ["First Party", "First Party *", "NCA", "NCA*"])) {
            $category = "First Party";
        } elseif ($type === "Personal Injury (PI)") {
            $category = "Personal Injury";
        } elseif (in_array($type, ["Medical Malpractice", "NEC", "MedMal"])) {
            $category = "Med Mal";
        } else {
            $category = "Other";
        }
        $data[$category] = ($data[$category] ?? 0) + intval($row['count']);
    }
    return $data;
}

// Fetch cases by status
function fetchCasesByStatus($conn) {
    $sql = "SELECT phase AS status, COUNT(*) AS count FROM cases GROUP BY phase";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['status']] = intval($row['count']);
    }
    return $data;
}

// Fetch settlements over time
function fetchSettlementsOverTime($conn) {
    $sql = "SELECT DATE_FORMAT(settlement_date, '%Y-%m') AS month, 
                   SUM(settlement_amount) AS total_settlement
            FROM cases 
            WHERE settlement_date IS NOT NULL 
            GROUP BY DATE_FORMAT(settlement_date, '%Y-%m')
            ORDER BY MIN(settlement_date) ASC";

    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['month']] = floatval($row['total_settlement']);
    }
    return $data;
}

// Fetch new cases vs closed cases over time
function fetchCasesOpenedVsClosed($conn) {
    $sql = "SELECT 
                DATE_FORMAT(creation_date, '%Y-%m') AS month, 
                COUNT(*) AS new_cases 
            FROM cases 
            GROUP BY DATE_FORMAT(creation_date, '%Y-%m') 
            ORDER BY MIN(creation_date) ASC";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['month']] = [$row['new_cases'], 0]; // Placeholder for closed cases
    }

    // Fetch closed cases per month
    $sqlClosed = "SELECT DATE_FORMAT(settlement_date, '%Y-%m') AS month, 
                         COUNT(*) AS closed_cases
                  FROM cases 
                  WHERE settlement_date IS NOT NULL 
                  GROUP BY DATE_FORMAT(settlement_date, '%Y-%m')";
    $resultClosed = $conn->query($sqlClosed);

    while ($row = $resultClosed->fetch_assoc()) {
        if (isset($data[$row['month']])) {
            $data[$row['month']][1] = intval($row['closed_cases']);
        } else {
            $data[$row['month']] = [0, intval($row['closed_cases'])]; // Handle missing new cases
        }
    }

    return $data;
}

// Fetch case outcome breakdown (Fixed!)
function fetchCaseOutcomes($conn) {
    $sql = "SELECT phase AS outcome, COUNT(*) AS total_cases 
            FROM cases 
            WHERE phase IS NOT NULL AND phase != '' 
            GROUP BY phase";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['outcome']] = intval($row['total_cases']);
    }
    return $data;
}

// Fetch case duration analysis
function fetchCaseDuration($conn) {
    $sql = "SELECT 
                CASE 
                    WHEN DATEDIFF(settlement_date, creation_date) <= 30 THEN '0-1 Month'
                    WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 31 AND 90 THEN '1-3 Months'
                    WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 91 AND 180 THEN '3-6 Months'
                    WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 181 AND 365 THEN '6-12 Months'
                    ELSE '1+ Year'
                END AS duration_category,
                COUNT(*) AS total_cases
            FROM cases 
            WHERE settlement_date IS NOT NULL
            GROUP BY duration_category
            ORDER BY MIN(DATEDIFF(settlement_date, creation_date)) ASC";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['duration_category']] = intval($row['total_cases']);
    }
    return $data;
}

function fetchLeadsVsCases($conn) {
    $sql = "SELECT 
                DATE_FORMAT(creation_date, '%b') AS month, 
                COUNT(*) AS new_cases 
            FROM cases 
            GROUP BY DATE_FORMAT(creation_date, '%b') 
            ORDER BY MIN(creation_date) ASC";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['month']] = [$row['new_cases'], 0];
    }

    $sqlSettlements = "SELECT DATE_FORMAT(settlement_date, '%b') AS month, COUNT(*) AS settlements
                       FROM cases 
                       WHERE settlement_date IS NOT NULL 
                       GROUP BY DATE_FORMAT(settlement_date, '%b')";
    $resultSettlements = $conn->query($sqlSettlements);
    
    while ($row = $resultSettlements->fetch_assoc()) {
        if (isset($data[$row['month']])) {
            $data[$row['month']][1] = intval($row['settlements']);
        }
    }

    return $data;
}

function fetchAvgSettlementByPractice($conn) {
    $sql = "SELECT 
                CASE 
                    WHEN practice_type IN ('First Party', 'First Party *', 'NCA', 'NCA*') THEN 'First Party'
                    WHEN practice_type = 'Personal Injury (PI)' THEN 'Personal Injury'
                    WHEN practice_type IN ('Medical Malpractice', 'NEC', 'MedMal') THEN 'Med Mal'
                    ELSE 'Other' 
                END AS practice_category,
                AVG(settlement_amount) AS avg_settlement
            FROM cases 
            WHERE settlement_amount IS NOT NULL
            GROUP BY practice_category";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['practice_category']] = floatval($row['avg_settlement']);
    }
    return $data;
}

// Add to response
$response = [
    "success" => true,
    "totalSettlement" => fetchTotalSettlement($conn),
    "casesByLocation" => fetchCasesByLocation($conn),
    "casesByPracticeType" => fetchCasesByPracticeType($conn),
    "casesByStatus" => fetchCasesByStatus($conn),
    "leadsVsCases" => fetchLeadsVsCases($conn),
    "settlementsOverTime" => fetchSettlementsOverTime($conn),
    "casesOpenedVsClosed" => fetchCasesOpenedVsClosed($conn),
    "caseOutcomes" => fetchCaseOutcomes($conn),
    "caseDuration" => fetchCaseDuration($conn),
    "avgSettlementByPractice" => fetchAvgSettlementByPractice($conn) // ✅ FIXED
];

echo json_encode($response, JSON_PRETTY_PRINT);
$conn->close();
?>