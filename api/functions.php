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

function getPreviousPeriod($startDate, $endDate) {
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);

    $today = new DateTime();

    if ($start->format('m-d') == '01-01' && $end->format('Y-m-d') == $today->format('Y-m-d')) {
        $start->modify('-1 year');
        $end->modify('-1 year');
    }
    elseif ($start->format('d') == '01' && $end->format('d') == $end->format('t')) {
        $start->modify('-1 month')->modify('first day of this month');
        $end->modify('-1 month')->modify('last day of this month');
    }
    elseif ($start->format('m-d') == '01-01' && $end->format('m-d') == '12-31') {
        $start->modify('-1 year')->modify('first day of January');
        $end->modify('-1 year')->modify('last day of December');
    }
    else {
        $dateDiff = $start->diff($end)->days + 1;
        $start->modify("-{$dateDiff} days");
        $end->modify("-{$dateDiff} days");
    }

    return [$start->format('Y-m-d'), $end->format('Y-m-d')];
}

function fetchTotalSettlement($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $prevStartDate, $prevEndDate);

    $sqlAvg = "SELECT AVG(suit_percentage / 100) AS avgSuitPercentage 
               FROM cases 
               WHERE suit_percentage / 100 IS NOT NULL";
    $resultAvg = $conn->query($sqlAvg);
    $avgSuitPercentage = $resultAvg->fetch_assoc()['avgSuitPercentage'] ?? 0.4;

    $sql = "SELECT 
                SUM(settlement_amount) AS totalUnadjustedSettlement,
                SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS totalAdjustedSettlement
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter";

    $prevSql = "SELECT 
                    SUM(settlement_amount) AS totalUnadjustedSettlement,
                    SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS totalAdjustedSettlement
                FROM cases 
                WHERE settlement_amount IS NOT NULL $prevDateFilter";

    $result = $conn->query($sql);
    $row = $result->fetch_assoc();

    $prevResult = $conn->query($prevSql);
    $prevRow = $prevResult->fetch_assoc();

    return [
        "title" => "Total Settlement",
        "data" => [
            floatval($row['totalUnadjustedSettlement'] ?? 0),
            floatval($row['totalAdjustedSettlement'] ?? 0)
        ],
        "type" => "def",
        "col" => 1,
        "row" => 2,
        "prevData" => [
            floatval($prevRow['totalUnadjustedSettlement'] ?? 0),
            floatval($prevRow['totalAdjustedSettlement'] ?? 0)
        ]
    ];
}

function fetchCasesByLocation($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT location, COUNT(*) AS count FROM cases WHERE 1=1 $dateFilter GROUP BY location";
    $sqlPrev = "SELECT location, COUNT(*) AS count FROM cases WHERE 1=1 $prevDateFilter GROUP BY location";
    $result = $conn->query($sql);
    $prevResult = $conn->query($sqlPrev);
    $data = [];
    $dataPrev = [];

    while ($row = $result->fetch_assoc()) {
        $state = $row['location'];
        if (!in_array($state, ['TX', 'LA', 'CO', 'FL'])) {
            $state = 'TX';
        }
        $data[$state] = ($data[$state] ?? 0) + intval($row['count']);
    }

    while ($row = $prevResult->fetch_assoc()) {
        $state = $row['location'];
        if (!in_array($state, ['TX', 'LA', 'CO', 'FL'])) {
            $state = 'TX';
        }
        $dataPrev[$state] = ($dataPrev[$state] ?? 0) + intval($row['count']);
    }

    return [
        "title" => "Cases by Location",
        "data" => $data,
        "type" => "pie",
        "col" => 2,
        "row" => 2,
        "prevData" => $dataPrev,
        "total" => [array_sum($data), array_sum($dataPrev)]
    ];
}

function fetchCasesByPracticeType($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT practice_type, COUNT(*) AS count FROM cases WHERE 1=1 $dateFilter GROUP BY practice_type";
    $sqlPrev = "SELECT practice_type, COUNT(*) AS count FROM cases WHERE 1=1 $prevDateFilter GROUP BY practice_type";
    $result = $conn->query($sql);
    $prevResult = $conn->query($sqlPrev);
    $data = [];
    $prevData = [];

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

    while ($row = $prevResult->fetch_assoc()) {
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
        $prevData[$category] = ($prevData[$category] ?? 0) + intval($row['count']);
    }

    return [
        "title" => "Cases by Practice Type",
        "data" => $data,
        "type" => "v-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}

function fetchCasesByPhase($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("last_activity", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("last_activity", $prevStartDate, $prevEndDate);
    
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

    $prevSql = "
        SELECT 
            CASE 
                WHEN phase = 'Archived' AND settlement_amount IS NOT NULL OR settlement_date IS NOT NULL THEN 'Settlement'
                ELSE phase 
            END AS status,
            COUNT(*) AS count 
        FROM cases 
        WHERE 1=1 $prevDateFilter 
        GROUP BY status
    ";

    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['status']] = intval($row['count']);
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['status']] = intval($row['count']);
    }

    return [
        "title" => "Cases by Phase",
        "data" => $data,
        "type" => "v-bar",
        "col" => 1,
        "row" => 4,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}

function fetchSettlementsOverTime($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("COALESCE(settlement_date, last_activity)", $prevStartDate, $prevEndDate);

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

    $sqlPrev = "SELECT $groupBy AS time_period, 
                       SUM(settlement_amount) AS total_settlement,
                       SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS adjusted_settlement
                FROM cases 
                WHERE settlement_amount IS NOT NULL $prevDateFilter 
                GROUP BY time_period
                ORDER BY MIN(settlement_date) ASC";

    $result = $conn->query($sql);
    $prevResult = $conn->query($sqlPrev);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['time_period']] = [
            floatval($row['total_settlement']),
            floatval($row['adjusted_settlement'])
        ];
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['time_period']] = [
            floatval($row['total_settlement']),
            floatval($row['adjusted_settlement'])
        ];
    }

    return [
        "title" => "Settlements Over Time",
        "data" => $data,
        "type" => "line",
        "secondData" => $data,
        "col" => 2,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum(array_column($data, 0)), array_sum(array_column($prevData, 0))]
    ];
}

