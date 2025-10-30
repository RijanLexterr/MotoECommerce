<?php
require_once '../config.php';
require_once '../model.php';

class InventoryReportController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ======================
    // MONTHLY REPORT
    // ======================
    public function monthlyReport() {
        $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
        $month = isset($_GET['month']) ? (int)$_GET['month'] : date('m');
        $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;

        $where = "WHERE YEAR(it.created_at) = $year AND MONTH(it.created_at) = $month";
        if ($productId) {
            $where .= " AND it.product_id = $productId";
        }

        $query = "
            SELECT 
                p.product_id,
                p.name AS product_name,
                p.price,
                SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END) AS total_in,
                SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END) AS total_out,
                SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END) AS total_adjustment,
                (SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END)
                 - SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END)
                 + SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END)) AS net_change,
                (SUM(it.qty) * p.price) AS total_value
            FROM inventory_transactions it
            JOIN products p ON it.product_id = p.product_id
            $where
            GROUP BY p.product_id
            ORDER BY p.name ASC
        ";

        $result = $this->db->query($query);
        $report = [];

        while ($row = $result->fetch_assoc()) {
            $report[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "period" => "$year-" . str_pad($month, 2, "0", STR_PAD_LEFT),
            "filter" => $productId ? "Product ID: $productId" : "All Products",
            "data" => $report
        ]);
    }

    // ======================
    // YEARLY REPORT
    // ======================
    public function yearlyReport() {
        $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');

        $query = "
            SELECT 
                MONTH(it.created_at) AS month,
                SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END) AS total_in,
                SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END) AS total_out,
                SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END) AS total_adjustment
            FROM inventory_transactions it
            WHERE YEAR(it.created_at) = $year
            GROUP BY MONTH(it.created_at)
            ORDER BY MONTH(it.created_at)
        ";

        $result = $this->db->query($query);
        $report = [];

        while ($row = $result->fetch_assoc()) {
            $report[] = [
                "month" => date("F", mktime(0, 0, 0, $row['month'], 1)), // convert to month name
                "total_in" => (int)$row['total_in'],
                "total_out" => (int)$row['total_out'],
                "total_adjustment" => (int)$row['total_adjustment']
            ];
        }

        echo json_encode([
            "year" => $year,
            "data" => $report
        ]);
    }

    // ======================
    // REPORT BY PRODUCT
    // ======================
    public function byProduct() {
        $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;

        if (!$productId) {
            echo json_encode(["status" => "error", "message" => "Missing product_id"]);
            return;
        }

        $query = "
            SELECT 
                p.product_id,
                p.name AS product_name,
                it.transaction_id,
                it.type_id,
                it.qty,
                it.created_at,
                it.remarks
            FROM inventory_transactions it
            JOIN products p ON it.product_id = p.product_id
            WHERE it.product_id = $productId
            ORDER BY it.created_at DESC
        ";

        $result = $this->db->query($query);
        $data = $result->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);
    }

    // ======================
    // EXPORT REPORT TO EXCEL (CSV)
    // ======================
    public function exportReport() {
        $type = $_GET['type'] ?? 'monthly'; // monthly | yearly
        $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
        $month = isset($_GET['month']) ? (int)$_GET['month'] : date('m');

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="inventory_report_' . $type . '.csv"');

        $output = fopen('php://output', 'w');

        if ($type === 'yearly') {
            fputcsv($output, ['Month', 'Total IN', 'Total OUT', 'Adjustments']);

            $query = "
                SELECT 
                    MONTH(it.created_at) AS month,
                    SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END) AS total_in,
                    SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END) AS total_out,
                    SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END) AS total_adjustment
                FROM inventory_transactions it
                WHERE YEAR(it.created_at) = $year
                GROUP BY MONTH(it.created_at)
                ORDER BY MONTH(it.created_at)
            ";

            $result = $this->db->query($query);
            while ($row = $result->fetch_assoc()) {
                fputcsv($output, [
                    date("F", mktime(0, 0, 0, $row['month'], 1)),
                    $row['total_in'], $row['total_out'], $row['total_adjustment']
                ]);
            }
        } else {
            // monthly report
            fputcsv($output, ['Product', 'Total IN', 'Total OUT', 'Adjustments', 'Net Change', 'Total Value']);

            $query = "
                SELECT 
                    p.name AS product_name,
                    SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END) AS total_in,
                    SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END) AS total_out,
                    SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END) AS total_adjustment,
                    (SUM(CASE WHEN it.type_id = 1 THEN it.qty ELSE 0 END)
                     - SUM(CASE WHEN it.type_id = 2 THEN it.qty ELSE 0 END)
                     + SUM(CASE WHEN it.type_id = 3 THEN it.qty ELSE 0 END)) AS net_change,
                    (SUM(it.qty) * p.price) AS total_value
                FROM inventory_transactions it
                JOIN products p ON it.product_id = p.product_id
                WHERE YEAR(it.created_at) = $year AND MONTH(it.created_at) = $month
                GROUP BY p.product_id
                ORDER BY p.name ASC
            ";

            $result = $this->db->query($query);
            while ($row = $result->fetch_assoc()) {
                fputcsv($output, [
                    $row['product_name'], $row['total_in'], $row['total_out'],
                    $row['total_adjustment'], $row['net_change'], $row['total_value']
                ]);
            }
        }

        fclose($output);
        exit;
    }
}

// =======================
// ROUTER
// =======================
$controller = new InventoryReportController($conn);

$action = $_GET['action'] ?? '';

switch($action) {
    case 'monthly': $controller->monthlyReport(); break;
    case 'yearly': $controller->yearlyReport(); break;
    case 'byProduct': $controller->byProduct(); break;
    case 'export': $controller->exportReport(); break;
    default:
        echo json_encode(["status" => "error", "message" => "Invalid report action"]);
}
