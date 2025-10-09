app.controller('FooterController', function ($scope, $rootScope, $location) {
  $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  $scope.currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
$scope.isLoginPage = function() {
   return $location.path() === '/login' || $location.path() === '/signup';
};

});
