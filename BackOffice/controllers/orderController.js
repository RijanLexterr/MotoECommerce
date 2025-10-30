app.controller("OrderController", function ($scope, $http) {
  $scope.OrdersWithItems = [];
  $scope.orderIdForShipping;
  $scope.searchQuery = "";
  $scope.pageSize = 5;
  $scope.pagination = {
    page: 1,
    totalPages: 1
  };

  getAllTransactions();

  function getAllTransactions(page = 1, limit = $scope.pageSize) {
    $http.get(`../Core/Controller/OrderController.php?action=readAll&page=${page}&limit=${limit}`)
      .then(function (response) {
        $scope.OrdersWithItems = response.data.data;
        $scope.pagination.page = response.data.page;
        $scope.pagination.limit = response.data.limit;
        $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
      })
      .catch(function (error) {
        console.error("Error fetching transactions:", error);
      });
  };

  // Pagination controls
  $scope.loadTransactions = function (page) {
    getAllTransactions(page, $scope.pageSize);
  };

  // Page size change
  $scope.changePageSize = function () {
    getAllTransactions(1, $scope.pageSize); // Reset to page 1
  };

  $scope.showOrderItems = function (parent) {
    console.log(parent);
    $scope.selectedParent = parent;
  };

  $scope.shippedOrderOnClick = function (id) {
    $scope.orderIdForShipping = id;
  }

  $scope.shippedOrder = function () {
    $http.get("../Core/Controller/OrderController.php?action=shipOrder&id=" + $scope.orderIdForShipping)
      .then(function (response) {
        if (response.data.status == "success") {
          $('#shippedOrderConfirmationModal').modal('hide');
          getAllTransactions();

          //Recalculate stock
          $http.get("../Core/Controller/OrderController.php?action=readAllItems&id=" + $scope.orderIdForShipping)
            .then(function (response) {
              angular.forEach(response.data, function (item) {
                $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${item.product_id}`)
                  .then(function (resp) {
                    console.log("Item Recalculated!");
                  })
                  .catch(err => console.error(err));
              });
            }).catch(err => console.error(err));
        }
      })
      .catch(function (error) {
        console.error("Error shipping order:", error);
      });
  };

});
