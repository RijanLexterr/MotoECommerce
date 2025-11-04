<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class UserShippingDetailsController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }

    public function create() {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

		if ($data['is_default_address'] == 1) 
		{
			$stmt = $this->db->prepare("
				UPDATE user_shipping_details 
				SET is_default_address = NULL  
				WHERE user_id = ? 
			");
			
			$stmt->bind_param
			(
				"i",
				$data['user_id']
			);
			
			$stmt->execute();
		}

        $stmt = $this->db->prepare("
            INSERT INTO user_shipping_details (user_id, fullname, phonenumber, address, postalcode, is_default_address, created_at, muni_id, brgy_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $created_at = date("Y-m-d H:i:s");

        $stmt->bind_param(
            "issssisii",
            $data['user_id'],
            $data['fullname'],
            $data['phonenumber'],
            $data['address'],
            $data['postalcode'],
			$data['is_default_address'],
            $created_at,
            $data['Muni_ID'],
            $data['Brgy_ID']
        );

        if ($stmt->execute()) {
            echo json_encode([
				"status" => "success",
                "message" => "User shipping details created",
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
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM user_shipping_details");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT *,  CASE WHEN is_default_address = 1 THEN 'Yes' ELSE '' END AS Def_Address,
        m.Muni_Name, b.Brgy_Name 
		FROM user_shipping_details 
        LEFT JOIN muni m on m.Muni_ID = user_shipping_details.Muni_ID
        LEFT JOIN barangay b on b.Brgy_ID = user_shipping_details.Brgy_ID";

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
	
    public function readOne($id) {
        $stmt = $this->db->prepare("SELECT * FROM user_shipping_details WHERE user_shipping_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();

        if ($product) {
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "user shipping details not found"]);
        }
    }

	// 🔍 SEARCH BY FULL NAME
    public function getByFullName($full_name, $user_id, $user_shipping_id) 
	{		
		$stmt = $this->db->prepare("SELECT * FROM user_shipping_details WHERE fullname = ? and user_id = ? and user_shipping_id <> ?");
        $stmt->bind_param("sii", $full_name, $user_id, $user_shipping_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $fullname = $result->fetch_assoc();

        if ($fullname) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
    }

    // 🔍 SEARCH BY User Id
    public function getByUserId($user_id) 
	{		
		$stmt = $this->db->prepare("
            SELECT u.User_id, u.Name, u.Email, us.User_Shipping_id, us.FullName, us.PhoneNumber, us.Address, us.PostalCode, 
                    CASE WHEN us.Is_Default_Address = 1 THEN 1 ELSE 0 END as IsDefault
            FROM users u
                LEFT JOIN user_shipping_details us on u.user_id = us.user_id
            WHERE u.user_id = ?
        ");

        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $userShipList = [];
        while ($row = $result->fetch_assoc()) 
		{
            $user_id = $row['User_id'];

            // Check if user already exists in the user array
            if (!isset($userShipList[$user_id])) {
                $userShipList[$user_id] = [
                    'User_id' => $row['User_id'],
                    'Name' => $row['Name'],
                    'Email' => $row['Email'],
                    'Addresses' => []
                ];
            }
            
            if ($row['User_Shipping_id'] != null){
                //Add address to current user
                $userShipList[$user_id]['Addresses'][] = [
                    'ShippingId' => $row['User_Shipping_id'],
                    'FullName' => $row['FullName'],
                    'PhoneNumber' => $row['PhoneNumber'],
                    'Address' => $row['Address'],
                    'PostalCode' => $row['PostalCode'],
                    'IsDefault' => $row['IsDefault']
                ];
            }
        }

        if ($userShipList) 
		{
            echo json_encode(["status" => "success", "userAddress" => $userShipList]);
        } 
		else 
		{
            
            echo json_encode(["status" => "error", "message" => "No Shipping Address found!"]);
        }

    }

    public function update($id) {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);
		
		if ($data['is_default_address'] == 1) 
		{
			$stmt = $this->db->prepare("
				UPDATE user_shipping_details 
				SET is_default_address = NULL  
				WHERE user_id = ?  
			");
			
			$stmt->bind_param
			(
				"i",
				$data['user_id']
			);
			
			$stmt->execute();
		}


        $stmt = $this->db->prepare("
            UPDATE user_shipping_details 
            SET fullname = ?, phonenumber = ?, address = ?, postalcode = ?, is_default_address = ?, muni_id = ?, brgy_id = ?  
            WHERE user_shipping_id = ?
        ");
		
        $stmt->bind_param(
            "ssssiiii",
            $data['fullname'],
            $data['phonenumber'],
            $data['address'],
            $data['postalcode'],
			$data['is_default_address'],
			$data['Muni_ID'],
			$data['Brgy_ID'],
            $id
        );

        if ($stmt->execute()) {
            echo json_encode(["status" => "success","message" => "User shipping details updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
	
	
    public function delete($id) 
	{
        $stmt = $this->db->prepare("DELETE FROM user_shipping_details WHERE user_shipping_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) 
		{
            echo json_encode(["status" => "success","message" => "User shipping details deleted"]);
        } else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // READ ALL Municipalities
    public function getAllMunicipalities() 
	{		
		$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM muni");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT *   
                FROM muni 
                ORDER BY 1 
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

    public function readAllMunicipalities()
    {
        $result = $this->db->query("SELECT * FROM muni ORDER BY Muni_Name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

    public function createMunicipality() 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO muni (Muni_Name)
            VALUES (?)");

        $stmt->bind_param(
            "s",
            $data['Muni_Name']
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
				"status" => "success",
                "message" => "Municipality is created",
                "id" => $this->db->insert_id
            ]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    // UPDATE Brand
    public function updateMunicipality($id) 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE muni 
            SET Muni_Name = ? 
            WHERE Muni_ID = ?
        ");

        $stmt->bind_param(
            "si",
            $data['Muni_Name'],
            $id
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Municipality is updated"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function deleteMunicipality($id) 
	{
        $stmt = $this->db->prepare("DELETE FROM muni WHERE Muni_ID = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Municipality is deleted"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function getByMunicipalityName($muni_name,$id) 
	{		
		$stmt = $this->db->prepare("SELECT * FROM muni WHERE Muni_Name = ? and Muni_ID <> ?");
        $stmt->bind_param("si", $muni_name, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $brandname = $result->fetch_assoc();

        if ($brandname) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
    }

    // READ ALL Barangay
    public function getAllBrgyWithRates() 
	{		
		$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM barangay");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT m.Muni_ID, m.Muni_Name, b.Brgy_ID, b.Brgy_Name, b.Rates   
                FROM barangay b
                JOIN muni m on m.Muni_ID = b.Muni_ID 
                ORDER BY 2, 4
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

    public function createBarangay() 
	{
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            INSERT INTO barangay (Muni_ID, Brgy_Name, Rates)
            VALUES (?, ?, ?)");

         $stmt->bind_param(
            "isd",
            $data['Muni_ID'],
            $data['Brgy_Name'],
            $data['Rates']
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
				"status" => "success",
                "message" => "Barangay is created",
                "id" => $this->db->insert_id
            ]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function updateBarangay($id)
    {
        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        $stmt = $this->db->prepare("
            UPDATE barangay
            SET Muni_ID = ?, Brgy_Name = ?, Rates = ? 
            WHERE Brgy_ID = ?
        ");

        $stmt->bind_param(
            "isdi",
            $data['Muni_ID'],
            $data['Brgy_Name'],
            $data['Rates'],
            $id
        );

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Barangay is updated"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function deleteBarangay($id) 
	{
        $stmt = $this->db->prepare("DELETE FROM barangay WHERE Brgy_ID = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) 
		{
            echo json_encode([
			"status" => "success",
			"message" => "Barangay is deleted"]);
        } 
		else 
		{
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function getByBarangayName($brgy_name,$id) 
	{		
		$stmt = $this->db->prepare("SELECT * FROM barangay WHERE Brgy_Name = ? and Brgy_ID <> ?");
        $stmt->bind_param("si", $brgy_name, $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $brandname = $result->fetch_assoc();

        if ($brandname) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
    }

    public function readAllBrgy()
    {
        $result = $this->db->query("SELECT Muni_ID, Brgy_ID, Brgy_Name FROM barangay ORDER BY Brgy_Name ASC");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode([
            'data' => $data
        ]);
    }

}



// =======================
// ROUTER
// =======================
$controller = new UserShippingDetailsController($conn);

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
		case 'getByFullName':
			$controller->getByFullName($_GET['full_name'] ?? "", $_GET['user_id'] ?? 0, $_GET['user_shipping_id'] ?? 0);
            break;
        case 'getByUserId':
			$controller->getByUserId($_GET['user_id'] ?? 0);
            break;
        case "getAllMunicipalities":
            $controller->getAllMunicipalities(); //with paging
            break;
        case "readAllMunicipalities":
            $controller->readAllMunicipalities(); //with no paging
            break;
        case 'createMunicipality':
            $controller->createMunicipality();
            break;
        case 'updateMunicipality':
            $controller->updateMunicipality($_GET['id'] ?? 0);
            break;
        case 'deleteMunicipality':
            $controller->deleteMunicipality($_GET['id'] ?? 0);
            break;
        case 'getByMunicipalityName':
			$controller->getByMunicipalityName($_GET['muni_name'] ?? "", $_GET['id'] ?? 0);
            break;
        case "getAllBrgyWithRates":
            $controller->getAllBrgyWithRates();
            break;
        case 'createBarangay':
            $controller->createBarangay();
            break;
        case 'updateBarangay':
            $controller->updateBarangay($_GET['id'] ?? 0);
            break;      
        case 'deleteBarangay':
            $controller->deleteBarangay($_GET['id'] ?? 0); 
            break;
        case 'getByBarangayName':
			$controller->getByBarangayName($_GET['brgy_name'] ?? "", $_GET['id'] ?? 0);
            break;
        case "readAllBrgy":
            $controller->readAllBrgy();
            break;
        // case 'readByFilter':
        //     $controller->readByFilter($_GET['categoryIds'] ?? "0", $_GET['brandIds'] ?? "0");
        // break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
