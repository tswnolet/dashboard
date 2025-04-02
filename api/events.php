<?php
require 'headers.php';
include './db.php';
$loadAll = isset($_GET['all']) && $_GET['all'] === 'true';

$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
$limit = 2000;

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

if (!$loadAll) {
    $sql .= " LIMIT $limit OFFSET $offset";
}

error_log("SQL Query: " . $sql);

if ($result = $conn->query($sql)) {
    $data = array();

    while ($row = $result->fetch_assoc()) {
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
