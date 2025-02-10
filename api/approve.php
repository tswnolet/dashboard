<?php
require './db.php';

if (!isset($_GET['token'])) {
    error_log("Invalid request: token not set");
    echo "Invalid request.";
    exit;
}

$token = $_GET['token'];

// Check if the token exists and fetch the user's information
$stmt = $conn->prepare('SELECT id, name, user, email, access_level FROM users WHERE token = ?');
$stmt->bind_param('s', $token);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo "Invalid or expired token.";
    exit;
}

$stmt->bind_result($userId, $name, $username, $email, $accessLevel);
$stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'];

    if ($action === 'approve') {
        $stmt = $conn->prepare('UPDATE users SET access_level = "user", token = NULL WHERE id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        echo "User access level has been updated successfully.";
    } elseif ($action === 'deny') {
        $stmt = $conn->prepare('DELETE FROM users WHERE id = ?');
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        echo "User has been denied and removed.";
    }

    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Approve User</title>
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            max-width: 600px;
            width: 100%;
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
        .button-container {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }
        .button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        .approve {
            background-color: #4CAF50;
            color: white;
        }
        .deny {
            background-color: #f44336;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Approve User</h1>
        </div>
        <div class="content">
            <h1>User Information</h1>
            <p><strong>Name:</strong> <?php echo htmlspecialchars($name); ?></p>
            <p><strong>Username:</strong> <?php echo htmlspecialchars($username); ?></p>
            <p><strong>Email:</strong> <?php echo htmlspecialchars($email); ?></p>
            <p><strong>Access Level:</strong> <?php echo htmlspecialchars($accessLevel); ?></p>
            <div class="button-container">
                <form method="POST">
                    <button type="submit" name="action" value="approve" class="button approve">Approve</button>
                    <button type="submit" name="action" value="deny" class="button deny">Deny</button>
                </form>
            </div>
        </div>
        <div class="footer">
            <p>&copy; <?php echo date('Y'); ?> Daly & Black</p>
        </div>
    </div>
</body>
</html>
