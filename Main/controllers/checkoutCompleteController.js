app.controller('CheckOutCompleteController', function($scope, $location) {
  const params = $location.search();
  $scope.status = params.status || 'error';
  $scope.orderNumber = params.orderId;
  $scope.cartCleared = !sessionStorage.getItem('productsOnCart');
});