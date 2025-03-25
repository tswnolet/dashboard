<?php
require 'vendor/autoload.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header('Content-Type: application/json');

$config = require 'aws-config.php';
$bucket = $config['bucket'];
$s3 = new S3Client($config);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $caseId = $_POST['case_id'] ?? null;
    $sectionName = $_POST['section_name'] ?? null;

    if (!$caseId || !$sectionName || !isset($_FILES['file'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
        exit;
    }

    $sectionFolder = "cases/{$caseId}/{{Name}}/{$sectionName}/";

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
            $key = $sectionFolder . $originalName;
        
            $s3->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'SourceFile' => $tmpFile,
                'ACL' => 'private',
            ]);
        }        

        echo json_encode(['success' => true, 'message' => 'Files uploaded']);
    } catch (AwsException $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
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