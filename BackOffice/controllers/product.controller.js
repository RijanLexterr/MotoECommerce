

app.controller("ProductController", function($scope, $http) {
  $scope.products = [];
  $scope.searchQuery = "";

  $http.get("../Core/Controller/ProductController.php?action=readAll")
    .then(function(response) {
      $scope.products = response.data;
    }, function(error) {
      console.error("Error fetching products:", error);
    });


    $scope.message = " hello "
});