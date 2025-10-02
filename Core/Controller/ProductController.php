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
		
		// $targetDir = "uploads/";  // Make sure this folder exists and is writable
		// $targetFile = $targetDir . basename($_FILES["image"]["name"]);

		// if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {
		// 	echo "success";
		// } else {
		// 	echo "error";
		// }

        $stmt = $this->db->prepare("
            INSERT INTO products (brand_id, category_id, name, description, price, stock, expiration_date, created_at, image_location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $created_at = date("Y-m-d H:i:s");

        $stmt->bind_param(
            "iissdisss",
            $data['brand_id'],
            $data['category_id'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['expiration_date'],
			$data['image_location'],
            $created_at
        );

        if ($stmt->execute()) {
            echo json_encode([
				"status" => "success",
                "message" => "Product created",
                "id" => $this->db->insert_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function readAll() {
		$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;


		// Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM products");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT p.product_id AS product_id, p.name AS name, p.description AS description,
				p.category_id AS category_id, p.brand_id AS brand_id, p.price AS price, p.stock as stock, 
				p.expiration_date as expiration_date, b.name AS BrandName, c.name AS CategoryName, p.image_location as img_loc
                FROM (select * from products order by created_at DESC LIMIT $limit OFFSET $offset) AS p 
				left join brands AS b on p.brand_id = b.brand_id
                left join categories AS c on p.category_id = c.category_id 
				order by p.created_at DESC";

        $result = $this->db->query($query);
        $data = [];

        while ($row = $result->fetch_assoc()) 
		{
            $data[] = $row;
        }

        echo json_encode([
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'data' => $data
        ]);
		
    }

	public function readAllCategories() {

        $result = $this->db->query("SELECT * FROM categories ORDER BY name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }
	
	public function readAllBrands() {

        $result = $this->db->query("SELECT * FROM brands ORDER BY name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
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

	// 🔍 SEARCH BY PRODUCT NAME
    public function getByProductName($product_name,$id) 
	{		
		$stmt = $this->db->prepare("SELECT * FROM products WHERE name = ? and product_id <> ?");
        $stmt->bind_param("si", $product_name, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $productname = $result->fetch_assoc();

        if ($productname) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
    }
    public function update($id) {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

		$filename = $_FILES['image']['name'];
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
            echo json_encode(["status" => "success","message" => "Product updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM products WHERE product_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success","message" => "Product deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }


   public function readByFilter($categoryIds, $brandIds, $page=1, $limit =6) {
    $page = isset($_GET['page']) ? intval($_GET['page']) : $page;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : $limit;
    $offset = ($page - 1) * $limit;

    $categoryIds = array_filter(array_map('intval', explode(',', $categoryIds)));
    $brandIds    = array_filter(array_map('intval', explode(',', $brandIds)));

    $conditions = [];
    $params = [];
    $types = "";

    // Category filter
    if (!empty($categoryIds) && !(count($categoryIds) === 1 && $categoryIds[0] === 0)) {
        $placeholders = implode(",", array_fill(0, count($categoryIds), "?"));
        $conditions[] = "p.category_id IN ($placeholders)";
        foreach ($categoryIds as $id) {
            $params[] = $id;
            $types .= "i";
        }
    }

    // Brand filter
    if (!empty($brandIds) && !(count($brandIds) === 1 && $brandIds[0] === 0)) {
        $placeholders = implode(",", array_fill(0, count($brandIds), "?"));
        $conditions[] = "p.brand_id IN ($placeholders)";
        foreach ($brandIds as $id) {
            $params[] = $id;
            $types .= "i";
        }
    }

    $where = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

    // Count total rows
    $countSql = "SELECT COUNT(*) AS total FROM products p $where";
    $countStmt = $this->db->prepare($countSql);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $total = (int) $countStmt->get_result()->fetch_assoc()['total'];

    // Fetch paginated results (inject LIMIT/OFFSET directly)
    $sql = "
        SELECT p.product_id, p.name, p.description,
               p.category_id, p.brand_id, p.price, p.stock,
               p.expiration_date, p.image_location,
               b.name AS BrandName, c.name AS CategoryName
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        $where
        ORDER BY p.created_at DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $this->db->prepare($sql);

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode([
        'categoryIds' => $categoryIds,
        'brandIds'    => $brandIds,
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'pages'       => max(1, ceil($total / $limit)), // ✅ correct total pages
        'count'       => count($data),
        'data'        => $data
    ]);
}





public function uploadImage() {
    if (!isset($_POST['product_id']) || !isset($_FILES['image'])) {
        echo json_encode(["status" => "error", "message" => "Missing product_id or image"]);
        return;
    }

    $product_id = (int)$_POST['product_id'];
    $alt_text = $_POST['alt_text'] ?? '';
    $caption = $_POST['caption'] ?? '';
    $sort_order = (int)($_POST['sort_order'] ?? 0);
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
            UPDATE products SET image_location = ? WHERE product_id = ?
        ");
        $updateStmt->bind_param("si", $imageName, $product_id);
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
		case 'readAllCategories':
            $controller->readAllCategories();
            break;
		case 'readAllBrands':
            $controller->readAllBrands();
            break;
		case 'getByProductName':
			$controller->getByProductName($_GET['product_name'] ?? "", $_GET['id'] ?? 0);
            break;
        case 'readByFilter':
            $controller->readByFilter($_GET['categoryIds'] ?? "0", $_GET['brandIds'] ?? "0");
        break;
        case 'uploadImage':
    $controller->uploadImage();
    break;



        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
