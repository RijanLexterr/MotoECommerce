<?php
require_once '../config.php'; // gives $conn (mysqli)
require_once '../model.php';

class DashboardController {
    private $db; // mysqli

    public function __construct($db) {
        $this->db = $db;
    }
    
    // Calculate Users, Orders, Sales
    public function getTotalsForDisplay() {
        $this->db->query("
             CREATE TEMPORARY TABLE dashboardTotals (
                name VARCHAR(250),
                totals INT,
                totalsAmt DECIMAL
            );            
        ");

        $this->db->query("
            insert into dashboardTotals (name, totals)
            select os.name, count(distinct o.order_id)
            from order_status os
            left join orders o on os.status_id = o.status_id
            group by o.status_id, os.name;
        ");

        $this->db->query("
            insert into dashboardTotals (name, totals)
            select 'Customer', count(distinct u.user_id)
            from users u
                join user_roles ur on ur.user_id = u.user_id
                join roles r on r.role_id = ur.role_id
            where r.name = 'Customer'
        ");

        $this->db->query("
            insert into dashboardTotals (name, totalsAmt)
            select 'Received Payments', IFNULL(sum(o.total), 0)
            from orders o
                join order_status os on os.status_id = o.status_id
            where os.name = 'Paid'
        ");

        $this->db->query("
            insert into dashboardTotals (name, totalsAmt)
            select 'Pending Payments', IFNULL(sum(o.total), 0)
            from orders o
                join order_status os on os.status_id = o.status_id
            where os.name = 'Shipped';
        ");
        
        $query = "
            SELECT * FROM dashboardTotals
        ";

        $result = $this->db->query($query);
        $totals = [];
        while ($row = $result->fetch_assoc()) {
            $totals[] = $row;
        }
        
        if ($totals) {
            echo json_encode($totals);
        } else {
            echo json_encode(["message" => "Error executing getTotalsForDisplay."]);
        }
    }

    

    
}


// =======================
// ROUTER
// =======================
$controller = new DashboardController($conn);

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'getTotals':
            $controller->getTotalsForDisplay();
            break;
        default:
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
}
