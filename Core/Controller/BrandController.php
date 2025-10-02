<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class BrandController {
    private $db; // mysqli

    public function __construct($db) 
	{
        $this->db = $db;
    }

    // CREATE
    public function createbrand() 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO brands (name, created_at)
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
                "message" => "Brand is created",
                "id" => $this->db->insert_id
            ]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
	// READ ALL Brands
    public function readAll() 
	{
		
		$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM brands");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT *   
                FROM brands 
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
   
    // READ ONE brand
    public function readOne($id) 
	{
        $stmt = $this->db->prepare("
            SELECT *  
            FROM brands 
            WHERE brand_id = ?
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
            echo json_encode(["message" => "Brand not found"]);
        }
    }

    // 🔍 SEARCH BY BRAND NAME
    public function getByBrandName($brand_name,$id) 
	{		
		$stmt = $this->db->prepare("SELECT * FROM brands WHERE name = ? and brand_id <> ?");
        $stmt->bind_param("si", $brand_name, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $brandname = $result->fetch_assoc();

        if ($brandname) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
    }

    // UPDATE Brand
    public function updatebrand($id) 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE brands 
            SET name = ? 
            WHERE brand_id = ?
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
			"message" => "Brand is updated"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
    public function deletebrand($id) 
	{
        $stmt = $this->db->prepare("DELETE FROM brands WHERE brand_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Brand is deleted"]);
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
$controller = new BrandController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'createbrand':
            $controller->createbrand();
            break;
        case 'readAll':
            $controller->readAll();
            break;
        case 'readOne':
            $controller->readOne($_GET['id'] ?? 0);
            break;
        case 'updatebrand':
            $controller->updatebrand($_GET['id'] ?? 0);
            break;
        case 'deletebrand':
            $controller->deletebrand($_GET['id'] ?? 0);
            break;
		case 'getByBrandName':
			$controller->getByBrandName($_GET['brand_name'] ?? "", $_GET['id'] ?? 0);
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
