<?php
require './db.php';

session_start();

function dateFilter($column, $startDate, $endDate) {
    if ($startDate && $endDate) {
        $startDate .= " 00:00:00";
        $endDate .= " 23:59:59";
        return " AND $column BETWEEN '$startDate' AND '$endDate' ";
    } elseif ($startDate) {
        $startDate .= " 00:00:00";
        return " AND $column >= '$startDate' ";
    } elseif ($endDate) {
        $endDate .= " 23:59:59";
        return " AND $column <= '$endDate' ";
    }
    return "";
}

function fetchTotalSettlement($conn, $startDate, $endDate) {
    $sqlAvg = "SELECT AVG(suit_percentage / 100) AS avgSuitPercentage 
               FROM cases 
               WHERE suit_percentage / 100 IS NOT NULL";
    $resultAvg = $conn->query($sqlAvg);
    $avgSuitPercentage = $resultAvg->fetch_assoc()['avgSuitPercentage'] ?? 0.4;

    $dateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);

    $sql = "SELECT 
                SUM(settlement_amount) AS totalUnadjustedSettlement,
                SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS totalAdjustedSettlement
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter";

    $result = $conn->query($sql);
    $row = $result->fetch_assoc();

    return [
        floatval($row['totalUnadjustedSettlement'] ?? 0),
        floatval($row['totalAdjustedSettlement'] ?? 0)
    ];
}

function fetchCasesByLocation($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    $sql = "SELECT location, COUNT(*) AS count FROM cases WHERE 1=1 $dateFilter GROUP BY location";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $state = $row['location'];
        if (!in_array($state, ['TX', 'LA', 'CO', 'FL'])) {
            $state = 'TX';
        }
        $data[$state] = ($data[$state] ?? 0) + intval($row['count']);
    }
    return $data;
}

function fetchCasesByPracticeType($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    $sql = "SELECT practice_type, COUNT(*) AS count FROM cases WHERE 1=1 $dateFilter GROUP BY practice_type";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $type = $row['practice_type'];
        if (in_array($type, ["First Party", "First Party*", "NCA", "NCA*"])) {
            $category = "First Party";
        } elseif ($type === "Personal Injury (PI)") {
            $category = "Personal Injury";
        } elseif (in_array(trim($type), ["Medical Malpractice", "NEC", "MedMal"])) {
            $category = "Med Mal";
        } elseif (trim($type) === "Mass Tort (MT)") {
            $category = "Mass Tort";
        } else {
            $category = "Other";
        }
        $data[$category] = ($data[$category] ?? 0) + intval($row['count']);
    }
    return $data;
}

function fetchCasesByPhase($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("last_activity", $startDate, $endDate);
    
    $sql = "
        SELECT 
            CASE 
                WHEN phase = 'Archived' AND settlement_amount IS NOT NULL OR settlement_date IS NOT NULL THEN 'Settlement'
                ELSE phase 
            END AS status,
            COUNT(*) AS count 
        FROM cases 
        WHERE 1=1 $dateFilter 
        GROUP BY status
    ";

    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['status']] = intval($row['count']);
    }

    return $data;
}

function fetchSettlementsOverTime($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);

    $sqlDateDiff = "SELECT DATEDIFF('$endDate', '$startDate') AS daysDiff";
    $resultDateDiff = $conn->query($sqlDateDiff);
    $dateDiff = $resultDateDiff->fetch_assoc()['daysDiff'] ?? 365;

    if ($dateDiff > 365) {
        $groupBy = "DATE_FORMAT(settlement_date, '%Y')";
    } elseif ($dateDiff > 30) {
        $groupBy = "DATE_FORMAT(settlement_date, '%Y-%m')";
    } elseif ($dateDiff > 7) {
        $groupBy = "DATE_FORMAT(settlement_date, '%Y-%u')";
    } else {
        $groupBy = "DATE_FORMAT(settlement_date, '%Y-%m-%d')";
    }

    $sqlAvg = "SELECT AVG(suit_percentage / 100) AS avgSuitPercentage 
               FROM cases 
               WHERE suit_percentage IS NOT NULL $dateFilter";
    $resultAvg = $conn->query($sqlAvg);
    $avgSuitPercentage = $resultAvg->fetch_assoc()['avgSuitPercentage'] ?? 0.4; 

    $sql = "SELECT $groupBy AS time_period, 
                   SUM(settlement_amount) AS total_settlement,
                   SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS adjusted_settlement
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter 
            GROUP BY time_period
            ORDER BY MIN(settlement_date) ASC";

    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['time_period']] = [
            floatval($row['total_settlement']),
            floatval($row['adjusted_settlement'])
        ];
    }

    return $data;
}

