var app = angular.module("main", ["ngRoute"]);

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
   .when("/login", {
      templateUrl: "views/login.html",
      controller: "LoginController"
    })
    .when("/signup", {
      templateUrl: "views/signup.html",
      controller: "SignUpController"
    })
    .when("/home", {
      templateUrl: "views/home.html"
    })
    .when("/", {
      redirectTo: "/home"
    })
    .when("/nav", {
      templateUrl: "views/nav.html",
      controller: "NavController"
    })
    .when("/home", {
      templateUrl: "views/home.html",
      controller: "HomeController"
    })
    // add parameter :categoryId
    .when("/shop/:categoryId?", {
      templateUrl: "views/shop.html",   // fixed here
      controller: "ShopController"
    })
    .when("/productDetails/:productID?", {
      templateUrl: "views/productDetails.html",   // fixed here
      controller: "ProductDetailsController"
    })
    .when("/cart", {
      templateUrl: "views/cart.html",   // fixed here
      controller: "CartOrderController"
    })
    .otherwise({
      redirectTo: "/home"
    });

  // Optional: remove #! from URL
  // $locationProvider.html5Mode(true);
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