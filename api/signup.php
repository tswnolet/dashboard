<?php
require './db.php';
require './mailer.php';

session_start();
header("Content-Type: application/json");

$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!isset($input['name'], $input['email'], $input['password'])) {
        echo json_encode(["error" => "Invalid input"]);
        exit;
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $password = trim($input['password']);

    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(["error" => "All fields are required"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["error" => "Invalid email address"]);
        exit;
    }

    $username = strstr($email, '@', true);

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $checkSql = "SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(user) = LOWER(?)";
    $stmt = $conn->prepare($checkSql);
    $stmt->bind_param("ss", $email, $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        error_log("Username or email already exists: Username = $username, Email = $email");
        echo json_encode(['success' => false, 'error' => 'Username or email already exists']);
        exit;
    }

    $token = bin2hex(random_bytes(16)); // Generate a unique token
    $dataPreferences = json_encode(["data" => ["all"]]);

    $insertSql = "INSERT INTO users (name, user, email, password, access_level, token, data_preferences) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $accessLevel = 'no access';
    $stmt = $conn->prepare($insertSql);
    $stmt->bind_param("sssssss", $name, $username, $email, $passwordHash, $accessLevel, $token, $dataPreferences);

    if ($stmt->execute()) {
        $subject = 'Your data. All in. All the time.';
        $message = "
            <html>
            <head>
                <title>Your data. All in. All the time.</title>
                <style>
                    body {
                        font-family: 'Poppins', sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        padding: 20px;
                        background-color: #ffffff;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        margin: 20px auto;
                        max-width: 600px;
                        border-radius: 8px;
                    }
                    .header {
                        background-color: #283955;
                        color: white;
                        padding: 10px 0;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        padding: 20px;
                        text-align: center;
                    }
                    .content h1 {
                        color: #333;
                    }
                    .content p {
                        color: #666;
                        line-height: 1.5;
                    }
                    .footer {
                        background-color: #f4f4f4;
                        color: #666;
                        padding: 10px 0;
                        text-align: center;
                        border-radius: 0 0 8px 8px;
                    }
                    .logo {
                        width: 100px;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Your data. All in. <strong>All the time.</strong></h1>
                    </div>
                    <div class='content'>
                        <h1>Hello $name,</h1>
                        <p>Thank you for signing up. Your username is:</p>
                        <p><strong>$username</strong></p>
                        <p>You will be notified when you get access.</p>
                        <p>Best regards,<br>Tyler</p>
                    </div>
                    <div class='footer'>
                        <img src='https://dalyblackdata.com/api/logo.png' alt='Daly & Black' class='logo' />
                    </div>
                </div>
            </body>
            </html>
        ";
        $userEmailResult = sendEmail($email, $subject, $message);
        error_log("User email result: " . $userEmailResult);

        // Send email to the admin
        $adminSubject = 'New User Signup Notification';
        $adminMessage = "
            <html>
            <head>
                <title>New User Signup</title>
            </head>
            <body>
                <h1>New User Signup</h1>
                <p>A new user has signed up with the following details:</p>
                <p>Username: <strong>$username</strong></p>
                <p>Email: <strong>$email</strong></p>
                <p>Please review and approve their access by clicking the link below:</p>
                <p><a href='https://dalyblackdata.com/api/approve.php?token=$token'>Approve User</a></p>
            </body>
            </html>
        ";
        $adminEmailResult = sendEmail('tnolet@dalyblack.com', $adminSubject, $adminMessage);
        error_log("Admin email result: " . $adminEmailResult);

        if (strpos($userEmailResult, 'Mailer Error') !== false || strpos($adminEmailResult, 'Mailer Error') !== false) {
            echo json_encode(['success' => false, 'error' => $userEmailResult . ' ' . $adminEmailResult]);
        } else {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        }
    } else {
        error_log("Failed to create user: Username = $username, Email = $email");
        echo json_encode(["error" => "Failed to register user"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

$conn->close();
?>