function fetchCasesOpenedVsClosed($conn, $startDate, $endDate) {
    $dateFilterCreated = dateFilter("creation_date", $startDate, $endDate);
    $dateFilterClosed = dateFilter("COALESCE(settlement_date, last_activity)", $startDate, $endDate);
    
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilterCreated = dateFilter("creation_date", $prevStartDate, $prevEndDate);
    $prevDateFilterClosed = dateFilter("COALESCE(settlement_date, last_activity)", $prevStartDate, $prevEndDate);

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
    $prevSqlNewCases = "SELECT 
                            $groupBy AS time_period, 
                            COUNT(*) AS new_cases 
                        FROM cases 
                        WHERE creation_date IS NOT NULL $prevDateFilterCreated
                        GROUP BY time_period 
                        ORDER BY time_period ASC";

    $resultNew = $conn->query($sqlNewCases);
    $prevResultNew = $conn->query($prevSqlNewCases);
    $data = [];
    $prevData = [];

    while ($row = $resultNew->fetch_assoc()) {
        $data[$row['time_period']] = [$row['new_cases'], 0];
    }

    while ($row = $prevResultNew->fetch_assoc()) {
        $prevData[$row['time_period']] = [$row['new_cases'], 0];
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
    $prevSqlClosed = "SELECT 
                        $groupBy AS time_period, 
                        COUNT(*) AS closed_cases
                    FROM cases 
                    WHERE (settlement_date IS NOT NULL 
                        OR settlement_amount IS NOT NULL 
                        OR phase IN ('closing', 'referred out', 'qsf', 'qsf out', 'archived'))
                    $prevDateFilterClosed
                    GROUP BY time_period
                    HAVING time_period IS NOT NULL 
                    ORDER BY MIN(settlement_date) ASC";

    $resultClosed = $conn->query($sqlClosed);
    $prevResultClosed = $conn->query($prevSqlClosed);

    while ($row = $resultClosed->fetch_assoc()) {
        if (isset($data[$row['time_period']])) {
            $data[$row['time_period']][1] = intval($row['closed_cases']);
        } else {
            $data[$row['time_period']] = [0, intval($row['closed_cases'])];
        }
    }

    while ($row = $prevResultClosed->fetch_assoc()) {
        if (isset($prevData[$row['time_period']])) {
            $prevData[$row['time_period']][1] = intval($row['closed_cases']);
        } else {
            $prevData[$row['time_period']] = [0, intval($row['closed_cases'])];
        }
    }

    return [
        "title" => "Cases Opened vs Closed",
        "data" => $data,
        "type" => "line",
        "secondData" => $data,
        "col" => 2,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum(array_column($data, 0)), array_sum(array_column($prevData, 0))]
    ];
}

