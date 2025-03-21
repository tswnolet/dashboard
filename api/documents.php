<?php
require 'vendor/autoload.php';

use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header('Content-Type: application/json');

$caseId = $_GET['case_id'] ?? null;

if (!$caseId) {
    echo json_encode(['success' => false, 'message' => 'Missing case_id']);
    exit;
}

$config = require 'aws-config.php';
$bucket = $config['bucket'];

try {
    $s3 = new S3Client($config);
    $prefix = "cases/{$caseId}/";

    $result = $s3->listObjectsV2([
        'Bucket' => $bucket,
        'Prefix' => $prefix,
    ]);

    $filesByFolder = [];

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