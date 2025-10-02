app.controller("PaymentTypeController", function($scope, $http) {
  $scope.PaymentTypes = [];
  $scope.selectedPaymentType = null;

  // ======================
  // 📌 LOAD ALL PAYMENT TYPES
  // ======================
  $scope.loadPaymentTypes = function() {
    $http.get("../Core/Controller/PaymentTypeController.php?action=readAll")
      .then(function(response) {
        $scope.PaymentTypes = response.data.data; // API returns {page, limit, total, data}
        console.log("Payment Types:", $scope.PaymentTypes);
      })
      .catch(function(error) {
        console.error("Error fetching payment types:", error);
      });
  };

  // ======================
  // 📌 ADD PAYMENT TYPE
  // ======================
  $scope.addPaymentType = function(newType) {
    $http.post("../Core/Controller/PaymentTypeController.php?action=createPaymentType", newType)
      .then(function(response) {
        alert(response.data.message);
        $scope.loadPaymentTypes();
        $scope.newType = {}; // clear form
      })
      .catch(function(error) {
        console.error("Error creating payment type:", error);
      });
  };

  // ======================
  // 📌 UPDATE PAYMENT TYPE
  // ======================
  $scope.updatePaymentType = function(type) {
    $http.post("../Core/Controller/PaymentTypeController.php?action=updatePaymentType&id=" + type.payment_type_id, type)
      .then(function(response) {
        alert(response.data.message);
        $scope.loadPaymentTypes();
      })
      .catch(function(error) {
        console.error("Error updating payment type:", error);
      });
  };

  // ======================
  // 📌 DELETE PAYMENT TYPE
  // ======================
  $scope.deletePaymentType = function(id) {
    if (!confirm("Are you sure you want to delete this payment type?")) return;

    $http.get("../Core/Controller/PaymentTypeController.php?action=deletePaymentType&id=" + id)
      .then(function(response) {
        alert(response.data.message);
        $scope.loadPaymentTypes();
      })
      .catch(function(error) {
        console.error("Error deleting payment type:", error);
      });
  };

  // ======================
  // 📌 SHOW MODAL (Edit / View)
  // ======================
  $scope.showPaymentTypeModal = function(type) {
    $scope.selectedPaymentType = angular.copy(type); // make a copy to edit
    var myModal = new bootstrap.Modal(document.getElementById('paymentTypeModal'));
    myModal.show();
  };

  // ======================
  // Load payment types on init
  // ======================
  $scope.loadPaymentTypes();
});
