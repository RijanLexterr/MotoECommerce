<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class UserController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }

    // public function create() {
    //     $rawData = file_get_contents("php://input");
    //     $data = json_decode($rawData, true);

    //     $stmt = $this->db->prepare("
    //         INSERT INTO users (name, email, password, created_at)
    //         VALUES (?, ?, ?, ?)
    //     ");
    //     $created_at = date("Y-m-d H:i:s");

    //     $stmt->bind_param(
    //         "ssss",
    //         $data['name'],
    //         $data['email'],
    //         $data['password'],
    //         $created_at
    //     );

    //     if ($stmt->execute()) {
    //         echo json_encode([
    //             "status" => "success",      
    //             "message" => "User created",
    //             "id" => $this->db->insert_id
    //         ]);
    //     } else {
    //         echo json_encode(["status" => "error", "message" => $stmt->error]);
    //     }
    // }

    public function create() {
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    $created_at = date("Y-m-d H:i:s");

    // First insert into users
    $stmt = $this->db->prepare("
        INSERT INTO users (name, email, password, created_at)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param(
        "ssss",
        $data['name'],
        $data['email'],
        $data['password'],
        $created_at
    );

    if ($stmt->execute()) {
        $user_id = $this->db->insert_id;

        // Now insert into user_roles
        $role_id = $data['role_id']; // Make sure this is passed in the input
        $stmt2 = $this->db->prepare("
            INSERT INTO user_roles (user_id, role_id)
            VALUES (?, ?)
        ");
        $stmt2->bind_param("ii", $user_id, $role_id);

        if ($stmt2->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "User and role assigned",
                "user_id" => $user_id,
                "role_id" => $role_id
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "User created but role assignment failed: " . $stmt2->error
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "User creation failed: " . $stmt->error
        ]);
    }
}


    public function readAll() {

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM users");
        $total = $countResult->fetch_assoc()['total'];

        // Get paginated data
        $query = "SELECT a.user_id as user_id, a.name, a.email, a.password, b.role_id, c.name as role_name  
                FROM users a 
                JOIN user_roles b ON a.user_id = b.user_id 
                JOIN roles c ON b.role_id = c.role_id
                ORDER BY a.created_at ASC 
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

    public function getUserByEmail($email) {

        
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {
            echo json_encode(["isExisting" => true]);
        } else {
            echo json_encode(["isExisting" => false]);
        }
}


    public function readOne($id) {
        $stmt = $this->db->prepare("SELECT a.user_id as user_id, a.name, a.email, a.password, b.role_id, c.name as role_name  FROM users a 
        JOIN user_roles b ON a.user_id = b.user_id JOIN roles c ON b.role_id = c.role_id WHERE a.user_id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {
            echo json_encode(["status" => "success", "user" => $user]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "User not found"]);
        }
    }

    public function update($id) {
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    // Update user info
    $stmt = $this->db->prepare("
        UPDATE users
        SET name = ?, email = ?, password = ?
        WHERE user_id = ?
    ");
    $stmt->bind_param("sssi", $data['name'], $data['email'], $data['password'], $id);

    if ($stmt->execute()) {
        // Update user role
        $role_id = $data['role_id'];
        $stmt2 = $this->db->prepare("
            UPDATE user_roles
            SET role_id = ?
            WHERE user_id = ?
        ");
        $stmt2->bind_param("ii", $role_id, $id);

        if ($stmt2->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "User and role updated"
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "User updated but role update failed: " . $stmt2->error
            ]);
        }
    } else {
        echo json_encode([
            "status" => "error",
            "message" => $stmt->error
        ]);
    }
}


    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "User deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    public function readAllRoles() {

        $result = $this->db->query("SELECT * FROM roles ");
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode($data);
    }
}


// =======================
// ROUTER
// =======================
$controller = new UserController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'create':
            $controller->create();
            break;
        case 'readAll':
            $controller->readAll();
            break;
        case 'readAllRoles':
            $controller->readAllRoles();
            break;
        case 'getUserByEmail':
            $controller->getUserByEmail($_GET['email'] ?? "");
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
