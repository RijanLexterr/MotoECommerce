<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class ForgotPasswordController
{
    private $db; // mysqli

    public function __construct($db)
    {
        $this->db = $db;
    }

    // CREATE REQUEST (auto-generate alphanumeric code)
    public function createRequest()
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $email = trim($data['email'] ?? '');
        $created_at = date("Y-m-d H:i:s");

        if (empty($email)) {
            echo json_encode(["status" => "error", "message" => "Email is required."]);
            return;
        }

        // Generate a random 6-character alphanumeric code
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }

        // Invalidate any previous codes for this email
        $this->db->query("UPDATE ForgotPassword SET isValid = 0 WHERE email = '$email'");

        // Insert new record
        $stmt = $this->db->prepare("
            INSERT INTO forgotPassword (email, code, isValid, created_at)
            VALUES (?, ?, 1, ?)
        ");
        $stmt->bind_param("sss", $email, $code, $created_at);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Reset code generated successfully.",
                "code" => $code, // can be sent via email
                "id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // VALIDATE EMAIL + CODE (used on page load)
    public function validateCode()
    {
        $email = $_GET['email'] ?? '';
        $code = $_GET['code'] ?? '';

        if (empty($email) || empty($code)) {
            echo json_encode(["status" => "error", "message" => "Email and code are required."]);
            return;
        }

        $stmt = $this->db->prepare("SELECT * FROM ForgotPassword WHERE email = ? AND code = ? AND isValid = 1");
        $stmt->bind_param("ss", $email, $code);
        $stmt->execute();
        $result = $stmt->get_result();
        $record = $result->fetch_assoc();

        if ($record) {
            echo json_encode([
                "status" => "success",
                "message" => "Valid code.",
                "email" => $record['email']
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Invalid or expired code."
            ]);
        }
    }

    // INVALIDATE CODE (after successful password reset)
    public function invalidate()
    {
        $email = $_GET['email'] ?? '';
        $code = $_GET['code'] ?? '';

        $stmt = $this->db->prepare("UPDATE ForgotPassword SET isValid = 0 WHERE email = ? AND code = ?");
        $stmt->bind_param("ss", $email, $code);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Code invalidated."]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}

// =======================
// ROUTER
// =======================
$controller = new ForgotPasswordController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'createRequest':
            $controller->createRequest();
            break;
        case 'validateCode':
            $controller->validateCode();
            break;
        case 'invalidate':
            $controller->invalidate();
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
