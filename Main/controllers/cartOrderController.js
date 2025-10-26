app.controller("CartOrderController", function($scope, $http, $rootScope, $location, $timeout) {

  // $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  // $scope.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  $scope.addedtoCart = [];
  $scope.userWithAddresses = [];

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

 $rootScope.$on("isLoggedIn", function(event, status) {
    $scope.isLoggedIn = status;
  });

  // Listen for currentUser event
  $rootScope.$on("currentUser", function(event, user) {
    $scope.currentUser = user;
    loadUserInfo(); // Optional: if you want to trigger logic here too
  });

  init();

  function init() {
    loadCart();
    loadUserInfo();
  }

  // 🛒 Load cart items
  function loadCart() {
    console.log("Loading cart from sessionStorage...");

    const productsOnCart = JSON.parse(sessionStorage.getItem('productsOnCart')) || [];

    if (productsOnCart.length === 0) {
      console.warn("No products found in sessionStorage.");
      return;
    }

    // Clear first
    $scope.addedtoCart = [];

    productsOnCart.forEach((product, index) => {
      console.log(product );
      $http.get("../Core/Controller/ProductController.php?action=readOne&id=" + parseInt(product.id))
        .then((response) => {
          const data = response.data;
          if (!data || !data.name) {
            console.error("Invalid product data:", data);
            return;
          }

          const item = {
            id: product.id,
            name: data.name,
            price: parseFloat(data.price) || 0,
            quantity: product.count,
            stock: data.stock || 0,
            stockError: false
          };

          // Safely update view inside Angular digest cycle
          $timeout(() => {
            $scope.addedtoCart.push(item);
          });
        })
        .catch((err) => {
          console.error("Error fetching product:", err);
        });
    });
  }

  // 👤 Load addresses
  function loadUserInfo() {
    
    $scope.userWithAddresses = [];
    if (!$scope.isLoggedIn || !$scope.currentUser?.user_id) return;

    const userId = parseInt($scope.currentUser.user_id);
    $http.get("../Core/Controller/UserShippingDetailsController.php?action=getByUserId&user_id=" + userId)
      .then((response) => {
        if (response.data.status === "success") {          
          $scope.userWithAddresses = response.data.userAddress || [];
          console.log("User addresses:", $scope.userWithAddresses);
                  
          if ($scope.userWithAddresses[parseInt($scope.currentUser.user_id)].Addresses.length > 0) {
                let user = $scope.userWithAddresses[parseInt($scope.currentUser.user_id)];
                let defaultAddress = user.Addresses.find(a => a.IsDefault === 1);

                if (defaultAddress) {
                  $scope.selectedAddressId = defaultAddress.ShippingId;
                }
          }
        }
      })
      .catch((err) => console.error("Error loading user addresses:", err));
  }

  // 📦 Quantity controls
  $scope.increaseQty = function(item) {
    if (item.quantity < item.stock) item.quantity++;
  };

  $scope.decreaseQty = function(item) {
    if (item.quantity > 1) item.quantity--;
  };

  // 🧮 Total
  $scope.getTotal = function() {
    return $scope.addedtoCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // 🧾 Place order
  $scope.proceedCheckOut = function() {
    if (!$scope.isLoggedIn) {
      sessionStorage.setItem('redirectAfterLogin', $location.path());
      $location.path('/login');
      return;
    }

    if ($scope.addedtoCart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const userId = parseInt($scope.currentUser.user_id);
    const orderData = {
      order_id: -1,
      user_id: userId,
      user_shipping_id: $scope.selectedAddressId || null,
      total: $scope.getTotal(),
      items: $scope.addedtoCart
    };

    $http.post("../Core/Controller/OrderController.php?action=create", orderData)
      .then((response) => {
        if (response.data.status === "success") {
          alert("Order placed successfully!");
          sessionStorage.setItem('productsOnCart', JSON.stringify([]));
          $location.path('/result').search({ status: 'success', orderId: response.data.created_order_id });
        } else {
          alert("Order failed: " + response.data.message);
        }
      })
      .catch((err) => {
        console.error("Order submission failed:", err);
        alert("Error placing order.");
      });
  };
});
