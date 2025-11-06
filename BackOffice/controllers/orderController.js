app.controller("OrderController", function ($scope, $http) {
  $scope.OrdersWithItems = [];
  $scope.orderIdForShipping;
  $scope.searchQuery = "";
  $scope.pageSize = 5;
  $scope.pagination = {
    page: 1,
    totalPages: 1
  };
  $scope.returnRemarks = "";
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
  $scope.Verify = function () {
    $scope.orderIdForShipping = $scope.selectedParent.order_id;
    $('#showItemsModal').modal('hide');
    $('#shippedOrderConfirmationModal').modal('show');


    console.log($scope.selectedParent.order_id);
  }

  $scope.shippedOrderOnClick = function (id) {
    $scope.orderIdForShipping = id;
    console.log(id);
  }

  $scope.shippedOrder = function () {
    const payload = {
      status_id: 3, // or dynamically set this (e.g., shipped = 3, delivered = 4)
      remarks: "Order has been shipped"
    };

    $http.post(
      "../Core/Controller/OrderController.php?action=shipOrder&id=" + $scope.orderIdForShipping,
      payload
    )
      .then(function (response) {
        if (response.data.status === "success") {
          // Close modal
          $('#shippedOrderConfirmationModal').modal('hide');

          // Refresh transaction list
          getAllTransactions();

          // Recalculate stock after shipping
          $http.get("../Core/Controller/OrderController.php?action=readAllItems&id=" + $scope.orderIdForShipping)
            .then(function (response) {
              angular.forEach(response.data, function (item) {
                $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${item.product_id}`)
                  .then(() => console.log(`Stock recalculated for product ${item.product_id}`))
                  .catch(err => console.error("Error recalculating stock:", err));
              });
            })
            .catch(err => console.error("Error reading items:", err));
        } else {
          console.error("Error:", response.data.message);
        }
      })
      .catch(function (error) {
        console.error("Error shipping order:", error);
      });
  };


  $scope.returnOrder = function () {
    const payload = {
      status_id: 6,
      remarks: $scope.returnRemarks || "Order returned"
    };

    $http.post("../Core/Controller/OrderController.php?action=returnOrder&id=" + $scope.selectedParent.order_id, payload)
      .then(function (response) {
        if (response.data.status === "success") {
          $('#returnOrder').modal('hide');
         

          getAllTransactions();
          $scope.returnRemarks = ""; // clear textarea
        } else {
          console.error(response.data.message);
        }
      })
      .catch(function (error) {
        console.error("Error returning order:", error);
      });
  };


});
