<?php
$API_KEY = "f6fb37e9-58c9-418d-95a6-f867f8516850";
$BASE_URL = "https://dalyblack.leaddocket.com/api";
$MAX_ITEMS_PER_PAGE = 500;

// Get date filters from the request
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;

// If no dates are provided, default to fetching all data
$filterByDate = ($startDate || $endDate); // Only filter if at least one date is provided

/** Convert API's ISO 8601 date format to timestamp */
function isDateWithinRange($dateISO, $startDate, $endDate) {
    if (!$dateISO) return false;
    $dateTimestamp = strtotime($dateISO);

    if (!$startDate && $endDate) return $dateTimestamp <= strtotime($endDate);
    if ($startDate && !$endDate) return $dateTimestamp >= strtotime($startDate);
    return ($dateTimestamp >= strtotime($startDate) && $dateTimestamp <= strtotime($endDate));
}

/** Fetch all status IDs */
function fetchAllStatusIds() {
    global $BASE_URL, $API_KEY;

    $url = "$BASE_URL/statuses";
    $headers = ["Accept: application/json", "api_key: $API_KEY"];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status !== 200) return [];

    $responseData = json_decode($response, true);
    return is_array($responseData) ? array_map(fn($item) => $item["Data"]["Id"], $responseData) : [];
}

/** Fetch leads by status and filter if necessary */
function fetchLeadsByStatus($statusId, $itemsPerPage, $startDate, $endDate, $filterByDate) {
    global $BASE_URL, $API_KEY;

    $page = 1;
    $statusCounts = [];

    do {
        $url = "$BASE_URL/leads?page=$page&itemsPerPage=$itemsPerPage&status=$statusId";
        $headers = ["Accept: application/json", "api_key: $API_KEY"];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status == 429) {
            sleep(2); // Backoff delay
            continue;
        }

        if ($status !== 200) {
            return ["error" => "Failed to fetch lead details", "status" => $status, "response" => $response];
        }

        $responseData = json_decode($response, true);
        if (!isset($responseData["Records"]) || !is_array($responseData["Records"])) {
            return ["error" => "Invalid API response", "response" => $responseData];
        }

        foreach ($responseData["Records"] as $lead) {
            $statusName = $lead["StatusName"] ?? "Unknown";

            // If filtering by date, check the LastStatusChangeDate
            if ($filterByDate) {
                if (!isDateWithinRange($lead["LastStatusChangeDate"] ?? null, $startDate, $endDate)) {
                    continue;
                }
            }

            $statusCounts[$statusName] = ($statusCounts[$statusName] ?? 0) + 1;
        }

        $page++;
        sleep(0.5);

    } while (count($responseData["Records"]) === $itemsPerPage);

    return $statusCounts;
}

/** Fetch all leads and aggregate results */
function fetchAllLeads($startDate, $endDate, $filterByDate) {
    $statusIds = fetchAllStatusIds();
    if (!$statusIds) return ["error" => "No status IDs found"];

    global $MAX_ITEMS_PER_PAGE;
    $statusCounts = [];

    foreach ($statusIds as $statusId) {
        $page = 1;
        $totalPages = 1;

        do {
            $data = fetchLeadsByStatus($statusId, $MAX_ITEMS_PER_PAGE, $startDate, $endDate, $filterByDate);
            foreach ($data as $status => $count) {
                $statusCounts[$status] = ($statusCounts[$status] ?? 0) + $count;
            }

            $page++;
            sleep(0.5);

        } while ($page <= $totalPages);
    }

    return [
        "success" => true,
        "statusCounts" => $statusCounts
    ];
}

/** Handle API request */
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    echo json_encode(fetchAllLeads($startDate, $endDate, $filterByDate), JSON_PRETTY_PRINT);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Not found"]);
}
?>