<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class OrderController
{
    private $db; // mysqli

    public function __construct($db)
    {
        $this->db = $db;
    }

    //Get All Orders
    public function readAll()
    {

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM orders");
        $total = $countResult->fetch_assoc()['total'];

        if ($total >= 5) {
            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 5;
            $offset = ($page - 1) * $limit;
        } else {
            $page = 1;
            $limit = 5;
            $offset = ($page - 1) * $limit;
        }

        // Fetch all orders with their items
        $sql = "
            SELECT o.order_id AS order_id,
                    o.user_id as order_by_id,
                    u.name as order_by_name,
                    p.name as product_name,
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
                    pt.name as paymentType,
                    o.payment_img,
                     u.email as email,
                    ifnull((oi.qty * oi.price), 0) as item_total_amt
             FROM (
                	select * from orders order by order_id, created_at LIMIT $limit OFFSET $offset
                  ) as o
                left join order_items oi ON o.order_id = oi.order_id
                left join products p on p.product_id = oi.product_id
                left join brands b on b.brand_id = p.brand_id
                left join categories c on c.category_id = p.category_id
                left join order_status os on os.status_id = o.status_id
                left join users u on u.user_id = o.user_id
                left join payment_types pt on pt.payment_type_id = o.payment_type_id
            ORDER BY 1, 5";

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
                    'paymentType' => $row['paymentType'],
                    'paymentImg' => $row['payment_img'],
                    'email' => $row['email'],

                    'product_name' => $row['product_name'],
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
                'item_total_amt' => $row['item_total_amt'],
                'product_name' => $row['product_name']
            ];
        }

        // Return the orders and their items as a JSON response
        echo json_encode([
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'data' => array_values($orders)
        ]);
    }

    public function readAllItemsByUser($id)
    {

        // Fetch all orders with their items
        $stmt = $this->db->prepare("SELECT o.order_id AS order_id,o.user_id as order_by_id, u.name as order_by_name, u.email as email,
                    os.name as order_status_name,
                    o.created_at as order_created_at,
                    o.payment_img as payment_img,
                    oi.order_item_id AS item_id,
                    p.product_id as item_product_id,
                    b.brand_id as item_brand_id,
                    b.name as item_brand_name,
                    p.category_id as item_category_id,
                    c.name as item_category_name,
                    oi.qty as item_qty,
                    oi.price as item_price,
                    ifnull((oi.qty * oi.price), 0) as item_total_amt,
                    p.image_location as imageLoc,
                    IFNULL(bb.Rates, 0.00) as Rates
             FROM orders o
                left join order_items oi ON o.order_id = oi.order_id
                left join products p on p.product_id = oi.product_id
                left join brands b on b.brand_id = p.brand_id
                left join categories c on c.category_id = p.category_id
                left join order_status os on os.status_id = o.status_id
                left join users u on u.user_id = o.user_id
                left join user_shipping_details us on us.user_shipping_id = o.user_shipping_id
                left join barangay bb on bb.Brgy_ID = us.Brgy_ID
            WHERE o.user_id = ? ORDER BY 1, 5");

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        // Fetch results
        $orders = [];
        while ($row = $result->fetch_assoc()) {
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
                    'shipRates' => $row['Rates'],
                    'email' => $row['email'],
                    'img' => $row['payment_img'],

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
                'item_total_amt' => $row['item_total_amt'],
                'item_img_loc' => $row['imageLoc']
            ];
        }

        // Return the orders and their items as a JSON response
        echo json_encode([
            'status' => 'success',
            'data' => array_values($orders)
        ]);
    }

    //Get Order Items
    public function readAllItemsPerOder($id)
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            SELECT *  
            FROM order_items 
            WHERE order_id = ?
        ");

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }

        if ($transactions) {
            echo json_encode($transactions);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No items found."]);
        }
    }

    // UPDATE Order Status
    public function updateOrderStatus($id)
    {
        // Read JSON payload
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        // Get status ID from JSON or fallback to default (3)
        $statusId = isset($data['status_id']) ? intval($data['status_id']) : 3;
        $created_at = date("Y-m-d H:i:s");

        // Optional: remarks or other tracking
        $remarks = $data['remarks'] ?? "Order status updated";

        // Prepare SQL update
        $stmt = $this->db->prepare("
        UPDATE orders
        SET status_id = ?,
            shipped_at = ? 
        WHERE order_id = ?
    ");

        $stmt->bind_param("isi", $statusId, $created_at, $id);

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Order status updated successfully",
                "data" => [
                    "order_id" => $id,
                    "status_id" => $statusId,
                    "remarks" => $remarks
                ]
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => $stmt->error
            ]);
        }
    }


    // UPDATE Order Status
    public function tagReceived($id)
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);
        $statusId = 2;
        $created_at = date("Y-m-d H:i:s");
        $transactionOutId = 2;
        $remarks = "Received by user";

        $stmt = $this->db->prepare("
            UPDATE orders
            SET status_id = ?,
                shipped_at = ? 
            WHERE order_id = ?
        ");

        $stmt->bind_param(
            "isi",
            $statusId,
            $created_at,
            $id
        );

        if ($stmt->execute()) {


            echo json_encode(["status" => "success", "message" => "Order Status is updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }


    public function create()
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $created_at = date("Y-m-d H:i:s");
        $statusId = 1;
        $transactionOutId = 2;
        $remarks = "Placed Item already";

        $stmt = $this->db->prepare("
            INSERT INTO orders (user_id, status_id, total, created_at, user_shipping_id,payment_type_id)
            VALUES (?, ?, ?, ?, ?,?)
        ");

        $stmt->bind_param(
            "iidsii",
            $data['user_id'],
            $statusId,
            $data['total'],
            $created_at,
            $data['user_shipping_id'],
            $data['payment_type_id']
        );

        if ($stmt->execute()) {
            $insert_order_id = $this->db->insert_id;

            foreach ($data['items'] as $item) {

                //Insert Order Items
                $stmt2 = $this->db->prepare("
                    INSERT INTO order_items (order_id, product_id, qty, price)
                    VALUES (?, ?, ?, ?)
                ");

                $stmt2->bind_param(
                    "iiid",
                    $insert_order_id,
                    $item['id'],
                    $item['quantity'],
                    $item['price'],
                );

                if ($stmt2->execute()) {

                    //Then Insert Inventory Transaction (with Type = OUT)
                    $stmt3 = $this->db->prepare("
                            INSERT INTO inventory_transactions (product_id, user_id, type_id, qty, remarks, created_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                            ");

                    $stmt3->bind_param(
                        "iiiiss",
                        $item['id'],
                        $data['user_id'],
                        $transactionOutId,
                        $item['quantity'],
                        $remarks,
                        $created_at
                    );

                    if ($stmt3->execute()) {

                    } else {
                        echo json_encode(["status" => "error", "message" => $stmt3->error]);
                    }
                } else {
                    echo json_encode(["status" => "error", "message" => $stmt2->error]);
                }
            }

            echo json_encode([
                "status" => "success",
                "message" => "Order created",
                "created_order_id" => $insert_order_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function uploadImage()
    {
        if ($_POST['image_location'] == 'dont_delete_this_image.png' || $_POST['image_location'] == 'dont_delete_this_image.PNG') {
            return;
        }

        if (isset($_POST['image_location'])) {
            $fileToDelete = "D:\\xampp\\htdocs\\MotoECommerce\\BackOffice\\uploads\\"; // Specify the file name or path
            $fileToDelete = $fileToDelete . $_POST['image_location'];

            if (file_exists($fileToDelete)) { // Check if the file exists before attempting to delete
                if (unlink($fileToDelete)) {
                    echo json_encode(["status" => "error", "message" => "The file '{$fileToDelete}' successfully deleted."]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Error: The file '{$fileToDelete}' could not be deleted. Check permissions."]);
                }
            } else {
                echo json_encode(["status" => "error", "message" => "Error: The file '{$fileToDelete}' does not exist."]);
            }
        }

        if (!isset($_POST['order_id']) || !isset($_FILES['image'])) {
            echo json_encode(["status" => "error", "message" => "Missing order_id or image"]);
            return;
        }

        $order_id = (int) $_POST['order_id'];
        $alt_text = $_POST['alt_text'] ?? '';
        $caption = $_POST['caption'] ?? '';
        $sort_order = (int) ($_POST['sort_order'] ?? 0);
        $created_at = date("Y-m-d H:i:s");

        $uploadDir = '../../Backoffice/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $imageName = time() . '_' . basename($_FILES['image']['name']);
        $targetFile = $uploadDir . $imageName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            // Save to product_images table

            // Save image path to products table
            $updateStmt = $this->db->prepare("
				UPDATE orders SET payment_img = ? WHERE order_id = ?
			");
            $updateStmt->bind_param("si", $imageName, $order_id);
            $updateStmt->execute();

            echo json_encode([
                "status" => "success",
                "message" => "Image uploaded and saved to product",
                "image_id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to move uploaded file"]);
        }

    }

    public function returnOrder($id)
    {
        // Read JSON payload from Angular
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        // Default values
        $statusId = isset($data['status_id']) ? intval($data['status_id']) : 5; // 5 = Returned
        $remarks = $data['remarks'] ?? "Order returned";
        $created_at = date("Y-m-d H:i:s");

        // Prepare SQL update
        $stmt = $this->db->prepare("
        UPDATE orders
        SET status_id = ?, 
            returnRemarks = ?, 
            shipped_at = ? 
        WHERE order_id = ?
    ");

        $stmt->bind_param("issi", $statusId, $remarks, $created_at, $id);

        // Execute query
        if ($stmt->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Order has been marked as returned.",
                "data" => [
                    "order_id" => $id,
                    "status_id" => $statusId,
                    "remarks" => $remarks
                ]
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => $stmt->error
            ]);
        }
    }


}

$controller = new OrderController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'readAll':
            $controller->readAll();
            break;
        case 'readAllItems':
            $controller->readAllItemsPerOder($_GET['id'] ?? 0);
            break;
        case 'shipOrder':
            $controller->updateOrderStatus($_GET['id'] ?? 0);
            break;
        case 'tagReceived':
            $controller->tagReceived($_GET['id'] ?? 0);
            break;
        case 'create':
            $controller->create();
            break;
        case 'readAllItemsByUser':
            $controller->readAllItemsByUser($_GET['id'] ?? 0);
            break;
        case 'uploadImage':
            $controller->uploadImage();
            break;
        case 'returnOrder':
            $controller->returnOrder($_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