function fetchCaseDuration($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

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
    $prevSql = "SELECT 
                    CASE 
                        WHEN DATEDIFF(settlement_date, creation_date) <= 30 THEN '0-1 Month'
                        WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 31 AND 90 THEN '1-3 Months'
                        WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 91 AND 180 THEN '3-6 Months'
                        WHEN DATEDIFF(settlement_date, creation_date) BETWEEN 181 AND 365 THEN '6-12 Months'
                        ELSE '1+ Year'
                    END AS duration_category,
                    COUNT(*) AS total_cases
                FROM cases 
                WHERE settlement_date IS NOT NULL $prevDateFilter
                GROUP BY duration_category
                ORDER BY MIN(DATEDIFF(settlement_date, creation_date)) ASC";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['duration_category']] = intval($row['total_cases']);
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['duration_category']] = intval($row['total_cases']);
    }

    return [
        "title" => "Case Duration",
        "data" => $data,
        "type" => "h-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}

function fetchCasesVsSettlements($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT 
                DATE_FORMAT(creation_date, '%b') AS month, 
                COUNT(*) AS new_cases 
            FROM cases WHERE 1=1 $dateFilter
            GROUP BY DATE_FORMAT(creation_date, '%b') 
            ORDER BY MIN(creation_date) ASC";
    $prevSql = "SELECT 
                    DATE_FORMAT(creation_date, '%b') AS month, 
                    COUNT(*) AS new_cases 
                FROM cases WHERE 1=1 $prevDateFilter
                GROUP BY DATE_FORMAT(creation_date, '%b') 
                ORDER BY MIN(creation_date) ASC";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $result->fetch_assoc()) {
        $data[$row['month']] = [intval($row['new_cases']), 0];
        $totalCount++;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['month']] = [intval($row['new_cases']), 0];
    }

    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);
    $sqlSettlements = "SELECT DATE_FORMAT(settlement_date, '%b') AS month, COUNT(*) AS settlements
                       FROM cases 
                       WHERE settlement_date IS NOT NULL $dateFilter
                       GROUP BY DATE_FORMAT(settlement_date, '%b')";
    $prevSqlSettlements = "SELECT DATE_FORMAT(settlement_date, '%b') AS month, COUNT(*) AS settlements
                           FROM cases 
                           WHERE settlement_date IS NOT NULL $prevDateFilter
                           GROUP BY DATE_FORMAT(settlement_date, '%b')";
    $resultSettlements = $conn->query($sqlSettlements);
    $prevResultSettlements = $conn->query($prevSqlSettlements);
    
    while ($row = $resultSettlements->fetch_assoc()) {
        if (isset($data[$row['month']])) {
            $data[$row['month']][1] = intval($row['settlements']);
        }
    }

    while ($row = $prevResultSettlements->fetch_assoc()) {
        if (isset($prevData[$row['month']])) {
            $prevData[$row['month']][1] = intval($row['settlements']);
        }
    }

    $colCount = 2;
    if ($totalCount >= 6) $colCount = 3;
    if ($totalCount >= 12) $colCount = 4;

    return [
        "title" => "Signed Up Cases vs Settled Cases",
        "data" => $data,
        "type" => "h-bar",
        "col" => $colCount,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum(array_column($data, 0)), array_sum(array_column($prevData, 0))]
    ];
}

function fetchAverageSettlementByPractice($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

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
    $sqlPrev = "SELECT 
                    CASE 
                        WHEN practice_type IN ('First Party', 'First Party*', 'NCA', 'NCA*') THEN 'First Party'
                        WHEN practice_type = 'Personal Injury (PI)' THEN 'Personal Injury'
                        WHEN practice_type IN ('Medical Malpractice', 'NEC', 'MedMal') THEN 'Med Mal'
                        ELSE 'Other' 
                    END AS practice_category,
                    AVG(settlement_amount) AS avg_settlement
                FROM cases 
                WHERE settlement_amount IS NOT NULL $prevDateFilter
                GROUP BY practice_category";
    $result = $conn->query($sql);
    $resultPrev = $conn->query($sqlPrev);
    $data = [];
    $dataPrev = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['practice_category']] = floatval($row['avg_settlement']);
    }

    while ($row = $resultPrev->fetch_assoc()) {
        $dataPrev[$row['practice_category']] = floatval($row['avg_settlement']);
    }

    return [
        "title" => "Average Settlement by Practice Type",
        "data" => $data,
        "type" => "v-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $dataPrev,
        "total" => [array_sum($data), array_sum($dataPrev)]
    ];
}

function fetchAverageSuitPercentage($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT 
                AVG(suit_percentage) AS avg_suit_percentage, 
                COUNT(suit_percentage) AS total_cases 
            FROM cases 
            WHERE suit_percentage IS NOT NULL $dateFilter";
    $sqlPrev = "SELECT 
                    AVG(suit_percentage) AS avg_suit_percentage, 
                    COUNT(suit_percentage) AS total_cases 
                FROM cases 
                WHERE suit_percentage IS NOT NULL $prevDateFilter";

    $result = $conn->query($sql);
    $resultPrev = $conn->query($sqlPrev);
    $row = $result->fetch_assoc();
    $rowPrev = $resultPrev->fetch_assoc();

    $avgSuitPercentage = isset($row['avg_suit_percentage']) ? floatval($row['avg_suit_percentage']) : 40.0;
    $totalCases = isset($row['total_cases']) ? intval($row['total_cases']) : 0;

    $prevAvgSuitPercentage = isset($rowPrev['avg_suit_percentage']) ? floatval($rowPrev['avg_suit_percentage']) : 40.0;
    $prevTotalCases = isset($rowPrev['total_cases']) ? intval($rowPrev['total_cases']) : 0;

    return [
        "title" => "Average Suit Percentage",
        "data" => [
            $totalCases,
            $avgSuitPercentage
        ],
        "type" => "percentage",
        "col" => 1,
        "row" => 1,
        "prevData" => [
            $prevTotalCases,
            $prevAvgSuitPercentage
        ],
        "total" => [$totalCases, $prevTotalCases]
    ];
}

