<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class CategoryController {
    private $db; // mysqli

    public function __construct($db) 
	{
        $this->db = $db;
    }

    // CREATE
    public function createcategory() 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO categories (name, created_at)
            VALUES (?, ?)");
        $created_at = date("Y-m-d H:i:s");

        $stmt->bind_param(
            "ss",
            $data['name'],
            $created_at
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
				"status" => "success",
                "message" => "Category is created",
                "id" => $this->db->insert_id
            ]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
	// READ ALL CATEGORIES
    public function readAll() 
	{
		
		$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM categories");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT *   
                FROM categories 
                ORDER BY created_at DESC 
                LIMIT $limit OFFSET $offset";

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
   
    // READ ONE CATEGORY
    public function readOne($id) 
	{
        $stmt = $this->db->prepare("
            SELECT *  
            FROM categories 
            WHERE category_id = ?
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $transaction = $result->fetch_assoc();

        if ($transaction) 
		{
            echo json_encode($transaction);
        } 
		else 
		{
            http_response_code(404);
            echo json_encode(["message" => "Category not found"]);
        }
    }

    // 🔍 SEARCH BY CATEGORY ID
    public function searchByCategoryId($category_id) 
	{
        $stmt = $this->db->prepare("
            SELECT *  
            FROM categories 
            WHERE category_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->bind_param("i", $category_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $transactions = [];
        while ($row = $result->fetch_assoc()) 
		{
            $transactions[] = $row;
        }

        if ($transactions) 
		{
            echo json_encode($transactions);
        } 
		else 
		{
            http_response_code(404);
            echo json_encode(["message" => "No category found."]);
        }
    }


    // UPDATE CATEGORY
    public function updatecategory($id) 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE categories 
            SET name = ? 
            WHERE category_id = ?
        ");

        $stmt->bind_param(
            "si",
            $data['name'],
            $id
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Category is updated"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
    public function deletecategory($id) 
	{
        $stmt = $this->db->prepare("DELETE FROM categories WHERE category_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Category is deleted"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

}
// =======================
// ROUTER
// =======================
$controller = new CategoryController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'createcategory':
            $controller->createcategory();
            break;
        case 'readAll':
            $controller->readAll();
            break;
        case 'readOne':
            $controller->readOne($_GET['id'] ?? 0);
            break;
        // case 'searchByProductId':
        //     $controller->searchByCategoryIdId($_GET['category_id'] ?? 0);
        //     break;
        case 'updatecategory':
            $controller->updatecategory($_GET['id'] ?? 0);
            break;
        case 'deletecategory':
            $controller->deletecategory($_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
