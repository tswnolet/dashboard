<?php
require './db.php';
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $case_id = $_GET['case_id'] ?? null;
    $sql = "
        SELECT feed_updates.*, u.name AS author, u.profile
        FROM feed_updates 
        JOIN users u ON feed_updates.author = u.id 
        WHERE feed_updates.case_id = ? 
        ORDER BY feed_updates.creation_date DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $case_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $activityFeed = [];
        while ($row = $result->fetch_assoc()) {
            $activityFeed[] = [
                'id' => $row['id'],
                'author' => $row['author'],
                'creation_date' => $row['creation_date'],
                'type' => $row['type'],
                'subject' => $row['subject'],
                'content' => $row['content'],
                'attachments' => json_decode($row['attachments'], true),
                'tags' => json_decode($row['tags'], true),
                'task_id' => $row['task_id'],
                'pinned' => $row['pinned'],
                'hidden' => $row['hidden']
            ];
        }
        echo json_encode(['success' => true, 'feed_updates' => $activityFeed]);
    } else {
        echo json_encode(['success' => false, 'feed_updates' => ['No activity found']]);
    }
} else {
    echo json_encode(['success' => false, 'feed_updates' => ['Invalid request method']]);
}