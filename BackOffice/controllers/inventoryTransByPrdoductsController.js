app.controller("InventoryTransactionsController", function($scope, $http) {
  $scope.transactions = [];
  $scope.pagination = {
    page: 1,
    pageSize: 10,
    totalPages: 1
  };
  $scope.productId = null;

  // Load paginated transactions by productId
  $scope.loadTransactions = function(page) {
    if (!$scope.productId) return;

    $http.get("../Core/Controller/InventoryController.php?action=readAll", {
      params: {
        product_id: $scope.productId,
        page: page,
        pageSize: $scope.pagination.pageSize
      }
    })
    .then(function(response) {
      $scope.transactions = response.data.data || [];
      $scope.pagination.page = page;
      $scope.pagination.totalPages = response.data.totalPages || 1;
    })
    .catch(function(error) {
      console.error("Error fetching transactions:", error);
    });
  };

  // Change page size
  $scope.changePageSize = function() {
    $scope.pagination.page = 1;
    $scope.loadTransactions(1);
  };

  // Init function (accepts productId from ng-init)
  $scope.init = function(productId) {
    $scope.productId = productId;
    $scope.loadTransactions($scope.pagination.page);
  };
});
