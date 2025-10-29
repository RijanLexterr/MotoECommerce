var app = angular.module("myApp", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider
    .when("/login", {
      templateUrl: "view/login.html",
      controller: "LoginController"
    })
    .when("/users/:view", {
      templateUrl: "view/user.html",
      controller: "UserController",
      resolve: {
        auth: checkAuth
      }
    }).when("/brands", {
      templateUrl: "view/brand.html",
      controller: "BrandController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/transactions/:productId", {
      templateUrl: "view/inventoryTransByPrdoducts.html",
      controller: "InventoryTransactionsController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/products", {
      templateUrl: "view/product.html",
      controller: "ProductController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/", {
      templateUrl: "view/dashboard.html",
      controller: "DashboardController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/inventory", {
      templateUrl: "view/inventory.html",
      controller: "InventoryController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/category", {
      templateUrl: "view/category.html",
      controller: "CategoryController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/paymentType", {
      templateUrl: "view/paymentType.html",
      controller: "PaymentTypeController",
      resolve: {
        auth: checkAuth
      }
    })
    .when("/orders", {
      templateUrl: "view/order.html",
      controller: "OrderController",
      resolve: {
        auth: checkAuth
      }
    })
    .otherwise({
      redirectTo: "/login"
    });
});

var checkAuth = function ($q, $location) {
  var deferred = $q.defer();

  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    deferred.resolve();
  } else {
    deferred.reject();
    $location.path('/login');
  }

  return deferred.promise;
};

checkAuth.$inject = ['$q', '$location'];
