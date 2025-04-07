<?php
require './headers.php';
require './db.php';
header('Content-Type: application/json');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $case_id = $_GET['case_id'] ?? null;

    $sql = "
        SELECT 
            feed_updates.*, 
            u.name AS author, 
            d.due, 
            d.done, 
            d.assignees,
            d.id AS deadline_id
        FROM feed_updates 
        JOIN users u ON feed_updates.author = u.id 
        LEFT JOIN deadlines d ON d.task_id = feed_updates.id
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
                'task' => $row['task'],
                'pinned' => $row['pinned'],
                'hidden' => $row['hidden'],
                'deleted' => $row['deleted'],
                'deadline' => $row['deadline_id'] ? [
                    'id' => $row['deadline_id'],
                    'due' => $row['due'],
                    'done' => $row['done'],
                    'assignees' => json_decode($row['assignees'], true)
                ] : null
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

    $case_id = $_POST['case_id'] ?? null;
    $type = $_POST['type'] ?? 'note';
    $due_date = $_POST['due_date'] ?? 'note';
    $subject = $_POST['subject'] ?? '';
    $content = $_POST['content'] ?? '';
    $tags = isset($_POST['tags']) ? json_encode(json_decode($_POST['tags'], true)) : null;
    $task_id = $_POST['task'] ?? null;

    if (!$case_id || !$subject || !$content) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }

    $attachmentsArray = [];
    if (!empty($_FILES['attachment'])) {
        require 'vendor/autoload.php';
        $config = require 'aws-config.php';
        $bucket = $config['bucket'];
        $s3 = new Aws\S3\S3Client($config);

        $files = $_FILES['attachment'];
        $fileCount = is_array($files['name']) ? count($files['name']) : 1;

        for ($i = 0; $i < $fileCount; $i++) {
            $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
            $tmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
            $originalName = basename($name);
            $key = $type === 'calls' ? "cases/{$case_id}/{{Name}}/Call Log/{$originalName}" : "cases/{$case_id}/{{Name}}/Notes/{$originalName}";

            try {
                $s3->putObject([
                    'Bucket' => $bucket,
                    'Key' => $key,
                    'SourceFile' => $tmp,
                    'ACL' => 'private',
                ]);

                $attachmentsArray[] = [
                    'name' => $originalName,
                    'key' => $key,
                    'url' => $s3->getObjectUrl($bucket, $key)
                ];
            } catch (Aws\Exception\AwsException $e) {
                echo json_encode(['success' => false, 'message' => 'S3 Upload failed: ' . $e->getMessage()]);
                exit;
            }
        }
    }

    $attachmentsJson = !empty($attachmentsArray) ? json_encode($attachmentsArray) : null;

    $sql = "
        INSERT INTO feed_updates (author, case_id, type, subject, content, attachments, tags, task)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisssssi", $author, $case_id, $type, $subject, $content, $attachmentsJson, $tags, $task_id);

    if ($stmt->execute()) {
        $insertedId = $conn->insert_id;
    
        if ($type === 'tasks') {
            $dueTimestamp = $due_date ? $due_date . " 23:59:59" : null;
            $assignees = json_encode([$task_id]);
            $deadlineSql = "
                INSERT INTO deadlines (due, assignees, created_by, task_id)
                VALUES (?, ?, ?, ?)
            ";
            $deadlineStmt = $conn->prepare($deadlineSql);
            $deadlineStmt->bind_param("ssii", $dueTimestamp, $assignees, $author, $insertedId);
            $deadlineStmt->execute();
            $deadlineStmt->close();
        }

        if ($type === 'calls') {
            $callDate = $data['date'] ?? null;
            $startTime = $data['start_time'] ?? null;
            $endTime = $data['end_time'] ?? null;
            $contactId = $data['contact']['id'] ?? null;
            $userId = $data['user_id'] ?? $author;
        
            if ($callDate && $startTime && $endTime && $contactId && $userId) {
                $combinedDate = $callDate . ' ' . $startTime;
        
                $callSql = "INSERT INTO call_log (activity_id, date, end_time, contact, user_id) VALUES (?, ?, ?, ?, ?)";
                $callStmt = $conn->prepare($callSql);
                $callStmt->bind_param("isssi", $insertedId, $combinedDate, $endTime, $contactId, $userId);
                $callStmt->execute();
                $callStmt->close();
            }
        }        
    
        echo json_encode(['success' => true, 'message' => 'Activity added successfully.', 'inserted_id' => $insertedId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add activity.']);
    }

    $stmt->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if (isset($data['done']) && $data['done'] === true && $id) {
        $currentTimestamp = date('Y-m-d H:i:s');
        $updateSql = "UPDATE deadlines SET done = ? WHERE task_id = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("si", $currentTimestamp, $id);

        if ($updateStmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Done timestamp updated.', 'done' => $currentTimestamp]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update done timestamp.']);
        }

        $updateStmt->close();
        exit;
    } elseif (isset($data['done']) && $data['done'] == false && $id) {
        $updateSql = "UPDATE deadlines SET done = NULL WHERE task_id = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("i", $id);

        if ($updateStmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Task marked as incomplete.', 'done' => 'false']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to mark task as incomplete.']);
        }

        $updateStmt->close();
        exit;
    }

    $pin = $data['pin'] ?? $_SESSION['user_id'] ?? null;
    $action = $data['action'] ?? 'toggle';

    if (!$id || ($pin === null)) {
        echo json_encode(['success' => false, 'message' => 'Missing id or pin value.']);
        exit;
    }

    $sql = "SELECT pinned FROM feed_updates WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $existing = $result->fetch_assoc();
    $stmt->close();

    $pinnedData = json_decode($existing['pinned'], true);
    if (!$pinnedData) {
        $pinnedData = ['users' => [], 'case' => null];
    }

    if ($pin === "project") {
        $pinnedData['case'] = ($action === 'remove') ? null : 1;
    } else {
        $userId = (int)$pin;
        $pinnedUsers = $pinnedData['users'] ?? [];

        if ($action === 'remove') {
            $pinnedUsers = array_values(array_filter($pinnedUsers, fn($u) => $u != $userId));
        } else {
            if (!in_array($userId, $pinnedUsers)) {
                $pinnedUsers[] = $userId;
            }
        }

        $pinnedData['users'] = $pinnedUsers;
    }

    $updatedJson = json_encode($pinnedData);

    $updateSql = "UPDATE feed_updates SET pinned = ? WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("si", $updatedJson, $id);

    if ($updateStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Pinned state updated.', 'pinned' => $pinnedData]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update pinned state.']);
    }

    $updateStmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']);