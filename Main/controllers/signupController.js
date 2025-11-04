app.controller("SignUpController", function ($scope, $http, $location, $rootScope) {

  class User {
    constructor(id = 0, name = "", email = "", phonenumber = "", Address = "", password = "", role = "") {
      this.id = id;
      this.name = name;
      this.email = email;
	  this.phonenumber = phonenumber;
      this.Address = Address;
      this.password = password
      this.role_id = role;;
    }
  }

  $scope.updateUserFields = function (id = null, name = null, email = null, phonenumber = null, Address = null, password = null, confirmPassword = null) {
    clearError();
    $scope.userId = id;
    $scope.name = name;
    $scope.email = email;
	$scope.phonenumber = phonenumber;
    $scope.Address = Address;
    $scope.password = password;
    $scope.confirmPassword = confirmPassword;
  }

  $scope.users = [];
  function clearError() {
    $scope.nameHasError = false;
    $scope.emailHasError = false;
    $scope.passwordHasError = false;
    $scope.confirmPasswordHasError = false;
  }

  $scope.validateName = function () {
    $scope.nameHasError = !$scope.name
  }

  $scope.validateEmail = function () {
    $scope.emailHasError = !$scope.email
    $scope.emailError = "Email is required."

    if ($scope.email) {
      $http.get("../Core/Controller/UserController.php?action=validateUserByEmail&email=" + $scope.email)
        .then(function (response) {
          $scope.emailHasError = response.data.isExisting;
          $scope.emailError = "Email already exist."
        }, function (error) {
          console.error("Error fetching data:", error);
        });
    }
  }

  if (!sessionStorage.getItem('productsOnCart')) {
    sessionStorage.setItem('productsOnCart', JSON.stringify([]));
  }

  $scope.validatePassword = function () {
    $scope.passwordHasError = !$scope.password
  }

  $scope.validateConfirmPassword = function () {
    $scope.confirmPasswordHasError = (!$scope.confirmPassword) || ($scope.confirmPassword != $scope.password)
    $scope.confirmPasswordError = !$scope.confirmPassword ? "Confirm password is required." : "Password do not match."
  }

  $scope.submit = function (id) {
    $scope.validateName();
    if (!id) {
      $scope.validateEmail()
    }
    $scope.validatePassword();
    $scope.validateConfirmPassword();
    let isValid = (!$scope.nameHasError && !$scope.emailHasError && !$scope.passwordHasError && !$scope.confirmPasswordHasError)

    if (isValid) {
      let user = new User(id, $scope.name, $scope.email, $scope.phonenumber, $scope.Address, $scope.password, $scope.role.role_id)
      if (!id) {
        createUser(user)
      } else {
        updateUser(user)
      }
    }

  }

  function createUser(user) {
    $http.post("../Core/Controller/UserController.php?action=create", user)
      .then(function (response) {

        if (response.data.status == "success") {
          $scope.status = 'success'; // ✅ Set success flag
        $scope.email = user.email;
          $scope.updateUserFields();
        }

      }, function (error) {
        $scope.status = 'error';
        console.error("Error fetching data:", error);
      });
  }

  function getStaffRole() {
    $http.get("../Core/Controller/UserController.php?action=readAllRoles")
      .then(function (response) {

        $scope.roles = response.data;
        $scope.role = $scope.roles.find(r => r.name === "Staff");

      }, function (error) {
        console.error("Error fetching data:", error);
      });
  }


    getStaffRole();


});
