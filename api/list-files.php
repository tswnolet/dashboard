<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ47ZAKECBX',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';
$folder = $_GET['folder'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents("php://input"), true);
    $fileKey = $input['fileKey'] ?? '';
    $isFolder = $input['isFolder'] ?? false;

    if (!$fileKey) {
        echo json_encode(['error' => 'No file key provided']);
        exit;
    }

    try {
        if ($isFolder) {
            $objects = $s3->listObjectsV2([
                'Bucket' => $bucket,
                'Prefix' => $fileKey . '/'
            ]);

            if (isset($objects['Contents'])) {
                $deleteKeys = [];
                foreach ($objects['Contents'] as $object) {
                    $deleteKeys[] = ['Key' => $object['Key']];
                }

                if (!empty($deleteKeys)) {
                    $s3->deleteObjects([
                        'Bucket' => $bucket,
                        'Delete' => ['Objects' => $deleteKeys]
                    ]);
                }
            }

            $s3->deleteObject([
                'Bucket' => $bucket,
                'Key'    => rtrim($fileKey, '/') . '/'
            ]);
        } else {
            $s3->deleteObject([
                'Bucket' => $bucket,
                'Key'    => $fileKey
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
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