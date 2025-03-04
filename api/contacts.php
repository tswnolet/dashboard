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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $first_name = $input['first_name'] ?? null;
    $middle_name = $input['middle_name'] ?? null;
    $last_name = $input['last_name'] ?? null;
    $nickname = $input['nickname'] ?? null;
    $prefix = $input['prefix'] ?? null;
    $suffix = $input['suffix'] ?? null;
    $company_name = $input['company_name'] ?? null;
    $job_title = $input['job_title'] ?? null;
    $department = $input['department'] ?? null;
    $date_of_birth = !empty($input['date_of_birth']) ? $input['date_of_birth'] : null;
    $date_of_death = !empty($input['date_of_death']) ? $input['date_of_death'] : null;
    $is_company = !empty($input['is_company']) ? 1 : 0;    

    $stmt = $conn->prepare("INSERT INTO contacts 
        (first_name, middle_name, last_name, nickname, prefix, suffix, company_name, job_title, department, date_of_birth, date_of_death, is_company) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        "ssssssssssss",
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
        $is_company
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Contact added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding contact']);
    }

    $stmt->close();
    $conn->close();
    exit;
}