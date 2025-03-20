<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$contact_id = $_POST['id'] ?? null;
$first_name = $_POST['first_name'] ?? null;
$middle_name = $_POST['middle_name'] ?? null;
$last_name = $_POST['last_name'] ?? null;
$full_name = ($_POST['first_name'] ? $_POST['first_name'] . ' ' : '') . ($_POST['middle_name']? $_POST['middle_name'] . ' ' : '') . ($_POST['last_name'] ? $_POST['last_name'] : '') ?? null;
$nickname = $_POST['nickname'] ?? null;
$prefix = $_POST['prefix'] ?? null;
$suffix = $_POST['suffix'] ?? null;
$company_name = $_POST['company_name'] ?? null;
$job_title = $_POST['job_title'] ?? null;
$department = $_POST['department'] ?? null;
$date_of_birth = $_POST['date_of_birth'] ?? null;
$date_of_death = (!empty($_POST['date_of_death']) && $_POST['date_of_death'] !== "null") ? $_POST['date_of_death'] : null;
$is_company = isset($_POST['is_company']) && $_POST['is_company'] === 'true' ? 1 : 0;

if (!$contact_id) {
    echo json_encode(["success" => false, "message" => "Contact ID is required"]);
    exit;
}

if ($date_of_death === null) {
    $sql = "UPDATE contacts SET 
            first_name = ?, middle_name = ?, last_name = ?, full_name = ?, nickname = ?, prefix = ?, suffix = ?, 
            company_name = ?, job_title = ?, department = ?, date_of_birth = ?, is_company = ?, updated_at = NOW() 
        WHERE id = ?";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param("sssssssssssii", 
        $first_name, $middle_name, $last_name, $full_name, $nickname, $prefix, $suffix, 
        $company_name, $job_title, $department, $date_of_birth, $is_company, $contact_id
    );
} else {
    $sql = "UPDATE contacts SET 
        first_name = ?, middle_name = ?, last_name = ?, full_name = ?, nickname = ?, prefix = ?, suffix = ?, 
        company_name = ?, job_title = ?, department = ?, date_of_birth = ?, date_of_death = ?, is_company = ?, updated_at = NOW() 
    WHERE id = ?";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param("sssssssssssiii", 
        $first_name, $middle_name, $last_name, $full_name, $nickname, $prefix, $suffix, 
        $company_name, $job_title, $department, $date_of_birth, $date_of_death, $is_company, $contact_id
    );
}

$updateSuccess = $stmt->execute();

if (!$updateSuccess) {
    echo json_encode(["success" => false, "message" => "Failed to update contact details"]);
    exit;
}

if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
    $uploadPath = "uploads/contacts/";
    $filename = time() . "_" . basename($_FILES["profile_picture"]["name"]);
    $targetFilePath = $uploadPath . $filename;

    if (move_uploaded_file($_FILES["profile_picture"]["tmp_name"], $targetFilePath)) {
        $updatePicSQL = "UPDATE contacts SET profile_picture = ? WHERE id = ?";
        $stmt = $conn->prepare($updatePicSQL);
        $stmt->bind_param("si", $targetFilePath, $contact_id);
        $stmt->execute();
    }
}

$phones = isset($_POST['phones']) ? json_decode($_POST['phones'], true) : [];
$deletePhoneSQL = "DELETE FROM contact_details WHERE contact_id = ? AND detail_type = 'phone'";
$stmt = $conn->prepare($deletePhoneSQL);
$stmt->bind_param("i", $contact_id);
$stmt->execute();

foreach ($phones as $phone) {
    $insertPhoneSQL = "INSERT INTO contact_details (contact_id, detail_type, detail_data) VALUES (?, 'phone', ?)";
    $phoneData = json_encode($phone);
    $stmt = $conn->prepare($insertPhoneSQL);
    $stmt->bind_param("is", $contact_id, $phoneData);
    $stmt->execute();
}

$emails = isset($_POST['emails']) ? json_decode($_POST['emails'], true) : [];
$deleteEmailSQL = "DELETE FROM contact_details WHERE contact_id = ? AND detail_type = 'email'";
$stmt = $conn->prepare($deleteEmailSQL);
$stmt->bind_param("i", $contact_id);
$stmt->execute();

foreach ($emails as $email) {
    $insertEmailSQL = "INSERT INTO contact_details (contact_id, detail_type, detail_data) VALUES (?, 'email', ?)";
    $emailData = json_encode($email);
    $stmt = $conn->prepare($insertEmailSQL);
    $stmt->bind_param("is", $contact_id, $emailData);
    $stmt->execute();
}

$addresses = isset($_POST['addresses']) ? json_decode($_POST['addresses'], true) : [];
$deleteAddressSQL = "DELETE FROM contact_details WHERE contact_id = ? AND detail_type = 'address'";
$stmt = $conn->prepare($deleteAddressSQL);
$stmt->bind_param("i", $contact_id);
$stmt->execute();

foreach ($addresses as $address) {
    $insertAddressSQL = "INSERT INTO contact_details (contact_id, detail_type, detail_data) VALUES (?, 'address', ?)";
    $addressData = json_encode($address);
    $stmt = $conn->prepare($insertAddressSQL);
    $stmt->bind_param("is", $contact_id, $addressData);
    $stmt->execute();
}

echo json_encode(["success" => true, "message" => "Contact updated successfully"]);
?>