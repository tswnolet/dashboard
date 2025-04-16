<?php
require 'headers.php';
require './db.php';
session_start();

header("Content-Type: application/json");

$requestMethod = $_SERVER['REQUEST_METHOD'];

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

if ($requestMethod === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['user'], $input['password'])) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $username = $conn->real_escape_string($input['user']);
    $password = $input['password'];

    if (empty($username) || empty($password)) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $sql = "SELECT id, password FROM users WHERE LOWER(user) = LOWER(?) OR LOWER(email) = LOWER(?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['password'])) {
            $_SESSION['id'] = $row['id'];
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["error" => "Invalid credentials"]);
        }
    } else {
        echo json_encode(["error" => "User not found"]);
    }
} else if ($requestMethod === 'GET') {
    if (isset($_GET['billing_rate'])) {
        $rate_id = $_GET['billing_rate'] ?? '';

        $sql = "
            SELECT 
                users.user, 
                users.name, 
                users.id, 
                billing_rate.rate,
                billing_rate.timekeeper_id,
                billing_rate.classification_id,
                contacts.profile_picture
            FROM users
            LEFT JOIN billing_rate 
                ON billing_rate.user_id = users.id 
                AND billing_rate.billing_rates_id = ?
            LEFT JOIN contacts 
                ON contacts.id = users.contact_id
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $rate_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode(['success' => true, 'users' => $users]);
        exit;
    }

    if (isset($_GET['users'])) {
        $sql = "SELECT user, id, name, access_level FROM users WHERE access_level != 'no access'";
        $result = $conn->query($sql);

        $users = [];

        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }

        echo json_encode(["users" => $users]);
        exit;
    }

    if (isset($_GET['id'])) {
        $id = $_GET['id'];

        $sql = 'SELECT * FROM users WHERE id = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if (!$user) {
            echo json_encode(['success' => false, 'error' => 'User not found']);
            exit;
        }

        $contact_id = $user['contact_id'];

        $contactSql = "SELECT * FROM contacts WHERE id = ?";
        $contactStmt = $conn->prepare($contactSql);
        $contactStmt->bind_param("i", $contact_id);
        $contactStmt->execute();
        $contactResult = $contactStmt->get_result();
        $contact = $contactResult->fetch_assoc();
        $contactStmt->close();

        if ($contact) {
            $contact['phones'] = fetchContactDetails($conn, $contact_id, 'phone');
            $contact['emails'] = fetchContactDetails($conn, $contact_id, 'email');
            $contact['addresses'] = fetchContactDetails($conn, $contact_id, 'address');
        }

        echo json_encode(['success' => true, 'contacts' => $contact]);
        exit;
    }

    if (isset($_GET['user'])) {
        $user = $conn->real_escape_string($_GET['user']);

        $sql = "SELECT COUNT(*) AS user_exists FROM users WHERE user = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $user);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        echo json_encode(["exists" => $row['user_exists'] > 0]);
        exit;
    }

    $sql = "SELECT id, name, user FROM users";
    $result = $conn->query($sql);

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode(["users" => $users]);
    exit;
}


$conn->close();
?>