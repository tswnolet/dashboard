<?php
session_set_cookie_params([
  'lifetime' => 365 * 24 * 60 * 60, // 1 year
  'path' => '/',
  'domain' => '', // Your domain, leave empty for default
  'secure' => true, // For HTTPS
  'httponly' => true,
  'samesite' => 'None', // Required for cross-origin
]);
session_start();
include './headers.php';

if(isset($_GET['close'])) {
  if (ini_get("session.use_cookies")) {
      $params = session_get_cookie_params();
      setcookie(session_name(), '', time() - 3600, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
  }
  session_unset();
  session_destroy();
  exit;
}

error_log("Session ID: " . session_id());
error_log("Session Data: " . print_r($_SESSION, true));

require './headers.php';

$response = ['isLoggedIn' => false];

if (isset($_SESSION['id'])) {
    $response['isLoggedIn'] = true;
    $response['id'] = $_SESSION['id'];
} else {
    error_log("Session ID not set");
}

header('Content-Type: application/json');
echo json_encode($response);
