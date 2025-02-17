<?php
include 'db.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Check for the 'all' query parameter to decide whether to limit results
$loadAll = isset($_GET['all']) && $_GET['all'] === 'true';

// Default values for limit and offset
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = 2000;

// Modify query for 'Load All' functionality
$sql = "
    SELECT
        e.id,
        e.event_id,
        e.event_type,
        e.magnitude AS event_magnitude,
        e.begin_date AS event_date,
        e.property_damage_reported AS event_property_damage,
        COUNT(elm.school_id) AS address_count,
        GROUP_CONCAT(elm.school_id) AS school_ids
    FROM 
        events e
    LEFT JOIN 
        event_location_mapping elm 
        ON e.id = elm.event_id 
        AND elm.school_id IS NOT NULL 
        AND elm.school_id != ''
    WHERE 
        e.begin_date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR) -- Filter dates within the last 2 years
    GROUP BY 
        e.id, e.event_id, e.event_type, e.magnitude, e.begin_date, e.property_damage_reported
    ORDER BY 
        e.begin_date ASC, e.event_id ASC
";

// Apply limit and offset unless 'Load All' is requested
if (!$loadAll) {
    $sql .= " LIMIT $limit OFFSET $offset";
}

// Debugging: Log the constructed SQL query
error_log("SQL Query: " . $sql);

// Set headers to prevent caching
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1
header('Pragma: no-cache'); // HTTP 1.0
header('Expires: 0'); // Proxies

if ($result = $conn->query($sql)) {
    $data = array();

    while ($row = $result->fetch_assoc()) {
        // Convert school_ids to an array
        if (!empty($row['school_ids'])) {
            $row['school_ids'] = explode(',', $row['school_ids']);
        } else {
            $row['school_ids'] = [];
        }
        $data[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($data);
    $result->free();
} else {
    echo json_encode(['error' => 'Query execution failed: ' . $conn->error]);
}

$conn->close();
?>
