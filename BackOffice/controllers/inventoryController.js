app.controller("InventoryController", function($scope, $http, $timeout,$route) {
    $scope.Items = [];
    $scope.transaction = {};
    $scope.isEdit = false;

    $scope.pagination = { page: 1, pageSize: 5, totalPages: 1 };

    // ======================
    // Load products
    // ======================
    $scope.loadProducts = function(page = 1) {
        let params = { page: page, pageSize: $scope.pagination.pageSize };
        $http.get("../Core/Controller/InventoryController.php?action=GetAllProducts", { params })
            .then(function(response) {
                $scope.Items = response.data.data || [];
                $scope.pagination = response.data.pagination || $scope.pagination;
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Open Add/Edit Modal
    // ======================
    $scope.openAddTransaction = function(productId) {
        $scope.isEdit = false;
        $scope.transaction = { product_id: productId, qty: 0, type_id: 1 };
        $("#transactionFormModal").modal("show");
    };

    $scope.openEditTransaction = function(item) {
        $scope.isEdit = true;
        $scope.transaction = angular.copy(item);
        $scope.transaction.qty = Number(item.qty) || 0;
        $scope.transaction.type_id = Number(item.type_id);
        $("#transactionFormModal").modal("show");
    };

    // ======================
    // Save Transaction
    // ======================
    $scope.saveTransaction = function() {
        let action = $scope.isEdit ? 'update' : 'create';
        let url = `../Core/Controller/InventoryController.php?action=${action}`;
        let productId = $scope.transaction.product_id;
        if ($scope.isEdit) url += "&id=" + $scope.transaction.transaction_id;

        $scope.transaction.qty = Number($scope.transaction.qty);
        $scope.transaction.type_id = Number($scope.transaction.type_id);

        $http.post(url, $scope.transaction)
            .then(function(response) {
                alert(response.data.message);

                // ✅ Recalculate stock, then reload products
                $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${productId}`)
                    .then(function(resp) {
                        

                        // Clear form & hide modal
                        $scope.transaction = {};
                        $scope.isEdit = false;
                        $("#transactionFormModal").modal("hide");

                        // Reload products to refresh stock
                        $timeout(function() { 
                            $scope.loadProducts(); 
                            $route.reload();
                        }, 0);
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Delete Transaction
    // ======================
    $scope.deleteTransaction = function(id, productId) {
        if (!confirm("Delete this transaction?")) return;

        $http.get(`../Core/Controller/InventoryController.php?action=delete&id=${id}`)
            .then(function(resp) {
                alert(resp.data.message);

                // Recalculate stock after deletion
                $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${productId}`)
                    .then(function(resp) {
                        $timeout(function() { $scope.loadProducts(); }, 0);
                    });
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Pagination
    // ======================
    $scope.changePageSize = function() { $scope.loadProducts(1); };
    $scope.goToPage = function(page) { 
        if(page >= 1 && page <= $scope.pagination.totalPages) $scope.loadProducts(page); 
    };

    // ======================
    // Initial load
    // ======================
    $scope.loadProducts();
});
