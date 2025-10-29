<?php
// session_start();
// $data = json_decode(file_get_contents("php://input"));
// $email = $data->email;
// $password = $data->password;


// $conn = new mysqli("localhost", "root", "", "ecommerce");
// if ($conn->connect_error) {
//   echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
//   exit;
// }


// $stmt = $conn->prepare("SELECT user_id, name, email, password FROM users WHERE email = ?");
// $stmt->bind_param("s", $email);
// $stmt->execute();
// $result = $stmt->get_result();
// $user = $result->fetch_assoc();

// if ($user) {
  
//   if ($password === $user['password']) {
//     $_SESSION['user'] = [
//       'user_id' => $user['user_id'],
//       'name' => $user['name'],
//       'email' => $user['email']
//     ];
//     echo json_encode(['status' => 'success', 'user' => $_SESSION['user']]);
//   } else {
//     echo json_encode(['status' => 'error', 'message' => 'Incorrect password']);
//   }
// } else {
//   echo json_encode(['status' => 'error', 'message' => 'Email not found']);
// }

// $stmt->close();
// $conn->close();

session_start();
$data = json_decode(file_get_contents("php://input"));
$email = $data->email;
$password = $data->password;

$conn = new mysqli("localhost", "root", "", "motoecommerce");
if ($conn->connect_error) {
  echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
  exit;
}

// Fetch user with lockout fields
$stmt = $conn->prepare("SELECT u.user_id, u.name, u.email, u.password, u.failed_attempts, u.last_failed_login, u.is_locked, r.name as role FROM users u
JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id WHERE u.email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
  // Check if user is locked
  if ($user['is_locked']) {
    $lockTime = strtotime($user['last_failed_login']);
    $currentTime = time();
    if (($currentTime - $lockTime) < 300) { // 5 minutes
      echo json_encode(['status' => 'error', 'message' => 'Account locked. Try again in 5 minutes.']);
      exit;
    } else {
      // Unlock user
      $stmt = $conn->prepare("UPDATE users SET failed_attempts = 0, is_locked = 0 WHERE email = ?");
      $stmt->bind_param("s", $email);
      $stmt->execute();
    }
  }

  // Check password
  if ($password === $user['password']) {
    $_SESSION['user'] = [
      'user_id' => $user['user_id'],
      'name' => $user['name'],
      'email' => $user['email'],
      'role' => $user['role']
    ];
    // Reset failed attempts
    $stmt = $conn->prepare("UPDATE users SET failed_attempts = 0, last_failed_login = NULL WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();

    echo json_encode(['status' => 'success', 'user' => $_SESSION['user']]);
  } else {
    $attempts = $user['failed_attempts'] + 1;
    $isLocked = $attempts >= 3 ? 1 : 0;
    $stmt = $conn->prepare("UPDATE users SET failed_attempts = ?, last_failed_login = NOW(), is_locked = ? WHERE email = ?");
    $stmt->bind_param("iis", $attempts, $isLocked, $email);
    $stmt->execute();

    $message = $isLocked ? 'Account locked due to multiple failed attempts. Try again in 5 minutes.' : 'Incorrect password';
    echo json_encode(['status' => 'error', 'message' => $message]);
  }
} else {
  echo json_encode(['status' => 'error', 'message' => 'Email not found']);
}

$stmt->close();
$conn->close();


?>
