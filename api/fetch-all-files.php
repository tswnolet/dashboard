<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header('Content-Type: application/json');

// Use Direct Credentials Instead of aws-config.php
$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ4TCXYKW7X',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';

try {
    $objects = $s3->listObjectsV2(['Bucket' => $bucket]);

    $files = [];
    $directories = [];

    if (isset($objects['Contents'])) {
        foreach ($objects['Contents'] as $object) {
            $key = $object['Key'];

            $pathParts = explode('/', $key);
            $fileName = array_pop($pathParts);
            $folderPath = implode('/', $pathParts);

            if (substr($key, -1) === '/') {
                $directories[] = $key;
            } else {
                // Generate Pre-signed URL for Secure Access
                $cmd = $s3->getCommand('GetObject', [
                    'Bucket' => $bucket,
                    'Key'    => $key
                ]);
                $request = $s3->createPresignedRequest($cmd, '+60 minutes');

                $files[] = [
                    'name' => $fileName,
                    'key' => $key,
                    'folder' => $folderPath,
                    'size' => $object['Size'],
                    'lastModified' => $object['LastModified']->format('Y-m-d H:i:s'),
                    'url' => (string) $request->getUri()
                ];
            }
        }
    }

    echo json_encode([
        'success' => true,
        'files' => $files,
        'directories' => array_unique($directories)
    ]);
} catch (AwsException $e) {
    echo json_encode(['success' => false, 'message' => 'S3 Error: ' . $e->getMessage()]);
}
?>