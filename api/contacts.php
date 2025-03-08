<?php
require './db.php';

session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $searchQuery = $_GET['search'] ?? null;

    if ($searchQuery) {
        $contacts = searchContacts($conn, $searchQuery);
    } else {
        $contacts = fetchAllContacts($conn);
    }

    echo json_encode(['success' => true, 'contacts' => $contacts]);
    exit;
}

function fetchAllContacts($conn) {
    $sql = "SELECT * FROM contacts";
    $result = $conn->query($sql);
    $contacts = [];

    while ($contact = $result->fetch_assoc()) {
        $contact_id = $contact['id'];
        $contact['phones'] = fetchContactDetails($conn, $contact_id, 'phone');
        $contact['emails'] = fetchContactDetails($conn, $contact_id, 'email');
        $contact['addresses'] = fetchContactDetails($conn, $contact_id, 'address');
        $contacts[] = $contact;
    }

    return $contacts;
}

function searchContacts($conn, $query) {
    $searchQuery = "%{$query}%";

    $sql = "
        SELECT DISTINCT c.*
        FROM contacts c
        LEFT JOIN contact_details cd 
            ON c.id = cd.contact_id AND cd.detail_type = 'email'
        WHERE 
            REPLACE(TRIM(CONCAT_WS(' ', c.first_name, c.middle_name, c.last_name)), '  ', ' ') LIKE ?
            OR c.nickname LIKE ?
            OR c.company_name LIKE ?
            OR JSON_UNQUOTE(JSON_EXTRACT(cd.detail_data, '$.email')) LIKE ?
        LIMIT 5
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $searchQuery, $searchQuery, $searchQuery, $searchQuery);
    $stmt->execute();

    $result = $stmt->get_result();
    $contacts = [];

    while ($contact = $result->fetch_assoc()) {
        $contact_id = $contact['id'];
        $contact['phones'] = fetchContactDetails($conn, $contact_id, 'phone');
        $contact['emails'] = fetchContactDetails($conn, $contact_id, 'email');
        $contact['addresses'] = fetchContactDetails($conn, $contact_id, 'address');
        $contacts[] = $contact;
    }

    $stmt->close();
    return $contacts;
}

function fetchContactDetails($conn, $contact_id, $detail_type) {
    $stmt = $conn->prepare("SELECT detail_data FROM contact_details WHERE contact_id = ? AND detail_type = ?");
    $stmt->bind_param("is", $contact_id, $detail_type);
    $stmt->execute();
    $result = $stmt->get_result();

    $details = [];
    while ($row = $result->fetch_assoc()) {
        $details[] = json_decode($row['detail_data'], true);
    }

    $stmt->close();
    return $details;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $profilePicturePath = null;

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
    $contact_type   = $is_company ? 'Company' : 'Client';

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
        $contact_id = $stmt->insert_id;

        error_log("Phones Received: " . $_POST['phones']);
        error_log("Emails Received: " . $_POST['emails']);
        error_log("Addresses Received: " . $_POST['addresses']);

        saveContactDetails($conn, $contact_id, 'phone', $_POST['phones']);
        saveContactDetails($conn, $contact_id, 'email', $_POST['emails']);
        saveContactDetails($conn, $contact_id, 'address', $_POST['addresses']);

        echo json_encode(['success' => true, 'message' => 'Contact added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add contact', 'error' => $stmt->error]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

function saveContactDetails($conn, $contact_id, $detail_type, $jsonString) {
    $details = json_decode($jsonString, true);

    if (!is_array($details)) {
        error_log("Invalid $detail_type JSON: " . $jsonString);
        return;
    }

    foreach ($details as $detail) {
        $detailDataJson = json_encode($detail);

        $stmt = $conn->prepare("
            INSERT INTO contact_details (contact_id, detail_type, detail_data) 
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param("iss", $contact_id, $detail_type, $detailDataJson);
        $stmt->execute();
        $stmt->close();
    }
}