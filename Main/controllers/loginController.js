app.controller('LoginController', function($scope, $http, $location, $rootScope) {
  $scope.error = '';
  $scope.emailError = '';
  $scope.passwordError = '';

  $scope.login = function () {
    $scope.error = '';
    $scope.emailError = '';
    $scope.passwordError = '';

    // Manual validation
    if (!$scope.username) {
      $scope.emailError = 'Email is required.';
    } else if (!validateEmail($scope.username)) {
      $scope.emailError = 'Please enter a valid email address.';
    }

    if (!$scope.password) {
      $scope.passwordError = 'Password is required.';
    } else if ($scope.password.length < 0) {
      $scope.passwordError = 'Password must be at least 6 characters.';
    }

    if ($scope.emailError || $scope.passwordError) {
      return;
    }

    // Proceed with login
    $http.post('../Core/Controller/Login/login.php', {
      email: $scope.username,
      password: $scope.password
    }).then(function (response) {
      if (response.data.status === 'success') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
        $scope.$emit('isLoggedIn', true);
        $scope.$emit('currentUser', response.data.user);
        $rootScope.isLoggedIn = true;
        $rootScope.currentUser = response.data.user;


        var redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/home';
        sessionStorage.removeItem('redirectAfterLogin');
        $location.path(redirectPath);
      } else {
        $scope.error = response.data.message;
      }
    });
  };

  function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  $scope.signupOnClick = function() {
    $location.path('/signup');
  }
});
