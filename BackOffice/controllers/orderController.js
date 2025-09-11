app.controller("OrderController", function($scope, $http) {
  $scope.OrdersWithItems = [];

  // ======================
  // 📌 LOAD ALL TRANSACTIONS
  // ======================
  $scope.loadTransactions = function() {
    $http.get("../Core/Controller/OrderController.php?action=readAll")
      .then(function(response) {
        $scope.OrdersWithItems = response.data;

        console.log($scope.OrdersWithItems);
      })
      .catch(function(error) {
        console.error("Error fetching transactions:", error);
      });
  };

  // Function to show modal with selected parent’s child items
  $scope.showOrderItems = function (parent) {
      // Set selected parent in the scope to bind to the modal content
      $scope.selectedParent = parent;

      // Show the modal using Bootstrap's modal method
      var myModal = new bootstrap.Modal(document.getElementById('childModal'));
      myModal.show();
  };

  // Function to show modal with selected parent’s child items
  $scope.shippedOrder = function (orderId) {
      if (!confirm("Are you sure you want to ship this Order now?")) return;

      $http.get("../Core/Controller/OrderController.php?action=shipOrder&id=" + orderId)
      .then(function(response) {
        alert(response.data.message);
        $scope.loadTransactions();
      })
      .catch(function(error) {
        console.error("Error shipping order:", error);
      });
  };

  // ======================
  // Load transactions on init
  // ======================
  $scope.loadTransactions();
});
