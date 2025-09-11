<?php
session_start();
$data = json_decode(file_get_contents("php://input"));
$email = $data->email;
$password = $data->password;

// Connect to your database
$conn = new mysqli("localhost", "root", "", "ecommerce");
if ($conn->connect_error) {
  echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
  exit;
}

// Prepare query to fetch user by email
$stmt = $conn->prepare("SELECT user_id, name, email, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
  // Compare plain-text password
  if ($password === $user['password']) {
    $_SESSION['user'] = [
      'user_id' => $user['user_id'],
      'name' => $user['name'],
      'email' => $user['email']
    ];
    echo json_encode(['status' => 'success', 'user' => $_SESSION['user']]);
  } else {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect password']);
  }
} else {
  echo json_encode(['status' => 'error', 'message' => 'Email not found']);
}

$stmt->close();
$conn->close();
?>
