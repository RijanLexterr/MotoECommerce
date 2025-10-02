<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class PaymentTypeController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }

    // CREATE
    public function createPaymentType() {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO payment_types (name, is_active)
            VALUES (?, ?)
        ");
        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;

        $stmt->bind_param(
            "si",
            $data['name'],
            $is_active
        );

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Payment type created",
                "id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // READ ALL
    public function readAll() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        $countResult = $this->db->query("SELECT COUNT(*) as total FROM payment_types");
        $total = $countResult->fetch_assoc()['total'];

        $query = "SELECT * 
                  FROM payment_types 
                  ORDER BY payment_type_id DESC 
                  LIMIT $limit OFFSET $offset";

        $result = $this->db->query($query);
        $data = [];

        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode([
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'data' => $data
        ]);
    }

    // READ ONE
    public function readOne($id) {
        $stmt = $this->db->prepare("
            SELECT * 
            FROM payment_types 
            WHERE payment_type_id = ?
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $paymentType = $result->fetch_assoc();

        if ($paymentType) {
            echo json_encode($paymentType);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Payment type not found"]);
        }
    }

    // UPDATE
    public function updatePaymentType($id) {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE payment_types 
            SET name = ?, is_active = ?
            WHERE payment_type_id = ?
        ");

        $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;

        $stmt->bind_param(
            "sii",
            $data['name'],
            $is_active,
            $id
        );

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Payment type updated"
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // DELETE
    public function deletePaymentType($id) {
        $stmt = $this->db->prepare("DELETE FROM payment_types WHERE payment_type_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Payment type deleted"
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}

// =======================
// ROUTER
// =======================
$controller = new PaymentTypeController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'createPaymentType':
            $controller->createPaymentType();
            break;
        case 'readAll':
            $controller->readAll();
            break;
        case 'readOne':
            $controller->readOne($_GET['id'] ?? 0);
            break;
        case 'updatePaymentType':
            $controller->updatePaymentType($_GET['id'] ?? 0);
            break;
        case 'deletePaymentType':
            $controller->deletePaymentType($_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
