<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class InventoryTransactionController
{
    private $db; // mysqli

    public function __construct($db)
    {
        $this->db = $db;
    }

    // ======================
    // CREATE TRANSACTION
    // ======================


    // ======================
    // READ ALL TRANSACTIONS
    // ======================
    public function readAll()
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $pageSize = isset($_GET['pageSize']) ? (int) $_GET['pageSize'] : 10;
        $productId = isset($_GET['product_id']) ? (int) $_GET['product_id'] : null;
        $offset = ($page - 1) * $pageSize;

        $query = "
            SELECT it.*, p.name AS product_name, p.description, p.price
            FROM inventory_transactions it
            JOIN products p ON it.product_id = p.product_id
        ";

        if ($productId) {
            $query .= " WHERE it.product_id = $productId";
        }

        // Count total records
        $countQuery = str_replace(
            "SELECT it.*, p.name AS product_name, p.description, p.price",
            "SELECT COUNT(*) as total",
            $query
        );
        $countResult = $this->db->query($countQuery);
        $total = $countResult->fetch_assoc()['total'] ?? 0;

        $query .= " ORDER BY it.created_at DESC LIMIT $offset, $pageSize";
        $result = $this->db->query($query);

        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }

        echo json_encode([
            "data" => $transactions,
            "pagination" => [
                "page" => $page,
                "pageSize" => $pageSize,
                "total" => $total,
                "totalPages" => ceil($total / $pageSize)
            ]
        ]);
    }

    // ======================
    // READ ONE TRANSACTION
    // ======================
    public function readOne($id)
    {
        $stmt = $this->db->prepare("
            SELECT it.*, p.name AS product_name, p.description, p.price, p.stock 
            FROM inventory_transactions it
            JOIN products p ON it.product_id = p.product_id
            WHERE it.transaction_id = ?
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $transaction = $stmt->get_result()->fetch_assoc();

        if ($transaction) {
            echo json_encode($transaction);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Transaction not found"]);
        }
    }

    // ======================
    // SEARCH TRANSACTIONS BY PRODUCT
    // ======================
    public function searchByProductId($product_id)
    {
        $stmt = $this->db->prepare("
            SELECT it.*, p.name AS product_name, p.description, p.price, p.stock 
            FROM inventory_transactions it
            JOIN products p ON it.product_id = p.product_id
            WHERE it.product_id = ?
            ORDER BY it.created_at DESC
        ");
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }

        echo json_encode($transactions ?: ["message" => "No transactions found"]);
    }

    // ======================
    // RECALCULATE STOCK
    // ======================
    public function recalculateStock($product_id, $echoJson = true)
    {
        $stmt = $this->db->prepare("
        SELECT 
            SUM(CASE WHEN type_id = ? THEN qty ELSE 0 END) AS total_in,
            SUM(CASE WHEN type_id = ? THEN qty ELSE 0 END) AS total_out,
            SUM(CASE WHEN type_id = ? THEN qty ELSE 0 END) AS total_adjustment
        FROM inventory_transactions
        WHERE product_id = ?
    ");

        $inType = TransactionType::IN;
        $outType = TransactionType::OUT;
        $adjType = TransactionType::ADJUSTMENT;
        $stmt->bind_param("iiii", $inType, $outType, $adjType, $product_id);
        $stmt->execute();
        $totals = $stmt->get_result()->fetch_assoc();

        $newStock = ($totals['total_in'] ?? 0) - ($totals['total_out'] ?? 0) + ($totals['total_adjustment'] ?? 0);

        $update = $this->db->prepare("UPDATE products SET stock = ? WHERE product_id = ?");
        $update->bind_param("ii", $newStock, $product_id);
        $update->execute();

        if ($echoJson) {
            echo json_encode([
                "message" => "Stock recalculated",
                "product_id" => $product_id,
                "stock" => $newStock
            ]);
        }

        return $newStock;
    }

    public function recalculateAllStock($echoJson = true)
    {
        // 1️⃣ Get all product IDs
        $result = $this->db->query("SELECT product_id FROM products");
        if (!$result || $result->num_rows === 0) {
            if ($echoJson) {
                echo json_encode(["message" => "No products found"]);
            }
            return;
        }

        $updated = [];
        while ($row = $result->fetch_assoc()) {
            $product_id = (int) $row['product_id'];

            // 2️⃣ Recalculate for each product (without echoing JSON individually)
            $stock = $this->recalculateStock($product_id, false);

            $updated[] = [
                "product_id" => $product_id,
                "new_stock" => $stock
            ];
        }

        // 3️⃣ Optionally return summary as JSON
        if ($echoJson) {
            echo json_encode([
                "message" => "All product stocks recalculated successfully",
                "total_products" => count($updated),
                "results" => $updated
            ]);
        }

        return $updated;
    }

    public function create()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        $created_at = date("Y-m-d H:i:s");

        $stmt = $this->db->prepare("
        INSERT INTO inventory_transactions (product_id, user_id, type_id, qty, remarks, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
        $stmt->bind_param(
            "iiiiss",
            $data['product_id'],
            $data['user_id'],
            $data['type_id'],
            $data['qty'],
            $data['remarks'],
            $created_at
        );

        if ($stmt->execute()) {
            $productId = $data['product_id'];

            // ✅ Recalculate stock immediately after create
            $this->recalculateStock($productId, false); // do not echo JSON

            echo json_encode([
                "message" => "Inventory transaction created and stock updated",
                "id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // ======================
// UPDATE TRANSACTION
// ======================
    public function update($id)
    {
        $data = json_decode(file_get_contents("php://input"), true);

        $stmt = $this->db->prepare("
        UPDATE inventory_transactions
        SET product_id = ?, user_id = ?, type_id = ?, qty = ?, remarks = ?
        WHERE transaction_id = ?
    ");
        $stmt->bind_param(
            "iiiisi",
            $data['product_id'],
            $data['user_id'],
            $data['type_id'],
            $data['qty'],
            $data['remarks'],
            $id
        );

        if ($stmt->execute()) {
            $productId = $data['product_id'];
            $this->recalculateStock($productId, false); // do not echo JSON
            echo json_encode(["message" => "Inventory transaction updated and stock updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // ======================
    // DELETE TRANSACTION
    // ======================
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM inventory_transactions WHERE transaction_id = ?");
        $stmt->bind_param("i", $id);

        echo json_encode(
            $stmt->execute()
            ? ["message" => "Inventory transaction deleted"]
            : ["status" => "error", "message" => $stmt->error]
        );
    }

    // ======================
    // GET ALL PRODUCTS WITH PAGINATION
    // ======================
    public function GetAllProducts()
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $pageSize = isset($_GET['pageSize']) ? (int) $_GET['pageSize'] : 10;
        $offset = ($page - 1) * $pageSize;

        $countResult = $this->db->query("SELECT COUNT(*) as total FROM products");
        $total = $countResult->fetch_assoc()['total'] ?? 0;

        $result = $this->db->query("SELECT * FROM products LIMIT $offset, $pageSize");

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        echo json_encode([
            "data" => $products,
            "pagination" => [
                "page" => $page,
                "pageSize" => $pageSize,
                "total" => $total,
                "totalPages" => ceil($total / $pageSize)
            ]
        ]);
    }
}

// =======================
// ROUTER
// =======================
$controller = new InventoryTransactionController($conn);

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create':
        $controller->create();
        break;
    case 'readAll':
        $controller->readAll();
        break;
    case 'readOne':
        $controller->readOne($_GET['id'] ?? 0);
        break;
    case 'searchByProductId':
        $controller->searchByProductId($_GET['product_id'] ?? 0);
        break;
    case 'recalculateStock':
        $controller->recalculateStock($_GET['product_id'] ?? 0);
        break;
    case 'update':
        $controller->update($_GET['id'] ?? 0);
        break;
    case 'delete':
        $controller->delete($_GET['id'] ?? 0);
        break;
    case 'GetAllProducts':
        $controller->GetAllProducts();
        break;
    case 'recalculateAllStock':
        $controller->recalculateAllStock();
        break;


    default:
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