function fetchAverageCasesPerPeriod($conn, $startDate, $endDate) {
    if (empty($startDate) && $endDate === "3000-01-01") {
        $sql = "SELECT 
                    COUNT(*) / COUNT(DISTINCT DATE_FORMAT(creation_date, '%Y-%m')) AS avg_cases_per_month
                FROM cases 
                WHERE creation_date IS NOT NULL";
        $result = $conn->query($sql);
        $row = $result->fetch_assoc();

        return [
            "title" => "Average Cases per Period",
            "data" => [floatval($row['avg_cases_per_month'])],
            "type" => "value",
            "col" => 1,
            "row" => 1
        ];
    }

    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

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
    $sqlPrev = "SELECT 
                    COUNT(*) / COUNT(DISTINCT $groupBy) AS avg_cases_per_period,
                    (COUNT(*) / $date) * $daysInMonth AS pace_for_month
                FROM cases 
                WHERE creation_date IS NOT NULL $prevDateFilter";
    $result = $conn->query($sql);
    $resultPrev = $conn->query($sqlPrev);
    $row = $result->fetch_assoc();
    $rowPrev = $resultPrev->fetch_assoc();

    return [
        "title" => "Average Cases per Period",
        "data" => [
            floatval($row['avg_cases_per_period']),
            floatval($row['pace_for_month'])
        ],
        "type" => "value",
        "col" => 1,
        "row" => 1,
        "prevData" => [
            floatval($rowPrev['avg_cases_per_period']),
            floatval($rowPrev['pace_for_month'])
        ],
        "total" => [floatval($row['pace_for_month']), floatval($rowPrev['pace_for_month'])]
    ];
}

function fetchTopAttorneys($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT first_primary, COUNT(*), SUM(settlement_amount) AS total_cases 
            FROM cases 
            WHERE first_primary IS NOT NULL AND settlement_amount IS NOT NULL $dateFilter
            GROUP BY first_primary 
            ORDER BY total_cases DESC 
            LIMIT 5";
    $sqlPrev = "SELECT first_primary, COUNT(*), SUM(settlement_amount) AS total_cases 
                FROM cases 
                WHERE first_primary IS NOT NULL AND settlement_amount IS NOT NULL $prevDateFilter
                GROUP BY first_primary 
                ORDER BY total_cases DESC 
                LIMIT 5";
    $result = $conn->query($sql);
    $resultPrev = $conn->query($sqlPrev);
    $data = [];
    $dataPrev = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = intval($row['total_cases']);
    }

    while ($row = $resultPrev->fetch_assoc()) {
        $dataPrev[$row['first_primary']] = intval($row['total_cases']);
    }

    return [
        "title" => "Top 5 Attorneys by Settlement Amount",
        "data" => $data,
        "type" => "v-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $dataPrev,
        "total" => [array_sum($data), array_sum($dataPrev)]
    ];
}

function fetchTopSettlements($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT first_primary, settlement_amount 
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter
            ORDER BY settlement_amount DESC 
            LIMIT 5";
    $prevSql = "SELECT first_primary, settlement_amount 
                FROM cases 
                WHERE settlement_amount IS NOT NULL $prevDateFilter
                ORDER BY settlement_amount DESC 
                LIMIT 5";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $dataPrev = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = [
            $row['first_primary'],
            floatval($row['settlement_amount'])
        ];
    }

    while ($row = $prevResult->fetch_assoc()) {
        $dataPrev[] = [
            $row['first_primary'],
            floatval($row['settlement_amount'])
        ];
    }

    return [
        "title" => "Top 5 Settlements",
        "data" => $data,
        "type" => "h-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $dataPrev,
        "total" => [array_sum(array_column($data, 1)), array_sum(array_column($dataPrev, 1))]
    ];
}

function fetchTopWinningAttorneys($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT first_primary, COUNT(*) AS total_cases 
            FROM cases 
            WHERE settlement_amount IS NOT NULL $dateFilter
            GROUP BY first_primary 
            ORDER BY total_cases DESC 
            LIMIT 5";
    $sqlPrev = "SELECT first_primary, COUNT(*) AS total_cases 
                FROM cases 
                WHERE settlement_amount IS NOT NULL $prevDateFilter
                GROUP BY first_primary 
                ORDER BY total_cases DESC 
                LIMIT 5";
    $result = $conn->query($sql);
    $resultPrev = $conn->query($sqlPrev);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = intval($row['total_cases']);
    }

    while ($row = $resultPrev->fetch_assoc()) {
        $prevData[$row['first_primary']] = intval($row['total_cases']);
    }

    return [
        "title" => "Top 5 Winning Attorneys",
        "data" => $data,
        "type" => "v-bar",
        "col" => 2,
        "row" => 2,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}

function fetchOpenCases($conn, $startDate, $endDate) {
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $sql = "SELECT COUNT(*) AS open_cases 
            FROM cases 
            WHERE phase NOT IN ('settlement', 'closing', 'referred out', 'qsf', 'qsf out', 'archived') AND settlement_date IS NULL AND creation_date < '$endDate'";
    $prevSql = "SELECT COUNT(*) AS open_cases 
                FROM cases 
                WHERE phase NOT IN ('settlement', 'closing', 'referred out', 'qsf', 'qsf out', 'archived') AND settlement_date IS NULL AND creation_date < '$prevEndDate'";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $row = $result->fetch_assoc();
    $prevRow = $prevResult->fetch_assoc();

    return [
        "title" => "Open Cases",
        "data" => intval($row['open_cases']),
        "type" => "value",
        "col" => 1,
        "row" => 1,
        "prevData" => intval($prevRow['open_cases']),
        "total" => [intval($row['open_cases']), intval($prevRow['open_cases'])]
    ];
}