function fetchCasesOpenedVsClosed($conn, $startDate, $endDate) {
    $dateFilterCreated = dateFilter("creation_date", $startDate, $endDate);
    $dateFilterClosed = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);

    $sqlDateDiff = "SELECT DATEDIFF('$endDate', '$startDate') AS daysDiff";
    $resultDateDiff = $conn->query($sqlDateDiff);
    $dateDiff = $resultDateDiff->fetch_assoc()['daysDiff'] ?? 365;

    if ($dateDiff > 365) {
        $groupBy = "DATE_FORMAT(creation_date, '%Y')";
    } elseif ($dateDiff > 30) {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%m')";
    } elseif ($dateDiff > 7) {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%u')";
    } else {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%m-%d')";
    }

    $sqlNewCases = "SELECT 
                        $groupBy AS time_period, 
                        COUNT(*) AS new_cases 
                    FROM cases 
                    WHERE creation_date IS NOT NULL $dateFilterCreated
                    GROUP BY time_period 
                    ORDER BY time_period ASC";

    $resultNew = $conn->query($sqlNewCases);
    $data = [];

    while ($row = $resultNew->fetch_assoc()) {
        $data[$row['time_period']] = [$row['new_cases'], 0];
    }

    if ($dateDiff > 365) {
        $groupBy = "DATE_FORMAT(COALESCE(settlement_date, last_activity), '%Y')";
    } elseif ($dateDiff > 30) {
        $groupBy = "DATE_FORMAT(COALESCE(settlement_date, last_activity), '%Y-%m')";
    } elseif ($dateDiff > 7) {
        $groupBy = "DATE_FORMAT(COALESCE(settlement_date, last_activity), '%Y-%u')";
    } else {
        $groupBy = "DATE_FORMAT(COALESCE(settlement_date, last_activity), '%Y-%m-%d')";
    }

    $sqlClosed = "SELECT 
                    $groupBy AS time_period, 
                    COUNT(*) AS closed_cases
                FROM cases 
                WHERE (settlement_date IS NOT NULL 
                    OR settlement_amount IS NOT NULL 
                    OR phase IN ('closing', 'referred out', 'qsf', 'qsf out', 'archived'))
                $dateFilterClosed
                GROUP BY time_period
                HAVING time_period IS NOT NULL 
                ORDER BY MIN(settlement_date) ASC";

    $resultClosed = $conn->query($sqlClosed);

    while ($row = $resultClosed->fetch_assoc()) {
        if (isset($data[$row['time_period']])) {
            $data[$row['time_period']][1] = intval($row['closed_cases']);
        } else {
            $data[$row['time_period']] = [0, intval($row['closed_cases'])];
        }
    }

    return $data;
}

/*function fetchCaseOutcomes($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("last_activity", $startDate, $endDate);
    $sql = "SELECT phase AS outcome, COUNT(*) AS total_cases 
            FROM cases 
            WHERE phase IS NOT NULL AND phase != '' $dateFilter
            GROUP BY phase";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['outcome']] = intval($row['total_cases']);
    }
    return $data;
}*/

function fetchCaseDuration($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
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
            WHERE settlement_date IS NOT NULL $dateFilter
            GROUP BY duration_category
            ORDER BY MIN(DATEDIFF(settlement_date, creation_date)) ASC";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['duration_category']] = intval($row['total_cases']);
    }
    return $data;
}

function fetchCasesVsSettlements($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    $sql = "SELECT 
                DATE_FORMAT(creation_date, '%b') AS month, 
                COUNT(*) AS new_cases 
            FROM cases WHERE 1=1 $dateFilter
            GROUP BY DATE_FORMAT(creation_date, '%b') 
            ORDER BY MIN(creation_date) ASC";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['month']] = [$row['new_cases'], 0];
    }

    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    $sqlSettlements = "SELECT DATE_FORMAT(settlement_date, '%b') AS month, COUNT(*) AS settlements
                       FROM cases 
                       WHERE settlement_date IS NOT NULL $dateFilter
                       GROUP BY DATE_FORMAT(settlement_date, '%b')";
    $resultSettlements = $conn->query($sqlSettlements);
    
    while ($row = $resultSettlements->fetch_assoc()) {
        if (isset($data[$row['month']])) {
            $data[$row['month']][1] = intval($row['settlements']);
        }
    }

    return $data;
}

