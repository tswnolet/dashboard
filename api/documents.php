<?php
require 'headers.php';
require 'vendor/autoload.php';
require 'db.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header('Content-Type: application/json');

$config = require 'aws-config.php';
$bucket = $config['bucket'];
$s3 = new S3Client($config);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true);
    $caseId = $body['case_id'] ?? null;
    $path = $body['path'] ?? null;

    if (!$caseId || !$path) {
        echo json_encode(['success' => false, 'message' => 'Missing case_id or path']);
        exit;
    }

    try {
        $s3->putObject([
            'Bucket' => $bucket,
            'Key' => rtrim($path, '/') . '/',
            'Body' => '',
            'ACL' => 'private',
        ]);

        echo json_encode(['success' => true, 'message' => 'Folder created']);
    } catch (AwsException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }

    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    $keys = $body['keys'] ?? [];

    if (empty($keys)) {
        echo json_encode(['success' => false, 'message' => 'No keys provided for deletion']);
        exit;
    }

    try {
        $allObjectsToDelete = [];

        foreach ($keys as $key) {
            if (substr($key, -1) === '/') {
                $results = $s3->listObjectsV2([
                    'Bucket' => $bucket,
                    'Prefix' => $key,
                ]);
        
                if (!empty($results['Contents'])) {
                    foreach ($results['Contents'] as $object) {
                        $allObjectsToDelete[] = ['Key' => $object['Key']];
                    }
                }
            } else {
                $allObjectsToDelete[] = ['Key' => $key];
            }
        }
        
        if (!empty($allObjectsToDelete)) {
            $s3->deleteObjects([
                'Bucket' => $bucket,
                'Delete' => [
                    'Objects' => $allObjectsToDelete,
                    'Quiet' => true
                ]
            ]);
        
            $stmt = $conn->prepare("DELETE FROM files WHERE file_path = ?");
            foreach ($allObjectsToDelete as $object) {
                $stmt->bind_param("s", $object['Key']);
                $stmt->execute();
            }
        }

        $stmt = $conn->prepare("DELETE FROM files WHERE file_path = ?");
        foreach ($keys as $key) {
            $stmt->bind_param("s", $key);
            $stmt->execute();
        }

        echo json_encode(['success' => true, 'message' => 'Files deleted']);
    } catch (AwsException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $caseId = $_POST['case_id'] ?? null;
    $targetPath = $_POST['target_path'] ?? $_POST['section_name'] ?? null;
    $userId = $_POST['user_id'] ?? null;

    if (!$caseId || !$targetPath || !isset($_FILES['file']) || !$userId) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
        exit;
    }

    $sanitizedPath = trim($targetPath, '/');
    $sanitizedPath = preg_replace('#^\{\{Name\}\}/?#', '', $sanitizedPath);
    $uploadFolder = $sanitizedPath === '' ? "cases/{$caseId}/{{Name}}/" : "cases/{$caseId}/{{Name}}/{$sanitizedPath}/";

    try {
        $files = $_FILES['file'];

        if (!is_array($files['tmp_name'])) {
            $files = [
                'name' => [$files['name']],
                'tmp_name' => [$files['tmp_name']],
            ];
        }

        foreach ($files['tmp_name'] as $index => $tmpFile) {
            $originalName = basename($files['name'][$index]);
            $key = $uploadFolder . $originalName;

            $s3->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'SourceFile' => $tmpFile,
                'ACL' => 'private',
            ]);

            $stmt = $conn->prepare("INSERT INTO files (author_id, case_id, file_name, file_path) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iiss", $userId, $caseId, $originalName, $key);
            $stmt->execute();
        }

        echo json_encode(['success' => true, 'message' => 'Files uploaded']);
    } catch (AwsException $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }

    exit;
}

$caseId = $_GET['case_id'] ?? null;

if (!$caseId) {
    echo json_encode(['success' => false, 'message' => 'Missing case_id']);
    exit;
}

try {
    $prefix = "cases/{$caseId}/";

    $result = $s3->listObjectsV2([
        'Bucket' => $bucket,
        'Prefix' => $prefix,
    ]);

    $filesByFolder = [];

    if (!empty($result['Contents'])) {
        foreach ($result['Contents'] as $object) {
            $key = $object['Key'];
            $isFolder = substr($key, -1) === '/';

            $relativePath = str_replace($prefix, '', $key);
            $parts = explode('/', $relativePath);

            $fileName = array_pop($parts);
            $folderPath = implode('/', $parts) ?: 'root';

            if (!isset($filesByFolder[$folderPath])) {
                $filesByFolder[$folderPath] = [];
            }

            $filesByFolder[$folderPath][] = [
                'name' => $isFolder ? '(Folder)' : $fileName,
                'key' => $key,
                'url' => !$isFolder ? $s3->getObjectUrl($bucket, $key) : null,
                'last_modified' => (string)$object['LastModified'],
                'size' => $object['Size'],
                'is_folder' => $isFolder
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'folders' => $filesByFolder
    ]);
} catch (AwsException $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}