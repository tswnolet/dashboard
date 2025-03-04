<?php
require 's3-helper.php';

header('Content-Type: application/json');

$caseId = $_POST['case_id'] ?? '';
$folderPath = $_POST['folder_path'] ?? '';

if (empty($caseId) || empty($folderPath) || empty($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required data']);
    exit;
}

$fileTmp = $_FILES['file']['tmp_name'];
$fileName = $_FILES['file']['name'];

if (uploadCaseFile($caseId, $folderPath, $fileTmp, $fileName)) {
    echo json_encode(['success' => true, 'message' => 'File uploaded successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'File upload to S3 failed']);
}