function fetchAttorneyDocket($conn, $startDate, $endDate) {
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $endDate .= " 23:59:59";
    $sql = "SELECT first_primary, COUNT(*) AS total_cases 
            FROM cases 
            WHERE first_primary IS NOT NULL AND (settlement_date IS NULL OR settlement_date < '$endDate') AND creation_date < '$endDate' AND phase NOT IN ('settlement', 'closing', 'referred out', 'qsf', 'qsf out', 'archived')
            GROUP BY first_primary 
            ORDER BY total_cases DESC";
    $prevSql = "SELECT first_primary, COUNT(*) AS total_cases 
                FROM cases 
                WHERE first_primary IS NOT NULL AND (settlement_date IS NULL OR settlement_date < '$prevEndDate') AND creation_date < '$prevEndDate' AND phase NOT IN ('settlement', 'closing', 'referred out', 'qsf', 'qsf out', 'archived')
                GROUP BY first_primary 
                ORDER BY total_cases DESC";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = [
            'total_cases' => intval($row['total_cases'])
        ];
        $totalCount++;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['first_primary']] = [
            'total_cases' => intval($row['total_cases'])
        ];
    }

    $rowCount = 2;
    if ($totalCount > 8) $rowCount = 3;
    if ($totalCount > 16) $rowCount = 4;
    if ($totalCount > 24) $rowCount = 5;
    if ($totalCount > 30) $rowCount = 6;

    return [
        "title" => "Attorney Docket Count",
        "data" => $data,
        "type" => "table",
        "headers" => ["Attorney", "Total Cases"],
        "col" => 2,
        "row" => $rowCount,
        "prevData" => $prevData,
        "total" => [array_sum(array_column($data, 'total_cases')), array_sum(array_column($prevData, 'total_cases'))]
    ];
}

function fetchDisengagementPercent($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

    $sqlDisengaged = "SELECT COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by, COUNT(*) AS total_disengaged 
                      FROM cases 
                      WHERE disengaged = 'TRUE' $dateFilter 
                      GROUP BY referred_by";
    $sqlReferred = "SELECT COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by, COUNT(*) AS total_referred 
                    FROM cases 
                    WHERE referred_by IS NOT NULL $dateFilter 
                    GROUP BY referred_by";
    $prevDisengaged = "SELECT COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by, COUNT(*) AS total_disengaged 
                       FROM cases 
                       WHERE disengaged = 'TRUE' $prevDateFilter 
                       GROUP BY referred_by";
    $prevReferred = "SELECT COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by, COUNT(*) AS total_referred 
                     FROM cases 
                     WHERE referred_by IS NOT NULL $prevDateFilter 
                     GROUP BY referred_by";
    
    $resultDisengaged = $conn->query($sqlDisengaged);
    $resultReferred = $conn->query($sqlReferred);
    $prevResultDisengaged = $conn->query($prevDisengaged);
    $prevResultReferred = $conn->query($prevReferred);

    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $resultDisengaged->fetch_assoc()) {
        $data[$row['referred_by']] = [
            'total_disengaged' => intval($row['total_disengaged']),
            'total_referred' => 0
        ];
    }

    while ($row = $prevResultDisengaged->fetch_assoc()) {
        $prevData[$row['referred_by']] = [
            'total_disengaged' => intval($row['total_disengaged']),
            'total_referred' => 0
        ];
    }

    while ($row = $resultReferred->fetch_assoc()) {
        if (isset($data[$row['referred_by']])) {
            $data[$row['referred_by']]['total_referred'] = intval($row['total_referred']);
        } else {
            $data[$row['referred_by']] = [
                'total_disengaged' => 0,
                'total_referred' => intval($row['total_referred'])
            ];
        }
    }

    while ($row = $prevResultReferred->fetch_assoc()) {
        if (isset($prevData[$row['referred_by']])) {
            $prevData[$row['referred_by']]['total_referred'] = intval($row['total_referred']);
        } else {
            $prevData[$row['referred_by']] = [
                'total_disengaged' => 0,
                'total_referred' => intval($row['total_referred'])
            ];
        }
    }

    foreach ($data as $key => &$value) {
        $percent = ($value['total_referred'] > 0) 
            ? number_format(($value['total_disengaged'] / $value['total_referred']) * 100, 2) 
            : "0.00";

        $value['disengagement_display'] = "{$value['total_disengaged']} ({$percent}%)";
        unset($value['total_disengaged']);
        $totalCount++;
    }

    foreach ($prevData as $key => &$value) {
        $percent = ($value['total_referred'] > 0) 
            ? number_format(($value['total_disengaged'] / $value['total_referred']) * 100, 2) 
            : "0.00";

        $value['disengagement_display'] = "{$value['total_disengaged']} ({$percent}%)";
        unset($value['total_disengaged']);
    }

    uasort($data, function($a, $b) {
        return $b['total_referred'] - $a['total_referred'];
    });

    uasort($prevData, function($a, $b) {
        return $b['total_referred'] - $a['total_referred'];
    });

    $rowCount = 2;
    if ($totalCount > 8) $rowCount = 3;
    if ($totalCount > 16) $rowCount = 4;
    if ($totalCount > 24) $rowCount = 5;

    return [
        "title" => "Disengagement Percent",
        "data" => array_slice($data, 0, 20, true),
        "type" => "table",
        "headers" => ["Referred By", "Total Referred", "Disengagement (#)"],
        "col" => 2,
        "row" => $rowCount,
        "prevData" => array_slice($prevData, 0, 20, true),
        "total" => [
            array_sum(array_column($data, 'total_referred')),
            array_sum(array_column($prevData, 'total_referred'))
        ]
    ];
}

