<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class ProductController
{
    private $db; // mysqli

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function create()
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO products (brand_id, category_id, name, description, price, stock, expiration_date, created_at, image_location, is_promoted, new_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $created_at = date("Y-m-d H:i:s");

        $stmt->bind_param(
            "iissdisssid",
            $data['brand_id'],
            $data['category_id'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['expiration_date'],
            $created_at,
            $data['image_location'],
            $data['is_promoted'],
            $data['new_price']
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

    public function readAll()
    {
        $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;


        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM products");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT p.product_id AS product_id, p.name AS name, p.description AS description,
				p.category_id AS category_id, p.brand_id AS brand_id, p.price AS price, p.stock as stock, 
				p.expiration_date as expiration_date, b.name AS BrandName, c.name AS CategoryName, 
				(CASE
					WHEN p.image_location IS NULL OR p.image_location = '' THEN 'dont_delete_this_image.png' 
					ELSE p.image_location  
				END) as image_location, p.is_promoted as is_promoted, CASE WHEN p.is_promoted = 1 THEN 'Yes' ELSE '' END as yes_if_promoted, 
				CASE WHEN CONVERT(p.new_price, CHAR) <> '0.00' THEN CONVERT(p.new_price, CHAR) ELSE '' END as new_price 
                FROM (select * from products order by created_at DESC LIMIT $limit OFFSET $offset) AS p 
				left join brands AS b on p.brand_id = b.brand_id
                left join categories AS c on p.category_id = c.category_id 
				order by p.created_at DESC";

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

    public function readAllHomeProducts()
    {

        $result = $this->db->query("SELECT *, CASE WHEN is_promoted = 1 THEN new_price ELSE price END as item_price FROM products ORDER BY created_at DESC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

    public function readAllHomePromotedProducts()
    {

        $result = $this->db->query("SELECT * FROM products WHERE is_promoted = 1 ORDER BY created_at DESC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

    public function readAllCategories()
    {

        $result = $this->db->query("SELECT * FROM categories ORDER BY name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

    public function readAllBrands()
    {

        $result = $this->db->query("SELECT * FROM brands ORDER BY name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

    public function readOne($id)
    {
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
    public function getByProductName($product_name, $id)
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
    public function update($id)
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE products
            SET brand_id = ?, category_id = ?, name = ?, description = ?, price = ?, stock = ?, expiration_date = ?, is_promoted = ?, new_price = ? 
            WHERE product_id = ?
        ");

        $stmt->bind_param(
            "iissdisidi",
            $data['brand_id'],
            $data['category_id'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['expiration_date'],
            $data['is_promoted'],
            $data['new_price'],
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Product updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function delete($id)
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        if ($data['image_location'] == 'dont_delete_this_image.png' || $data['image_location'] == 'dont_delete_this_image.PNG') {
            $stmt = $this->db->prepare("DELETE FROM products WHERE product_id = ?");
            $stmt->bind_param("i", $id);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "The product successfully deleted."]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
            return;
        }

        if ($data['image_location']) {
            $fileToDelete = "C:\\xampp\\htdocs\\eCommerce\\BackOffice\\uploads\\"; // Specify the file name or path
            $fileToDelete = $fileToDelete . $data['image_location'];

            if (file_exists($fileToDelete)) { // Check if the file exists before attempting to delete
                if (unlink($fileToDelete)) {
                    $stmt = $this->db->prepare("DELETE FROM products WHERE product_id = ?");
                    $stmt->bind_param("i", $id);

                    if ($stmt->execute()) {
                        echo json_encode(["status" => "success", "message" => "The file '{$fileToDelete}' successfully deleted."]);
                    } else {
                        echo json_encode(["status" => "error", "message" => $stmt->error]);
                    }
                } else {
                    echo json_encode(["status" => "error", "message" => "Error: The file '{$fileToDelete}' could not be deleted. Check permissions."]);
                }
            } else {
                echo json_encode(["status" => "error", "message" => "Error: The file '{$fileToDelete}' does not exist."]);
            }
        }
    }

    public function readByFilter($categoryIds, $brandIds, $page = 1, $limit = 6, $searchText = "")
    {
        $page = isset($_GET['page']) ? intval($_GET['page']) : $page;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : $limit;
        $offset = ($page - 1) * $limit;

        $categoryIds = array_filter(array_map('intval', explode(',', $categoryIds)));
        $brandIds = array_filter(array_map('intval', explode(',', $brandIds)));
        $searchText = isset($_GET['searchText']) ? trim($_GET['searchText']) : $searchText;

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

        // 🔍 Search filter (match name or description)
        if (!empty($searchText)) {
            $conditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $params[] = "%{$searchText}%";
            $params[] = "%{$searchText}%";
            $types .= "ss";
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

        // Fetch paginated results
        $sql = "
        SELECT p.product_id, p.name, p.description,
               p.category_id, p.brand_id, p.price, CASE WHEN p.is_promoted = 1 THEN p.new_price ELSE p.price END as item_price, p.stock,
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
            'brandIds' => $brandIds,
            'searchText' => $searchText,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => max(1, ceil($total / $limit)),
            'count' => count($data),
            'data' => $data
        ]);
    }

	public function PromotedItemsReadByFilter($categoryIds, $brandIds, $page = 1, $limit = 6, $searchText = "")
    {
        $page = isset($_GET['page']) ? intval($_GET['page']) : $page;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : $limit;
        $offset = ($page - 1) * $limit;

        $categoryIds = array_filter(array_map('intval', explode(',', $categoryIds)));
        $brandIds = array_filter(array_map('intval', explode(',', $brandIds)));
        $searchText = isset($_GET['searchText']) ? trim($_GET['searchText']) : $searchText;

        $promotedconditions = [];
        $params = [];
        $types = "";

        // Category filter
        if (!empty($categoryIds) && !(count($categoryIds) === 1 && $categoryIds[0] === 0)) {
            $placeholders = implode(",", array_fill(0, count($categoryIds), "?"));
            $promotedconditions[] = "p.category_id IN ($placeholders)";
            foreach ($categoryIds as $id) {
                $params[] = $id;
                $types .= "i";
            }
        }

        // Brand filter
        if (!empty($brandIds) && !(count($brandIds) === 1 && $brandIds[0] === 0)) {
            $placeholders = implode(",", array_fill(0, count($brandIds), "?"));
            $promotedconditions[] = "p.brand_id IN ($placeholders)";
            foreach ($brandIds as $id) {
                $params[] = $id;
                $types .= "i";
            }
        }

        // 🔍 Search filter (match name or description)
        if (!empty($searchText)) {
            $promotedconditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $params[] = "%{$searchText}%";
            $params[] = "%{$searchText}%";
            $types .= "ss";
        }
		
		//$promotedwhere = "WHERE p.is_promoted = 1"
        $promotedwhere = !empty($promotedconditions) ? " AND " . implode(" AND ", $promotedconditions) : "";

        // Count total rows
        $countSql = "SELECT COUNT(*) AS total FROM products p WHERE p.is_promoted = 1 $promotedwhere";
        $countStmt = $this->db->prepare($countSql);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $total = (int) $countStmt->get_result()->fetch_assoc()['total'];

        // Fetch paginated results
        $sql = "
        SELECT p.product_id, p.name, p.description,
               p.category_id, p.brand_id, p.price, CASE WHEN p.is_promoted = 1 THEN p.new_price ELSE p.price END as item_price, p.stock,
               p.expiration_date, p.image_location, ROUND(((p.price - p.new_price)/p.price)*100) as percent, 
               b.name AS BrandName, c.name AS CategoryName
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.is_promoted = 1 $promotedwhere 
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
            'brandIds' => $brandIds,
            'searchText' => $searchText,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => max(1, ceil($total / $limit)),
            'count' => count($data),
            'data' => $data
        ]);
    }

    public function uploadImage()
    {
        if ($_POST['image_location'] == 'dont_delete_this_image.png' || $_POST['image_location'] == 'dont_delete_this_image.PNG') {
            return;
        }

        if (isset($_POST['image_location'])) {
            $fileToDelete = "C:\\xampp\\htdocs\\eCommerce\\BackOffice\\uploads\\"; // Specify the file name or path
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

        if (!isset($_POST['product_id']) || !isset($_FILES['image'])) {
            echo json_encode(["status" => "error", "message" => "Missing product_id or image"]);
            return;
        }

        $product_id = (int) $_POST['product_id'];
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

    public function globalSearch($query)
    {
        $query = trim($query);
        if ($query === "") {
            echo json_encode(["status" => "error", "message" => "Empty search query"]);
            return;
        }

        // 🔍 Search Products (by name or description)
        $stmt = $this->db->prepare("
        SELECT 
            p.product_id, 
            p.name, 
            p.description, 
            p.price, 
            p.image_location,
            b.name AS brand_name, 
            c.name AS category_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.name LIKE ? OR p.description LIKE ?
        ORDER BY p.created_at DESC
        LIMIT 10
    ");
        $like = "%{$query}%";
        $stmt->bind_param("ss", $like, $like);
        $stmt->execute();
        $products = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // 🔍 Search Brands
        $stmt = $this->db->prepare("SELECT brand_id, name FROM brands WHERE name LIKE ? LIMIT 10");
        $stmt->bind_param("s", $like);
        $stmt->execute();
        $brands = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // 🔍 Search Categories
        $stmt = $this->db->prepare("SELECT category_id, name FROM categories WHERE name LIKE ? LIMIT 10");
        $stmt->bind_param("s", $like);
        $stmt->execute();
        $categories = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "query" => $query,
            "products" => $products,
            "brands" => $brands,
            "categories" => $categories
        ]);
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
        case 'readAllHomePromotedProducts':
            $controller->readAllHomePromotedProducts();
            break;
        case 'readAllHomeProducts':
            $controller->readAllHomeProducts();
            break;
        case 'uploadImage':
            $controller->uploadImage();
            break;
        case 'globalSearch':
            $controller->globalSearch($_GET['query'] ?? "");
            break;
		case 'PromotedItemsReadByFilter':
            $controller->PromotedItemsReadByFilter($_GET['categoryIds'] ?? "0", $_GET['brandIds'] ?? "0");
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
