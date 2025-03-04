<?php
require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

function getS3Client() {
    $config = require 'aws-config.php';
    return new S3Client($config);
}

function createCaseFolder($caseId, $folderStructure = []) {
    $s3 = getS3Client();
    $config = require 'aws-config.php';
    $bucket = $config['bucket'];

    foreach ($folderStructure as $folder) {
        $folderPath = "cases/{$caseId}/" . trim($folder, "/") . '/';
        try {
            $s3->putObject([
                'Bucket' => $bucket,
                'Key'    => $folderPath,
                'Body'   => '',
                'ACL'    => 'private'
            ]);
        } catch (AwsException $e) {
            error_log("S3 Error creating folder $folderPath: " . $e->getMessage());
            return false;
        }
    }
    return true;
}

function uploadCaseFile($caseId, $folderPath, $fileTmp, $fileName) {
    $s3 = getS3Client();
    $config = require 'aws-config.php';
    $bucket = $config['bucket'];

    $key = "cases/{$caseId}/" . trim($folderPath, "/") . '/' . $fileName;

    try {
        $s3->putObject([
            'Bucket' => $bucket,
            'Key'    => $key,
            'SourceFile' => $fileTmp,
            'ACL'    => 'private'
        ]);
        return true;
    } catch (AwsException $e) {
        error_log("S3 Error uploading file $key: " . $e->getMessage());
        return false;
    }
}