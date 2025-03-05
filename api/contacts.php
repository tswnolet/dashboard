<?php
require './db.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM contacts";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(['success' => true, 'contacts' => $data]);
    } else {
        echo json_encode(['success' => false, 'contacts' => []]);
    }
    exit;
}

// Handle POST (Create New Contact)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $profilePicturePath = null;

    // Handle Profile Picture Upload
    if (!empty($_FILES['profile_picture']['name'])) {
        $uploadDir = __DIR__ . '/uploads/contacts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = time() . '_' . basename($_FILES['profile_picture']['name']);
        $targetFilePath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $targetFilePath)) {
            $profilePicturePath = 'uploads/contacts/' . $fileName;
        }
    }

    // Extract Form Fields
    $first_name     = $_POST['first_name'] ?? null;
    $middle_name    = $_POST['middle_name'] ?? null;
    $last_name      = $_POST['last_name'] ?? null;
    $nickname       = $_POST['nickname'] ?? null;
    $prefix         = $_POST['prefix'] ?? null;
    $suffix         = $_POST['suffix'] ?? null;
    $company_name   = $_POST['company_name'] ?? null;
    $job_title      = $_POST['job_title'] ?? null;
    $department     = $_POST['department'] ?? null;
    $date_of_birth  = !empty($_POST['date_of_birth']) ? $_POST['date_of_birth'] : null;
    $date_of_death  = !empty($_POST['date_of_death']) ? $_POST['date_of_death'] : null;
    $is_company     = isset($_POST['is_company']) && $_POST['is_company'] === 'true' ? 1 : 0;
    $contact_type   = isset($_POST['contact_type']) ? $_POST['contact_type'] : ($is_company ? 'Company' : 'Client');

    $sql = "INSERT INTO contacts 
        (first_name, middle_name, last_name, nickname, prefix, suffix, company_name, job_title, department, date_of_birth, date_of_death, is_company, profile_picture, contact_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "sssssssssssiss",
        $first_name,
        $middle_name,
        $last_name,
        $nickname,
        $prefix,
        $suffix,
        $company_name,
        $job_title,
        $department,
        $date_of_birth,
        $date_of_death,
        $is_company,
        $profilePicturePath,
        $contact_type
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Contact added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add contact', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}