function fetchAverageSettlementByPractice($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);

    $sql = "SELECT 
                CASE 
                    WHEN practice_type IN ('First Party', 'First Party*', 'NCA', 'NCA*') THEN 'First Party'
                    WHEN practice_type = 'Personal Injury (PI)' THEN 'Personal Injury'
                    WHEN practice_type IN ('Medical Malpractice', 'NEC', 'MedMal') THEN 'Med Mal'
                    ELSE 'Other' 
                END AS practice_category,
                AVG(settlement_amount) AS avg_settlement
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter
            GROUP BY practice_category";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['practice_category']] = floatval($row['avg_settlement']);
    }
    return $data;
}

function fetchAverageSuitPercentage($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);

    $sql = "SELECT 
                AVG(suit_percentage) AS avg_suit_percentage, 
                COUNT(suit_percentage) AS total_cases 
            FROM cases 
            WHERE suit_percentage IS NOT NULL $dateFilter";

    $result = $conn->query($sql);
    $row = $result->fetch_assoc();

    $avgSuitPercentage = isset($row['avg_suit_percentage']) ? floatval($row['avg_suit_percentage']) : 40.0;
    $totalCases = isset($row['total_cases']) ? intval($row['total_cases']) : 0;

    return [$totalCases, $avgSuitPercentage];
}

function fetchAverageCasesPerPeriod($conn, $startDate, $endDate) {
    if (empty($startDate) && $endDate === "3000-01-01") {
        $sql = "SELECT 
                    COUNT(*) / COUNT(DISTINCT DATE_FORMAT(creation_date, '%Y-%m')) AS avg_cases_per_month
                FROM cases 
                WHERE creation_date IS NOT NULL";
        $result = $conn->query($sql);
        $row = $result->fetch_assoc();

        return [floatval($row['avg_cases_per_month'])];
    }

    $dateFilter = dateFilter("creation_date", $startDate, $endDate);

    $sqlDateDiff = "SELECT DATEDIFF('$endDate', '$startDate') AS daysDiff";
    $resultDateDiff = $conn->query($sqlDateDiff);
    $dateDiff = $resultDateDiff->fetch_assoc()['daysDiff'] ?? 0;

    if ($dateDiff <= 7) {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%m-%d')";
    } elseif ($dateDiff <= 30) {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%u')";
    } else {
        $groupBy = "DATE_FORMAT(creation_date, '%Y-%m')";
    }

    $daysInMonth = date('t', strtotime($startDate));
    $date = ($dateDiff > 0 ? "(DATEDIFF('$endDate', '$startDate') + 1)" : "1");

    $sql = "SELECT 
                COUNT(*) / COUNT(DISTINCT $groupBy) AS avg_cases_per_period,
                (COUNT(*) / $date) * $daysInMonth AS pace_for_month
            FROM cases 
            WHERE creation_date IS NOT NULL $dateFilter";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();

    return [
        floatval($row['avg_cases_per_period']),
        floatval($row['pace_for_month'])
    ];
}

function fetchTopAttorneys($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    $sql = "SELECT first_primary, COUNT(*), SUM(settlement_amount) AS total_cases 
            FROM cases 
            WHERE first_primary IS NOT NULL AND settlement_amount IS NOT NULL $dateFilter
            GROUP BY first_primary 
            ORDER BY total_cases DESC 
            LIMIT 5";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = intval($row['total_cases']);
    }
    return $data;
}

function fetchTopSettlements($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    $sql = "SELECT first_primary, settlement_amount 
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter
            ORDER BY settlement_amount DESC 
            LIMIT 5";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = floatval($row['settlement_amount']);
    }
    return $data;
}

function fetchTopWinningAttorneys($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    $sql = "SELECT first_primary, COUNT(*) AS total_cases 
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter
            GROUP BY first_primary 
            ORDER BY total_cases DESC 
            LIMIT 5";
    $result = $conn->query($sql);
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = intval($row['total_cases']);
    }
    return $data;
}

function fetchOpenCases($conn, $startDate, $endDate) {
    $sql = "SELECT COUNT(*) AS open_cases 
            FROM cases 
            WHERE phase NOT IN ('settlement', 'closing', 'referred out', 'qsf', 'qsf out', 'archived') AND settlement_date IS NULL AND creation_date < '$endDate'";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    return intval($row['open_cases']);
}
?>