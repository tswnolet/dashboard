<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header("Content-Type: application/json");

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ47ZAKECBX',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';
$data = json_decode(file_get_contents("php://input"), true);
$folderName = $data['folderName'] ?? '';
$currentPath = $data['currentPath'] ?? 'Exhibits/';

if (!$folderName) {
    echo json_encode(['error' => 'No folder name provided']);
    exit;
}

$fullPath = rtrim($currentPath, '/') . '/' . $folderName . '/';

try {
    $s3->putObject([
        'Bucket' => $bucket,
        'Key'    => $fullPath,
        'Body'   => ''
    ]);

    echo json_encode(['success' => true, 'message' => "Folder '$folderName' created inside '$currentPath'"]);
} catch (AwsException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>