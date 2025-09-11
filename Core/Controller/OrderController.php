<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class OrderController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }

    public function readAll() {

        // Fetch all orders with their items
        $sql = "
            SELECT o.order_id AS order_id,
                    o.user_id as order_by_id,
                    u.name as order_by_name,
                    os.name as order_status_name,
                    o.created_at as order_created_at,
                    oi.order_item_id AS item_id,
                    p.product_id as item_product_id,
                    b.brand_id as item_brand_id,
                    b.name as item_brand_name,
                    p.category_id as item_category_id,
                    c.name as item_category_name,
                    oi.qty as item_qty,
                    oi.price as item_price,
                    ifnull((oi.qty * oi.price), 0) as item_total_amt
            FROM orders o
                left join order_items oi ON o.order_id = oi.order_id
                left join products p on p.product_id = oi.product_id
                left join brands b on b.brand_id = p.brand_id
                left join categories c on c.category_id = p.category_id
                left join order_status os on os.status_id = o.status_id
                left join users u on u.user_id = o.user_id          
        "; 

        $stmt = $this->db->query($sql);

        // Fetch results
        $orders = [];
        while ($row = $stmt->fetch_assoc()) {
            $order_id = $row['order_id'];
            
            // Check if order already exists in the orders array
            if (!isset($orders[$order_id])) {
                $orders[$order_id] = [
                    'order_id' => $order_id,
                    'order_by_id' => $row['order_by_id'],
                    'order_by_name' => $row['order_by_name'],
                    'order_status_name' => $row['order_status_name'], 
                    'order_created_at' => $row['order_created_at'],
                    'showChildren' => false,
                    'items' => [] // Initialize items array
                ];
            }

            // Add item to the current order
            $orders[$order_id]['items'][] = [
                'item_id' => $row['item_id'],
                'item_product_id' => $row['item_product_id'],
                'item_brand_id' => $row['item_brand_id'],
                'item_brand_name' => $row['item_brand_name'],
                'item_category_id' => $row['item_category_id'],
                'item_category_name' => $row['item_category_name'],
                'item_qty' => $row['item_qty'],
                'item_price' => $row['item_price'],
                'item_total_amt' => $row['item_total_amt']
            ];
        }

        // Return the orders and their items as a JSON response
        echo json_encode(array_values($orders));    
    }

    // UPDATE Order Status
    public function updateOrderStatus($id) {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);
        $statusId = 3;

        $stmt = $this->db->prepare("
            UPDATE orders
            SET status_id = ? 
            WHERE order_id = ?
        ");

        $stmt->bind_param(
            "ii",
            $statusId,
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["message" => "Order Status is updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
  
}

// =======================
// ROUTER
// =======================
$controller = new OrderController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {        
        case 'readAll':
            $controller->readAll();
            break;
        case 'shipOrder':
            $controller->updateOrderStatus($_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}