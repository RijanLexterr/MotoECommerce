<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class ProductController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO products (brand_id, category_id, name, description, price, stock, expiration_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $created_at = date("Y-m-d H:i:s");

        $stmt->bind_param(
            "iissdiss",
            $data['brand_id'],
            $data['category_id'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['expiration_date'],
            $created_at
        );

        if ($stmt->execute()) {
            echo json_encode([
                "message" => "Product created",
                "id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function readAll() {
        $result = $this->db->query("SELECT * FROM products");
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode($products);
    }

    public function readOne($id) {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE product_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();

        if ($product) {
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Product not found"]);
        }
    }

    public function update($id) {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE products
            SET brand_id = ?, category_id = ?, name = ?, description = ?, price = ?, stock = ?, expiration_date = ?
            WHERE product_id = ?
        ");

        $stmt->bind_param(
            "iissdisi",
            $data['brand_id'],
            $data['category_id'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['expiration_date'],
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["message" => "Product updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM products WHERE product_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Product deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}


// =======================
// ROUTER
// =======================
$controller = new ProductController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'create':
            $controller->create();
            break;
        case 'readAll':
            $controller->readAll();
            break;
        case 'readOne':
            $controller->readOne($_GET['id'] ?? 0);
            break;
        case 'update':
            $controller->update($_GET['id'] ?? 0);
            break;
        case 'delete':
            $controller->delete($_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