function fetchMarketingSource($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT COALESCE(NULLIF(marketing_source, ''), 'Unknown') AS marketing_source, COUNT(*) AS total_cases 
            FROM cases 
            WHERE marketing_source IS NOT NULL $dateFilter 
            GROUP BY marketing_source 
            LIMIT 20";
    $sqlPrev = "SELECT COALESCE(NULLIF(marketing_source, ''), 'Unknown') AS marketing_source, COUNT(*) AS total_cases 
                FROM cases 
                WHERE marketing_source IS NOT NULL $prevDateFilter 
                GROUP BY marketing_source 
                LIMIT 20";
    $result = $conn->query($sql);
    $prevResult = $conn->query($sqlPrev);
    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $result->fetch_assoc()) {
        $data[$row['marketing_source']] = intval($row['total_cases']);
        $totalCount++;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['marketing_source']] = intval($row['total_cases']);
    }

    $rowCount = 2;
    if ($totalCount >= 10) $rowCount = 3;
    if ($totalCount >= 18) $rowCount = 4;

    return [
        "title" => "Marketing Source",
        "data" => $data,
        "type" => "v-bar",
        "col" => 2,
        "row" => $rowCount,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}

function fetchAttorneySettlements($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sqlAvg = "SELECT AVG(suit_percentage / 100) AS avgSuitPercentage 
               FROM cases 
               WHERE suit_percentage IS NOT NULL";
    $resultAvg = $conn->query($sqlAvg);
    $avgSuitPercentage = $resultAvg->fetch_assoc()['avgSuitPercentage'] ?? 0.4;

    $sql = "SELECT first_primary, COUNT(*) AS total_cases, 
                   SUM(settlement_amount) AS total_settlement, 
                   SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS total_adjusted_settlement
            FROM cases 
            WHERE first_primary IS NOT NULL AND settlement_amount IS NOT NULL $dateFilter 
            GROUP BY first_primary 
            ORDER BY total_settlement DESC";
    $prevSql = "SELECT first_primary, COUNT(*) AS total_cases, 
                       SUM(settlement_amount) AS total_settlement, 
                       SUM(settlement_amount * COALESCE(suit_percentage / 100, $avgSuitPercentage)) AS total_adjusted_settlement
                FROM cases 
                WHERE first_primary IS NOT NULL AND settlement_amount IS NOT NULL $prevDateFilter 
                GROUP BY first_primary 
                ORDER BY total_settlement DESC";

    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];
    $totalSettlement = 0;
    $prevTotalSettlement = 0;

    while ($row = $result->fetch_assoc()) {
        $settlementAmount = floatval($row['total_settlement']);
        $adjustedSettlementAmount = floatval($row['total_adjusted_settlement']);

        $data[$row['first_primary']] = [
            'total_cases' => intval($row['total_cases']),
            'total_settlement' => '$' . number_format($settlementAmount, 2),
            'total_adjusted_settlement' => '$' . number_format($adjustedSettlementAmount, 2)
        ];
        $totalSettlement += $settlementAmount;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevSettlementAmount = floatval($row['total_settlement']);
        $prevAdjustedSettlementAmount = floatval($row['total_adjusted_settlement']);

        $prevData[$row['first_primary']] = [
            'total_cases' => intval($row['total_cases']),
            'total_settlement' => '$' . number_format($prevSettlementAmount, 2),
            'total_adjusted_settlement' => '$' . number_format($prevAdjustedSettlementAmount, 2)
        ];
        $prevTotalSettlement += $prevSettlementAmount;
    }

    $rowCount = 2;
    if (count($data) > 8) $rowCount = 3;
    if (count($data) > 16) $rowCount = 4;
    if (count($data) > 24) $rowCount = 5;

    return [
        "title" => "Attorney Settlements",
        "data" => $data,
        "type" => "table",
        "headers" => ["Attorney", "Total Cases", "Total Settlement", "Total Adjusted Settlement"],
        "col" => 2,
        "row" => $rowCount,
        "prevData" => $prevData,
        "total" => [
            floatval($totalSettlement),
            floatval($prevTotalSettlement)
        ]
    ];
}

