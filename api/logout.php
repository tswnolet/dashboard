<?php
session_set_cookie_params([
  'lifetime' => 365 * 24 * 60 * 60, // 1 year
  'path' => '/',
  'domain' => '.dalyblackdata.com', // Your domain
  'secure' => true, // For HTTPS
  'httponly' => true,
  'samesite' => 'None', // Required for cross-origin
]);
require './headers.php';

// Unset all session variables
$_SESSION = array();

// Debugging: Check session cookie before and after logout
error_log("Before logout: " . session_id());

// Clear session and cookie
setcookie(session_name(), '', time() - 42000, 
    $params["path"], $params["domain"], 
    $params["secure"], $params["httponly"]);

// Debugging: Check if cookie deletion succeeded
error_log("After logout: " . session_id());

session_start();
session_unset();
session_destroy();
error_log("Session destroyed: " . session_id()); // Log session ID after destruction

echo json_encode([
  'success' => true,
  'session_id' => session_id(),
]);

// Return a response
echo json_encode(['destroyed' => true]);
?>