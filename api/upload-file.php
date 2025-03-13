<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ47ZAKECBX',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';
$baseFolder = 'Exhibits/';

$uploadedFiles = [];

function getUniqueFileName($s3, $bucket, $folder, $file_name) {
    $path_info = pathinfo($file_name);
    $name = $path_info['filename'];
    $extension = isset($path_info['extension']) ? "." . $path_info['extension'] : "";
    $new_name = $name;
    $counter = 1;

    while (true) {
        $s3Key = rtrim($folder, '/') . '/' . ltrim($new_name . $extension, '/');
        if (!$s3->doesObjectExist($bucket, $s3Key)) {
            return $new_name . $extension;
        }
        $new_name = $name . " ($counter)";
        $counter++;
    }
}

if (!isset($_FILES['files'])) {
    echo json_encode(['success' => false, 'error' => 'No files received.']);
    exit;
}

foreach ($_FILES['files']['name'] as $index => $name) {
    $fileTmp = $_FILES['files']['tmp_name'][$index];
    $filePath = $_POST['filePaths'][$index];
    $normalizedFilePath = ltrim($filePath, '/');

    $fullPath = $baseFolder . $normalizedFilePath;

    $folderPath = dirname($fullPath) . '/';
    $fileName = basename($fullPath);

    $uniqueFileName = getUniqueFileName($s3, $bucket, $folderPath, $fileName);

    try {
        $s3->putObject([
            'Bucket' => $bucket,
            'Key'    => $folderPath . $uniqueFileName,
            'SourceFile' => $fileTmp,
            'ACL'    => 'private'
        ]);

        $uploadedFiles[] = $folderPath . $uniqueFileName;
    } catch (AwsException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Files uploaded!',
    'files' => $uploadedFiles
]);
?>