app.controller('MainController', function($scope, $location, $rootScope) {
  // Initial check
  $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  $scope.$on('$routeChangeSuccess', function() {
    // Re-check login status on every route change
    $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    $rootScope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    $rootScope.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // Optional: redirect to login if not logged in
    if (!$scope.isLoggedIn && $location.path() !== '/login' && $location.path() !== '/forgotpassword') {
      $location.path('/login');
    }
  });
});
