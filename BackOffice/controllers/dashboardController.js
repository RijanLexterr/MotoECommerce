

app.controller("DashboardController", function($scope, $http) {
  $scope.totalsForDisplay = [];

  $http.get("../Core/Controller/DashboardController.php?action=getTotals")
    .then(function(response) {
      $scope.totalsForDisplay = response.data;

       console.log($scope.totalsForDisplay);

    }, function(error) {
      console.error("Error fetching data:", error);
    });

});