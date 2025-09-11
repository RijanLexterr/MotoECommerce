app.controller("NavController", function($scope, $http, $location, $rootScope) {
  $scope.isLoggedIn = $rootScope.isLoggedIn;
  $scope.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  // Watch for changes to $rootScope.isLoggedIn
  $scope.$watch(function() {
    return $rootScope.isLoggedIn;
  }, function(newVal) {
    $scope.isLoggedIn = newVal;
  });

  $scope.$watch(function() {
    return $rootScope.currentUser;
  }, function(newVal) {
    $scope.currentUser = newVal;
    
  });

  $scope.logout = function() {
    $http.post('../Core/Controller/Login/logout.php').then(function() {
      $rootScope.isLoggedIn = false;
      $scope.isLoggedIn = false;
      $scope.currentUser = '';
      sessionStorage.clear();
      $location.path('/login');
    });
  };
});
