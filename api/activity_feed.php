<?php
require './db.php';
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $case_id = $_GET['case_id'] ?? null;
    $sql = "
        SELECT feed_updates.*, u.name AS author
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
                'task_id' => $row['task'],
                'pinned' => $row['pinned'],
                'hidden' => $row['hidden']
            ];
        }
        echo json_encode(['success' => true, 'feed_updates' => $activityFeed]);
    } else {
        echo json_encode(['success' => false, 'feed_updates' => ['No activity found']]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $author = $_SESSION['user_id'] ?? 1;

    $case_id = $data['case_id'] ?? null;
    $type = $data['type'] ?? 'notes';
    $subject = $data['subject'] ?? '';
    $content = $data['content'] ?? '';
    $attachments = isset($data['attachments']) ? json_encode($data['attachments']) : null;
    $tags = isset($data['tags']) ? json_encode($data['tags']) : null;
    $task_id = $data['task'] ?? null;

    if (!$case_id || !$subject || !$content) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }

    $sql = "
        INSERT INTO feed_updates (author, case_id, type, subject, content, attachments, tags, task)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisssssi", $author, $case_id, $type, $subject, $content, $attachments, $tags, $task_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Activity added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add activity.']);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']);