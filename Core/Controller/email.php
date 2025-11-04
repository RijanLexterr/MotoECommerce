<?php
require_once '../email.php';

class EmailController {
    public function send() {
        // Read JSON from AngularJS POST
        $input = json_decode(file_get_contents("php://input"), true);

        $to = $input['to'] ?? null;
        $subject = $input['subject'] ?? 'No Subject';
        $body = $input['body'] ?? '';
        $toName = $input['name'] ?? '';

        if (!$to) {
            echo json_encode(["status" => "error", "message" => "Recipient email is missing."]);
            return;
        }

        if (sendEmail($to, $subject, $body, $toName)) {
            echo json_encode(["status" => "success", "message" => "Email sent successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to send email."]);
        }
    }
}

$controller = new EmailController();

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'send':
            $controller->send();
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified."]);
}
?>
