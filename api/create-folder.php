<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

header("Content-Type: application/json");

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => [
        'key'    => 'AKIAST6S7JQ4TCXYKW7X',
        'secret' => '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',
    ]
]);

$bucket = 'case-exhibit-storage';

$data = json_decode(file_get_contents("php://input"), true);
$folderPath = rtrim($data['folderName'], '/') . '/';

if (!$folderPath) {
    echo json_encode(["success" => false, "error" => "No folder name provided."]);
    exit;
}

try {
    $s3->putObject([
        'Bucket' => $bucket,
        'Key'    => $folderPath . "placeholder.txt",
        'Body'   => "This is a placeholder file.",
        'ACL'    => 'private'
    ]);

    echo json_encode(["success" => true, "message" => "Folder created successfully!", "folderPath" => $folderPath]);
} catch (AwsException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>