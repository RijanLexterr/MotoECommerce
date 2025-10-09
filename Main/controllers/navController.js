app.controller("NavController", function ($scope, $http, $location, $rootScope) {
  // ==========================
  // INIT VARIABLES
  // ==========================
  $scope.Categories = [];
  $scope.pagination = { page: 1, limit: 99999, totalPages: 1 };
  $scope.users = [];
  $scope.isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  $scope.currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;
  $scope.productsOnCart = JSON.parse(sessionStorage.getItem("productsOnCart")) || [];
  $scope.cartCount = $scope.productsOnCart.length;

  if (sessionStorage.getItem('isLoggedIn') === 'true') {
  $rootScope.isLoggedIn = true;
  $scope.isLoggedIn = true;
} else {
  $rootScope.isLoggedIn = false;
  $scope.isLoggedIn = false;
}

if (sessionStorage.getItem('currentUser')) {
  $rootScope.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  $scope.currentUser = $rootScope.currentUser;
} else {
  $rootScope.currentUser = null;
  $scope.currentUser = null;
}

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

  // Pagination for cart modal
  $scope.currentPage = 1;
  $scope.itemsPerPage = 3;

  // ==========================
  // CATEGORY FUNCTIONS
  // ==========================
  function getAllCategories(page = 1, limit = 99999) {
    $http
      .get(`../Core/Controller/CategoryController.php?action=readAll&page=${page}&limit=${limit}`)
      .then(
        (res) => {
          $scope.Categories = res.data.data;
          $scope.pagination.page = res.data.page;
          $scope.pagination.limit = res.data.limit;
          $scope.pagination.totalPages = Math.ceil(res.data.total / res.data.limit);
        },
        (err) => console.error("Error fetching categories:", err)
      );
  }

  // Auto-load categories
  getAllCategories();

  // ==========================
  // AUTHENTICATION
  // ==========================
  $scope.login = function () {
    $http
      .post("../Core/Controller/Login/login.php", {
        email: $scope.username,
        password: $scope.password,
      })
      .then((res) => {
        if (res.data.status === "success") {
          $scope.isLoggedIn = true;
          $scope.currentUser = res.data.user;

          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("currentUser", JSON.stringify(res.data.user));

          $scope.$emit("isLoggedIn", res.data.user);
          $("#loginModal").modal("hide");
        } else {
          $scope.error = res.data.message;
        }
      });
  };

$scope.logout = function () {
    $http.post('../Core/Controller/Login/logout.php').then(function () {
      $scope.isLoggedIn = false;
      $scope.currentUser = '';
      $rootScope.isLoggedIn = false;
      $rootScope.currentUser = '';
      sessionStorage.clear();
      // $location.path('/login');
    });
  };

  // ==========================
  // USER MANAGEMENT
  // ==========================
  class User {
    constructor(id = 0, name = "", email = "", password = "", role = "") {
      this.id = id;
      this.name = name;
      this.email = email;
      this.password = password;
      this.role_id = role;
    }
  }

  function clearError() {
    $scope.nameHasError = false;
    $scope.emailHasError = false;
    $scope.passwordHasError = false;
    $scope.confirmPasswordHasError = false;
  }

  $scope.updateUserFields = function (id, name, email, password, confirmPassword) {
    clearError();
    $scope.userId = id;
    $scope.name = name;
    $scope.email = email;
    $scope.password = password;
    $scope.confirmPassword = confirmPassword;
  };

  $scope.validateName = () => ($scope.nameHasError = !$scope.name);

  $scope.validateEmail = function () {
    $scope.emailHasError = !$scope.email;
    $scope.emailError = "Email is required.";

    if ($scope.email) {
      $http
        .get("../Core/Controller/UserController.php?action=getUserByEmail&email=" + $scope.email)
        .then(
          (res) => {
            $scope.emailHasError = res.data.isExisting;
            $scope.emailError = "Email already exists.";
          },
          (err) => console.error("Error validating email:", err)
        );
    }
  };

  $scope.validatePassword = () => ($scope.passwordHasError = !$scope.password);

  $scope.validateConfirmPassword = function () {
    $scope.confirmPasswordHasError =
      !$scope.confirmPassword || $scope.confirmPassword !== $scope.password;
    $scope.confirmPasswordError = !$scope.confirmPassword
      ? "Confirm password is required."
      : "Passwords do not match.";
  };

  $scope.submit = function (id) {
    $scope.validateName();
    if (!id) $scope.validateEmail();
    $scope.validatePassword();
    $scope.validateConfirmPassword();

    let isValid =
      !$scope.nameHasError &&
      !$scope.emailHasError &&
      !$scope.passwordHasError &&
      !$scope.confirmPasswordHasError;

    if (isValid) {
      let user = new User(id, $scope.name, $scope.email, $scope.password, $scope.role.role_id);
      if (!id) createUser(user);
      else updateUser(user);
    }
  };

  function createUser(user) {
    $http.post("../Core/Controller/UserController.php?action=create", user).then(
      (res) => {
        if (res.data.status === "success") {
          $("#userCreateModal").modal("hide");
          $scope.updateUserFields();
        }
      },
      (err) => console.error("Error creating user:", err)
    );
  }

  function getStaffRole() {
    $http.get("../Core/Controller/UserController.php?action=readAllRoles").then(
      (res) => {
        $scope.roles = res.data;
        $scope.role = $scope.roles.find((r) => r.name === "Staff");
      },
      (err) => console.error("Error fetching roles:", err)
    );
  }

  $scope.registerOnClick = () => getStaffRole();

  // ==========================
  // CART MANAGEMENT
  // ==========================
  $rootScope.$on("productsOnCart", function (event, data) {
    $scope.productsOnCart = data;
    $scope.cartCount = data.length;
    sessionStorage.setItem("productsOnCart", JSON.stringify(data));
  });

  $scope.increaseQty = (item) => item.count++;
  $scope.decreaseQty = (item) => (item.count > 1 ? item.count-- : null);

  $scope.removeItem = function (item) {
    let index = $scope.productsOnCart.indexOf(item);
    if (index !== -1) {
      $scope.productsOnCart.splice(index, 1);
      $scope.cartCount = $scope.productsOnCart.length;
    }
  };

  $scope.getTotal = function () {
    return ($scope.productsOnCart || []).reduce((sum, item) => {
      let price =
        item.details?.price || item.id?.price || 0;
      let count = item.count || 0;
      return sum + (parseFloat(price) * count);
    }, 0);
  };


  // Pagination helpers
  $scope.paginatedItems = () => {
    let start = ($scope.currentPage - 1) * $scope.itemsPerPage;
    return $scope.productsOnCart.slice(start, start + $scope.itemsPerPage);
  };

  $scope.totalPages = () => Math.ceil($scope.productsOnCart.length / $scope.itemsPerPage);

  $scope.changePage = (page) => {
    if (page >= 1 && page <= $scope.totalPages()) $scope.currentPage = page;
  };

  $scope.signupOnClick = function() {
    sessionStorage.setItem('redirectAfterLogin', $location.path());
    $location.path('/signup');
  }

  $scope.openModal = function(modalId) {
  $(modalId).modal('show');
};

$scope.isLoginPage = function() {
   return $location.path() === '/login' || $location.path() === '/signup';
};

$scope.signupOnClick = function () {
  // Close the modal with ID 'loginModal'
  $('#loginModal').modal('hide');

  // Redirect to the signup page
  $location.path('/signup');

};

$scope.menuVisible = false;

$scope.toggleMenu = function () {
  $scope.menuVisible = !$scope.menuVisible;
};



});
