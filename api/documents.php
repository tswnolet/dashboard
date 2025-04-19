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
                } else {
                    $allObjectsToDelete[] = ['Key' => $key];
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

        echo json_encode(['success' => true, 'message' => 'Selected files/folders deleted']);
    } catch (AwsException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['zip'])) {
    $body = json_decode(file_get_contents('php://input'), true);
    $keys = $body['keys'] ?? [];
    $caseId = $body['case_id'] ?? null;

    if (empty($keys) || !$caseId) {
        echo json_encode(['success' => false, 'message' => 'Missing keys or case_id']);
        exit;
    }

    $zipFile = tempnam(sys_get_temp_dir(), 'zip');
    $zip = new ZipArchive();

    if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
        echo json_encode(['success' => false, 'message' => 'Failed to create zip file']);
        exit;
    }

    foreach ($keys as $key) {
        if (substr($key, -1) === '/') {
            $objects = $s3->listObjectsV2([
                'Bucket' => $bucket,
                'Prefix' => $key
            ]);

            if (!empty($objects['Contents'])) {
                foreach ($objects['Contents'] as $object) {
                    if (substr($object['Key'], -1) === '/') continue;

                    $s3Object = $s3->getObject([
                        'Bucket' => $bucket,
                        'Key' => $object['Key']
                    ]);

                    $relativePath = str_replace("cases/{$caseId}/{{Name}}/", '', $object['Key']);
                    $zip->addFromString($relativePath, $s3Object['Body']);
                }
            }
        } else {
            $s3Object = $s3->getObject([
                'Bucket' => $bucket,
                'Key' => $key
            ]);

            $relativePath = str_replace("cases/{$caseId}/{{Name}}/", '', $key);
            $zip->addFromString($relativePath, $s3Object['Body']);
        }
    }

    $zip->close();

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename=documents.zip');
    header('Content-Length: ' . filesize($zipFile));
    readfile($zipFile);
    unlink($zipFile);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $caseId = $_POST['case_id'] ?? null;
    $targetPath = $_POST['target_path'] ?? $_POST['section_name'] ?? null;
    $userId = $_POST['user_id'] ?? null;

    $debug = [
        'case_id' => $_POST['case_id'],
        'target_path' => $_POST['target_path'] ?? $_POST['section_name'],
        'user_id' => $_POST['user_id'],
        'files_present' => isset($_FILES['file']),
        'file_names' => isset($_FILES['file']['name']) ? $_FILES['file']['name'] : ''
    ];
    
    if (!$debug['case_id'] || !$debug['target_path'] || !$debug['user_id'] || !$debug['files_present']) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters', 'debug' => $debug]);
        exit;
    }

    $sanitizedPath = trim($targetPath, '/');
    $sanitizedPath = preg_replace('#^\{\{Name\}\}/?#', '', $sanitizedPath);
    $baseFolder = $sanitizedPath === '' ? "cases/{$caseId}/{{Name}}" : "cases/{$caseId}/{{Name}}/{$sanitizedPath}";

    try {
        $files = $_FILES['file'];
        $relativePaths = $_POST['relative_paths'] ?? [];
        if (!is_array($relativePaths)) {
            $relativePaths = [$relativePaths];
        }
        
        if (!is_array($files['tmp_name'])) {
            $files = [
                'name' => [$files['name']],
                'tmp_name' => [$files['tmp_name']],
            ];
            $relativePaths = [$relativePaths];
        }

        foreach ($files['tmp_name'] as $index => $tmpFile) {
            $originalName = basename($files['name'][$index]);
            $relative = $relativePaths[$index] ?? $originalName;
            $relative = str_replace('\\', '/', $relative);
            $key = rtrim($baseFolder, '/') . '/' . ltrim($relative, '/');
            
            $pathParts = explode('/', ltrim($relative, '/'));
            $folderAccumulator = rtrim($baseFolder, '/');
            
            for ($i = 0; $i < count($pathParts) - 1; $i++) {
                $folderAccumulator .= '/' . $pathParts[$i];
                $folderKey = rtrim($folderAccumulator, '/') . '/';
            
                static $createdFolders = [];
                if (!in_array($folderKey, $createdFolders)) {
                    $s3->putObject([
                        'Bucket' => $bucket,
                        'Key' => $folderKey,
                        'Body' => '',
                        'ACL' => 'private',
                    ]);
                    $createdFolders[] = $folderKey;
                }
            }

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
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
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