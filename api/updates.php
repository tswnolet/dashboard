<?php
require 'db.php';

header('Content-Type: application/json');

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'User not authenticated']);
    exit;
}

$userId = $_SESSION['user_id'];

function versionCompare($version1, $version2) {
    return version_compare($version1, $version2, '>');
}

function formatVersion($version) {
    $parts = explode('.', strval($version));

    while (count($parts) < 3) {
        $parts[] = '0';
    }

    return implode('.', array_slice($parts, 0, 3));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['seen'])) {
        echo json_encode(['success' => false, 'error' => 'Missing version']);
        exit;
    }

    $newSeenVersion = formatVersion($data['seen']);

    if (!preg_match('/^\d+\.\d+\.\d+$/', $newSeenVersion)) {
        echo json_encode(['success' => false, 'error' => 'Invalid version format']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE users SET seen_update = ? WHERE id = ?");
    $stmt->bind_param("si", $newSeenVersion, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Seen update version recorded']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update seen version']);
    }

    $stmt->close();
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT seen_update FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->bind_result($seenUpdate);
$stmt->fetch();
$stmt->close();

$seenVersion = formatVersion($seenUpdate ?: '0.0.0');

$sql = "SELECT title, features, version FROM updates";
$result = $conn->query($sql);

$updates = ["titles" => [], "versions" => [], "features" => []];

while ($row = $result->fetch_assoc()) {
    $formattedVersion = formatVersion($row["version"]);
    
    if (versionCompare($formattedVersion, $seenVersion)) {
        $updates["titles"][] = $row["title"];
        $updates["versions"][] = $formattedVersion;

        $decodedFeatures = json_decode($row["features"], true);
        $updates["features"][] = is_array($decodedFeatures) ? array_values($decodedFeatures) : [];
    }
}

$conn->close();

echo json_encode($updates);
?>