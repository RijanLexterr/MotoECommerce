app.controller('LoginController', function($scope, $http, $location) {
  $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  $scope.currentUser = sessionStorage.getItem('currentUser');


    // Error flags
    $scope.emailError = '';
    $scope.passwordError = '';
    $scope.error = '';

  $scope.login = function() {


    // Reset errors
    $scope.emailError = '';
    $scope.passwordError = '';
    $scope.error = '';

    // Client-side validation
    let valid = true;
    if (!$scope.username || !$scope.username.trim()) {
      $scope.emailError = 'Email is required.';
      valid = false;
    }

    if (!$scope.password || !$scope.password.trim()) {
      $scope.passwordError = 'Password is required.';
      valid = false;
    }

    if (!valid) return;


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
        $location.path('/users/Super Admin');
        
      } else {
        $scope.error = response.data.message;
      }
    });
  };

  
});