function fetchMissingPSV($conn, $startDate, $endDate) {
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $endDate .= " 23:59:59";
    $sql = "SELECT first_primary, COUNT(*) AS total_cases 
            FROM cases 
            WHERE projected_settlement_value IS NULL 
            AND settlement_date IS NULL
            AND creation_date < '$endDate' 
            AND phase NOT IN ('Initial/Contract Sent', 'referred out', 'qsf', 'qsf out', 'archived') 
            GROUP BY first_primary 
            ORDER BY total_cases DESC
            LIMIT 30";
    $sql2 = "SELECT COUNT(*) AS total_cases 
             FROM cases 
             WHERE projected_settlement_value IS NULL 
             AND settlement_date IS NULL
             AND creation_date < '$endDate' 
             AND phase NOT IN ('Initial/Contract Sent', 'referred out', 'qsf', 'qsf out', 'archived')";
    $prevSql = "SELECT first_primary, COUNT(*) AS total_cases 
                FROM cases 
                WHERE projected_settlement_value IS NULL 
                AND (settlement_date IS NULL OR settlement_date < '$prevEndDate') 
                AND creation_date < '$prevEndDate' 
                AND phase NOT IN ('Initial/Contract Sent', 'referred out', 'qsf', 'qsf out', 'archived') 
                GROUP BY first_primary 
                ORDER BY total_cases DESC
                LIMIT 30";
    $prevSql2 = "SELECT COUNT(*) AS total_cases 
                 FROM cases 
                 WHERE projected_settlement_value IS NULL 
                 AND (settlement_date IS NULL OR settlement_date < '$prevEndDate') 
                 AND creation_date < '$prevEndDate' 
                 AND phase NOT IN ('Initial/Contract Sent', 'referred out', 'qsf', 'qsf out', 'archived')";
    $result = $conn->query($sql);
    $result2 = $conn->query($sql2);
    $resultPrev = $conn->query($prevSql);
    $result2Prev = $conn->query($prevSql2);
    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $result->fetch_assoc()) {
        $data[$row['first_primary']] = [
            'total_case' => intval($row['total_cases'])
        ];
        $totalCount++;
    }

    while ($row = $resultPrev->fetch_assoc()) {
        $prevData[$row['first_primary']] = [
            'total_case' => intval($row['total_cases'])
        ];
    }

    $totalRow = $result2->fetch_assoc();
    $data['Total'] = [
        'total_case' => intval($totalRow['total_cases'])
    ];

    $totalRowPrev = $result2Prev->fetch_assoc();
    $prevData['Total'] = [
        'total_case' => intval($totalRowPrev['total_cases'])
    ];

    $rowCount = 2;
    if ($totalCount > 8) $rowCount = 3;
    if ($totalCount > 16) $rowCount = 4;
    if ($totalCount > 24) $rowCount = 5;

    return [
        "title" => "Missing Projected Settlement Value(s)",
        "data" => $data,
        "type" => "table",
        "headers" => ["Attorney", "Missing Values"],
        "col" => 2,
        "row" => $rowCount,
        "prevData" => $prevData
    ];
}

function fetchFeeSplit($conn, $startDate, $endDate) {
    $dateFilter = dateFilter("settlement_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("settlement_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT 
                COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by,
                AVG(fees_to_other) AS average_fees_to_other,
                SUM(settlement_amount) AS total_settlement,
                AVG(fees_to_other) / 100 * SUM(settlement_amount) AS fees_paid,
                COUNT(*) AS total_cases
            FROM cases 
            WHERE referred_by IS NOT NULL 
                AND fees_to_other IS NOT NULL
                AND settlement_amount IS NOT NULL $dateFilter
            GROUP BY referred_by
            ORDER BY fees_paid DESC 
            LIMIT 20;";
    $prevSql = "SELECT 
                    COALESCE(NULLIF(referred_by, ''), 'Unknown') AS referred_by,
                    AVG(fees_to_other) AS average_fees_to_other,
                    SUM(settlement_amount) AS total_settlement,
                    AVG(fees_to_other) / 100 * SUM(settlement_amount) AS fees_paid,
                    COUNT(*) AS total_cases
                FROM cases 
                WHERE referred_by IS NOT NULL 
                    AND fees_to_other IS NOT NULL
                    AND settlement_amount IS NOT NULL $prevDateFilter
                GROUP BY referred_by
                ORDER BY fees_paid DESC 
                LIMIT 20;";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];
    $totalCount = 0;

    while ($row = $result->fetch_assoc()) {
        $data[$row['referred_by']] = [
            'total_cases' => intval($row['total_cases']),
            'settlement_amount' => '$' . number_format(floatval($row['total_settlement']), 2),
            'average_fees_to_other' => number_format(floatval($row['average_fees_to_other']), 2) . "%",
            'fee_paid' => '$' . number_format(floatval($row['fees_paid']), 2)
        ];
        $totalCount++;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['referred_by']] = [
            'total_cases' => intval($row['total_cases']),
            'settlement_amount' => '$' . number_format(floatval($row['total_settlement']), 2),
            'average_fees_to_other' => number_format(floatval($row['average_fees_to_other']), 2) . "%",
            'fee_paid' => '$' . number_format(floatval($row['fees_paid']), 2)
        ];
    }

    $rowCount = 2;
    if ($totalCount >= 8) $rowCount = 3;
    if ($totalCount >= 16) $rowCount = 4;
    if ($totalCount >= 24) $rowCount = 5;

    return [
        "title" => "Fee Split",
        "data" => $data,
        "type" => "table",
        "headers" => ["Referred By", "Total Cases", "Settlement Total", "Average Referral Fee", "Fees Paid"],
        "col" => 2,
        "row" => $rowCount,
        "prevData" => $prevData,
        "total" => [
            number_format(array_sum(array_map(function($item) {
                return floatval(str_replace('%', '', $item['fee_paid']));
            }, $data)), 2),
            number_format(array_sum(array_map(function($item) {
                return floatval(str_replace('$', '', $item['fee_paid']));
            }, $prevData)), 2)
        ]
    ];
}

