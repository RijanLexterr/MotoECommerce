
app.controller("UserController", function ($scope, $http, $routeParams) {

  // Get the view param or default to 'super_admin'
  $scope.userView = $routeParams.view || "Admin";

  // If route param missing, update URL automatically
  if (!$routeParams.view) {
    $location.path("/users/Admin");
    return; // stop here so it doesn’t call the API twice
  }

  $scope.userIdForDelete;


  $scope.updateUserFields = function (id = null, name = null, email = null, phonenumber = null, Address = null, password = null, confirmPassword = null, userRoleId = null) {
    clearError();
    $scope.userId = id;
    $scope.name = name;
    $scope.email = email;
    $scope.phonenumber = phonenumber;
    $scope.Address = Address;
    $scope.password = password;
    $scope.confirmPassword = confirmPassword;
    $scope.selectedUserRoleId = userRoleId;
  }

  $scope.users = [];
  function clearError() {
    $scope.nameHasError = false;
    $scope.emailHasError = false;
    $scope.passwordHasError = false;
    $scope.confirmPasswordHasError = false;
    $scope.selectedUserRoleIdHasError = false;
  }

  // function getAllUser() {
  //   $http.get("../Core/Controller/UserController.php?action=readAll")
  //   .then(function(response) {
  //     $scope.users = response.data;
  //   }, function(error) {
  //     console.error("Error fetching data:", error);
  //   });
  // }

  // getAllUser();

  $scope.pageSize = 5;
  $scope.pagination = {
    page: 1,
    totalPages: 1
  };

  function getAllUser(page = 1, limit = $scope.pageSize) {
    $http.get(`../Core/Controller/UserController.php?action=readAll&page=${page}&limit=${limit}&view=${$scope.userView}`)
      .then(function (response) {
        $scope.users = response.data.data;
        $scope.pagination.page = response.data.page;
        $scope.pagination.limit = response.data.limit;
        $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
      }, function (error) {
        console.error("Error fetching data:", error);
      });
  };

  // Initial load
  getAllUser();

  // Pagination controls
  $scope.loadTransactions = function (page) {
    getAllUser(page, $scope.pageSize);
  };

  // Page size change
  $scope.changePageSize = function () {
    getAllUser(1, $scope.pageSize); // Reset to page 1
  };

  function getAllRoles(id) {
    $http.get("../Core/Controller/UserController.php?action=readAllRoles")
      .then(function (response) {
        $scope.roles = response.data;
        if (id) {
          console.log($scope.users.find(u => u.user_id === id))
          let currentUser = $scope.users.find(u => u.user_id === id);
          $scope.updateUserFields(currentUser.user_id, currentUser.name,
            currentUser.email, currentUser.phonenumber,
            currentUser.Address, currentUser.password, currentUser.password, currentUser.role_id)
        }
      }, function (error) {
        console.error("Error fetching data:", error);
      });
  }

  $scope.updateUserOnClick = function (id) {
    getAllRoles(id);
  }

  //$scope.getUserById = function(id) {


  // if(id) {
  //   $http.get("../Core/Controller/UserController.php?action=readOne&id=" + parseInt(id))
  //   .then(function(response) {
  //     if(response.data.status === "success") {
  //       $scope.updateUserFields(response.data.user.user_id, response.data.user.name, 
  //         response.data.user.email, response.data.user.password, response.data.user.password, response.data.user.role_id)
  //     }     
  //   }, function(error) {
  //     console.error("Error fetching data:", error);
  //   });

  //   }
  //}

  $scope.addUserOnClick = function () {
    getAllRoles();
  }



  $scope.validateName = function () {
    $scope.nameHasError = !$scope.name
  }

  $scope.validateEmail = function () {
    $scope.emailHasError = !$scope.email
    $scope.emailError = "Email is required."

    if ($scope.email) {
      $http.get("../Core/Controller/UserController.php?action=getUserByEmail&email=" + $scope.email)
        .then(function (response) {
          $scope.emailHasError = response.data.isExisting;
          $scope.emailError = "Email already exist."
        }, function (error) {
          console.error("Error fetching data:", error);
        });
    }
  }

  $scope.validatePassword = function () {
    $scope.passwordHasError = !$scope.password
  }

  $scope.validateConfirmPassword = function () {
    $scope.confirmPasswordHasError = (!$scope.confirmPassword) || ($scope.confirmPassword != $scope.password)
    $scope.confirmPasswordError = !$scope.confirmPassword ? "Confirm password is required." : "Password do not match."
  }

  $scope.validateRole = function () {
    $scope.selectedUserRoleIdHasError = !$scope.selectedUserRoleId
  }


  class User {
    constructor(id = 0, name = "", email = "", phonenumber = "", Address = "", password = "", role = 0) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.phonenumber = phonenumber;
      this.Address = Address;
      this.password = password;
      this.role_id = role;
    }
  }

  $scope.submit = function (id) {
    $scope.validateName();
    if (!id) {
      $scope.validateEmail()
    }
    $scope.validatePassword();
    $scope.validateConfirmPassword();
    $scope.validateRole();
    let isValid = (!$scope.nameHasError && !$scope.emailHasError && !$scope.passwordHasError && !$scope.confirmPasswordHasError && !$scope.selectedUserRoleIdHasError)

    if (isValid) {
      let user = new User(id, $scope.name, $scope.email, "","",$scope.password, $scope.selectedUserRoleId)
      if (!id) {
        console.log(user);
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
          $('#userCreateModal').modal('hide');
          $scope.updateUserFields();
          getAllUser();
        }

      }, function (error) {
        console.error("Error fetching data:", error);
      });
  }

  function updateUser(user) {
    $http.post("../Core/Controller/UserController.php?action=update&id=" + parseInt(user.id), user)
      .then(function (response) {

        if (response.data.status == "success") {
          $('#userCreateModal').modal('hide');
          $scope.updateUserFields();
          getAllUser();
        }

      }, function (error) {
        console.error("Error fetching data:", error);
      });
  }

  $scope.deleteUserOnClick = function (id) {
    $scope.userIdForDelete = id;
  }

  $scope.deleteUserById = function () {
    $http.post("../Core/Controller/UserController.php?action=delete&id=" + parseInt($scope.userIdForDelete))
      .then(function (response) {

        if (response.data.status == "success") {
          $('#deleteUserConfirmationModal').modal('hide');
          getAllUser();
        }
      }, function (error) {
        console.error("Error fetching data:", error);
      });
  }

  $scope.roleFilter = function (user) {
    // show only matching role
    $scope.showAddUserButton = true;
    if ($scope.userView == "Staff" || $scope.userView == "Customer") {
      $scope.showAddUserButton = false;
    }
    return user.role_name === $scope.userView;

  };

});