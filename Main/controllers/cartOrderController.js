app.controller("CartOrderController", function ($scope, $http, $rootScope, $location, $timeout) {

  // $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  // $scope.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  $scope.addedtoCart = [];
  $scope.userWithAddresses = [];
  $scope.paymentType = 0;
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

  $rootScope.$on("isLoggedIn", function (event, status) {
    $scope.isLoggedIn = status;
  });

  // Listen for currentUser event
  $rootScope.$on("currentUser", function (event, user) {
    $scope.currentUser = user;
    loadUserInfo(); // Optional: if you want to trigger logic here too
  });

  init();

  function init() {
    loadCart();
    loadUserInfo();
  }

  $scope.img_location = '';



  // 🛒 Load cart items
  function loadCart() {
    console.log("Loading cart from sessionStorage...");

    const productsOnCart = JSON.parse(sessionStorage.getItem('productsOnCart')) || [];

    if (productsOnCart.length === 0) {
      console.warn("No products found in sessionStorage.");
      return;
    }
    $scope.isShowImage = false;
    $scope.showImage = function (value) {
      console.log(value);
      if (value == 2) {
        $scope.isShowImage = true;

        $timeout(function () {
          const imageInput = document.getElementById('imageInput');
          const previewImage = document.getElementById('previewImage');

          if (imageInput) {
            imageInput.addEventListener('change', function (event) {
              const file = event.target.files[0];
              if (file) {
                const imageURL = URL.createObjectURL(file);
                previewImage.src = imageURL;
                previewImage.style.display = 'block';
              } else {
                previewImage.src = '';
                previewImage.style.display = 'none';
              }
            });
          }
        }, 0);
      }
    };

    // Clear first
    $scope.addedtoCart = [];

    productsOnCart.forEach((product, index) => {

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
              $scope.shipRates = defaultAddress.Rates;
              console.log('Ship Rates: ', $scope.shipRates);
            }
          }
        }
      })
      .catch((err) => console.error("Error loading user addresses:", err));
  }

  $scope.onAddressChange = function(selectedId) {
    console.log('New selected address:', selectedId);
    $scope.selectedAddressId = selectedId;

    let user = $scope.userWithAddresses[parseInt($scope.currentUser.user_id)];
    let shipDetail = user.Addresses.find(a => a.ShippingId === selectedId);

    $scope.shipRates = shipDetail.Rates;
    console.log('Ship Rates: ', $scope.shipRates);
  };

  // 📦 Quantity controls
  $scope.increaseQty = function (item) {
    if (item.quantity < item.stock) item.quantity++;
  };

  $scope.decreaseQty = function (item) {
    if (item.quantity > 1) item.quantity--;
  };

  // 🧮 Total
  $scope.getTotal = function () {
    if (!$scope.addedtoCart || !$scope.addedtoCart.length) return 0;

    let totalItems = $scope.addedtoCart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const shipping = parseFloat($scope.shipRates) || 0;
    return totalItems + shipping;
  };

  $scope.proceedCheckOut = function () {
    // ✅ Check if user is logged in
    if (!$scope.isLoggedIn) {
      sessionStorage.setItem('redirectAfterLogin', $location.path());
      $location.path('/login');
      return;
    }

    // ✅ Validate payment type
    if (!$scope.paymentType) {
      alert("Please select payment type!");
      return;
    }

    // ✅ Validate cart contents
    if ($scope.addedtoCart.length === 0) {
      alert("Your cart is empty!");
      return;
    }


    const fileInput = document.getElementById('imageInput');
    const files = fileInput ? fileInput.files : [];
    let uploadedFile = null;

    // If payment type is Gcash/Maya (2), make image required
    if ($scope.paymentType == 2) {
      if (!files || files.length === 0) {
        alert('Payment transaction proof is required!');
        return;
      }
    }

    // Validate file type if uploaded
    if (files && files.length > 0) {
      uploadedFile = files[0];

      if (!uploadedFile.type.startsWith('image/')) {
        alert('It is not an image file.');
        return;
      }
    }


    // ✅ Build order data
    const userId = parseInt($scope.currentUser.user_id);
    const orderData = {
      order_id: -1,
      user_id: userId,
      user_shipping_id: $scope.selectedAddressId || null,
      total: $scope.getTotal(),
      items: $scope.addedtoCart,
      payment_type_id: $scope.paymentType
    };

    // ✅ Create the order first
    $http.post("../Core/Controller/OrderController.php?action=create", orderData)
      .then(function (response) {
        if (response.data.status === "success") {

          // ✅ Clear cart
          sessionStorage.setItem('productsOnCart', JSON.stringify([]));



          // ✅ Upload payment proof image if provided
          if (uploadedFile) {
            const formData = new FormData();
            formData.append('order_id', response.data.created_order_id);
            formData.append('image', uploadedFile); // ✅ Include the actual file
            formData.append('image_location', "");

            $http.post('../Core/Controller/OrderController.php?action=uploadImage', formData, {
              headers: { 'Content-Type': undefined }
            }).then(function (res) {
              console.log('Upload success:', res.data);
            }, function (error) {
              console.error('Upload failed:', error);
            });
          }

          //Recalculate stock
          $http.get("../Core/Controller/OrderController.php?action=readAllItems&id=" + response.data.created_order_id)
            .then(function (response) {
              angular.forEach(response.data, function (item) {
                $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${item.product_id}`)
                  .then(function (resp) {
                    console.log("Item Recalculated!");
                  })
                  .catch(err => console.error(err));
              });
            }).catch(err => console.error(err));

          // ✅ Redirect user
          $location.path('/result').search({
            status: 'success',
            orderId: response.data.created_order_id
          });
        } else {
          alert("Order failed: " + response.data.message);
        }
      }, function (error) {
        console.error("Order submission failed:", error);
        alert("Error placing order.");
      });
  };

});