$feeCount = 0;

function attorneyFeeSplit($conn, $startDate, $endDate) {
    global $feeCount;
    $dateFilter = dateFilter("item_creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("item_creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT
                payee AS attorney,
                AVG(amount_due) AS average_settlement,
                SUM(amount_due) AS total_settlement,
                COUNT(*) AS total_cases
                FROM payees
                WHERE payment_type IN ('DB Attorney', 'DB Estimated Discretionary') $dateFilter
                GROUP BY attorney
                ORDER BY total_settlement DESC
                LIMIT 30";
    $prevSql = "SELECT
                    payee AS attorney,
                    AVG(amount_due) AS average_settlement,
                    SUM(amount_due) AS total_settlement,
                    COUNT(*) AS total_cases
                    FROM payees
                    WHERE payment_type IN ('DB Attorney', 'DB Estimated Discretionary') $prevDateFilter
                    GROUP BY attorney
                    ORDER BY total_settlement DESC
                    LIMIT 30";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['attorney']] = [
            'average_settlement' => '$' . number_format(floatval($row['average_settlement']), 2),
            'total_settlement' => '$' . number_format(floatval($row['total_settlement']), 2),
            'total_cases' => intval($row['total_cases'])
        ];
        $feeCount++;
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['attorney']] = [
            'average_settlement' => '$' . number_format(floatval($row['average_settlement']), 2),
            'total_settlement' => '$' . number_format(floatval($row['total_settlement']), 2),
            'total_cases' => intval($row['total_cases'])
        ];
    }

    $rowCount = 2;
    if ($feeCount >= 8) $rowCount = 3;
    if ($feeCount >= 16) $rowCount = 4;
    if ($feeCount >= 24) $rowCount = 5;

    return [
        "title" => "Attorney Fee Split",
        "data" => $data,
        "type" => "table",
        "headers" => ["Attorney", "Average Fee Paid", "Total Fees Paid", "Total Cases"],
        "col" => 3,
        "row" => $rowCount,
        "prevData" => $prevData
    ];
}

function attorneyFeeSplitPie($conn, $startDate, $endDate) {
    global $feeCount;
    $dateFilter = dateFilter("item_creation_date", $startDate, $endDate);
    list($prevStartDate, $prevEndDate) = getPreviousPeriod($startDate, $endDate);
    $prevDateFilter = dateFilter("item_creation_date", $prevStartDate, $prevEndDate);

    $sql = "SELECT
                payee AS attorney,
                SUM(amount_due) AS total_settlement
                FROM payees
                WHERE amount_due IS NOT NULL AND amount_due > 0 AND payment_type IN ('DB Attorney', 'DB Estimated Discretionary') $dateFilter
                GROUP BY attorney
                ORDER BY total_settlement DESC
                LIMIT 10";
    $prevSql = "SELECT
                    payee AS attorney,
                    SUM(amount_due) AS total_settlement
                    FROM payees
                    WHERE amount_due IS NOT NULL AND amount_due > 0 AND payment_type IN ('DB Attorney', 'DB Estimated Discretionary') $prevDateFilter
                    GROUP BY attorney
                    ORDER BY total_settlement DESC
                    LIMIT 10";
    $result = $conn->query($sql);
    $prevResult = $conn->query($prevSql);
    $data = [];
    $prevData = [];

    while ($row = $result->fetch_assoc()) {
        $data[$row['attorney']] = floatval($row['total_settlement']);
    }

    while ($row = $prevResult->fetch_assoc()) {
        $prevData[$row['attorney']] = floatval($row['total_settlement']);
    }

    $rowCount = 2;
    if ($feeCount >= 8) $rowCount = 3;
    if ($feeCount >= 16) $rowCount = 4;

    return [
        "title" => "Attorney Fee Split",
        "data" => $data,
        "type" => "piecol",
        "col" => 1,
        "row" => $rowCount,
        "prevData" => $prevData,
        "total" => [array_sum($data), array_sum($prevData)]
    ];
}
?>