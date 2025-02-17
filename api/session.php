<?php
session_set_cookie_params([
  'lifetime' => 24 * 60 * 60,
  'path' => '/',
  'domain' => '',
  'secure' => true,
  'httponly' => true,
  'samesite' => 'None',
]);
session_start();

if(isset($_GET['close'])) {
  if (ini_get("session.use_cookies")) {
      $params = session_get_cookie_params();
      setcookie(session_name(), '', time() - 3600, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
  }
  session_unset();
  session_destroy();
  echo json_encode(['success' => true]);
  exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['isLoggedIn' => false]);
    exit();
}

if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 86400)) {
    session_unset();
    session_destroy();
    echo json_encode(['isLoggedIn' => false]);
    exit();
}

$_SESSION['LAST_ACTIVITY'] = time();

echo json_encode(['isLoggedIn' => true, 'user_id' => $_SESSION['user_id']]);
?>
