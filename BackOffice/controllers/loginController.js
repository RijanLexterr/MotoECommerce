app.controller('LoginController', function($scope, $http, $location) {
  $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  $scope.currentUser = sessionStorage.getItem('currentUser');

  $scope.login = function() {
    $http.post('../Core/Controller/Login/login.php', {
      email: $scope.username,
      password: $scope.password
    }).then(function(response) {
      if (response.data.status === 'success') {
        $scope.isLoggedIn = true;
        $scope.currentUser = response.data.user;


        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
        $scope.$emit('isLoggedIn', response.data.user);
        $location.path('/users');
        
      } else {
        $scope.error = response.data.message;
      }
    });
  };

  
});
