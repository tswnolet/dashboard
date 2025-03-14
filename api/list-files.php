<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ4TCXYKW7X',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';
$folder = $_GET['folder'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (isset($input['folderPath'])) {
        $folderPath = rtrim($input['folderPath'], '/') . '/';

        try {
            $result = $s3->listObjectsV2([
                'Bucket' => $bucket,
                'Prefix' => $folderPath
            ]);

            if (isset($result['Contents'])) {
                foreach ($result['Contents'] as $object) {
                    $s3->deleteObject([
                        'Bucket' => $bucket,
                        'Key' => $object['Key']
                    ]);
                }
            }

            echo json_encode(['success' => true, 'message' => 'Folder and contents deleted']);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    } 

    if (isset($input['fileKey'])) {
        try {
            $s3->deleteObject([
                'Bucket' => $bucket,
                'Key' => $input['fileKey']
            ]);
            echo json_encode(['success' => true, 'message' => 'File deleted']);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;
    }
}

try {
    $prefix = $folder ? rtrim($folder, '/') . '/' : "Exhibits/";

    $result = $s3->listObjectsV2([
        'Bucket' => $bucket,
        'Prefix' => $prefix,
        'Delimiter' => '/'
    ]);

    $files = [];
    $folders = [];

    if (isset($result['CommonPrefixes'])) {
        foreach ($result['CommonPrefixes'] as $commonPrefix) {
            $folderPath = trim($commonPrefix['Prefix'], '/');
            $folderName = basename($folderPath);

            $subfolderResult = $s3->listObjectsV2([
                'Bucket' => $bucket,
                'Prefix' => $folderPath . '/',
            ]);

            $folderItemCounts[$folderPath] = count($subfolderResult['Contents'] ?? []);

            $folders[] = [
                'name' => $folderName,
                'isFolder' => true,
                'path' => $folderPath,
                'size' => $folderItemCounts[$folderPath]
            ];
        }
    }

    if (isset($result['Contents'])) {
        foreach ($result['Contents'] as $file) {
            $key = $file['Key'];

            if (substr($key, -1) !== '/' && $key !== $prefix) {
                $cmd = $s3->getCommand('GetObject', [
                    'Bucket' => $bucket,
                    'Key'    => $key
                ]);
                $request = $s3->createPresignedRequest($cmd, '+60 minutes');

                $files[] = [
                    'name' => basename($key),
                    'url'  => (string) $request->getUri(),
                    'size' => $file['Size'],
                    'lastModified' => $file['LastModified']->format('Y-m-d H:i:s'),
                    'etag' => trim($file['ETag'], '"'),
                    'storageClass' => $file['StorageClass'],
                    'fileKey' => $key,
                    'isFolder' => false
                ];
            }
        }
    }

    echo json_encode(array_merge($folders, $files));
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>