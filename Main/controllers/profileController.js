app.controller('ProfileController', function ($scope, $http, $location, $rootScope) {

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
    if (!$scope.isLoggedIn) {
      $location.path('/login');
      return;
    }
  });
  $scope.successMessage = null;
  let currentUser = $scope.currentUser;

  function getUserById() {
    if (currentUser && currentUser.user_id) {
      $http.get(`../Core/Controller/UserController.php?action=readOne&id=${currentUser.user_id}`)
        .then(function (response) {
          $scope.currentUser = response.data.user;
          $scope.actualOldPassword = $scope.currentUser.password;
          readAll();

          $scope.user = {
            name: $scope.currentUser.name,
            email: $scope.currentUser.email,
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          };

          console.log($scope.user);
        })
        .catch(function (error) {
          console.error("Error fetching user details:", error);
        });
    }
  }

  getUserById();

  $scope.isChangePassword = false;
  $scope.showErrors = false;

  $scope.toggleChangePassword = function () {
    $scope.isChangePassword = true;
  };

  $scope.cancelChangePassword = function () {
    $scope.isChangePassword = false;
    $scope.user.oldPassword = '';
    $scope.user.newPassword = '';
    $scope.user.confirmPassword = '';
    $scope.showErrors = false;
  };

  $scope.onsubmit = function () {
    $scope.showErrors = true;

    const isBasicValid = $scope.user.name && $scope.user.email;
    if (isBasicValid) getUserByEmail();
  };

  $scope.submitPassword = function () {
    $scope.showErrors = true;

    const validFields = $scope.user.oldPassword && $scope.user.newPassword && $scope.user.confirmPassword;
    const oldPasswordMatches = $scope.user.oldPassword === $scope.currentUser.password;
    const newPasswordsMatch = $scope.user.newPassword === $scope.user.confirmPassword;

    if (!validFields) return;
    if (!oldPasswordMatches) return alert('Old password is incorrect.');
    if (!newPasswordsMatch) return alert('New password and confirm password do not match.');

    updateUserPassword();
  };

  if (!$scope.isLoggedIn) {
    $location.path('/login');
    return;
  }

  $scope.activeView = 'profile';
  $scope.activeTab = 'toShip';

  function getUserByEmail() {
    $http.get(`../Core/Controller/UserController.php?action=getUserByEmail&email=${currentUser.email}`)
      .then(function (response) {
        if (response.data.user.user_id == currentUser.user_id) {
          updateUser();
        } else {
          alert("Email already exist!");
        }
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  function updateUserPassword() {
    let request = {
      name: $scope.currentUser.name,
      email: $scope.currentUser.email,
      password: $scope.user.newPassword || $scope.currentUser.password,
    };

    $http.post(`../Core/Controller/UserController.php?action=updateUserProfile&id=${parseInt($scope.currentUser.user_id)}`, request)
      .then(function (response) {
        if (response.data.status == "success") {

          $scope.cancelChangePassword();
          document.querySelector('#passwordModal .close').click();
          getUserById();
          alert('Password updated successfully!');
        }
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  function updateUser() {
    let request = {
      name: $scope.user.name,
      email: $scope.user.email,
      password: $scope.currentUser.password,
    };

    $http.post(`../Core/Controller/UserController.php?action=updateUserProfile&id=${parseInt($scope.currentUser.user_id)}`, request)
      .then(function (response) {
        if (response.data.status == "success") {
          alert("Your profile has been successfully updated.");
          getUserById();
        }
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  function readAll() {
    if (!$scope.currentUser || !$scope.currentUser.user_id) {
      console.warn("User not loaded yet, skipping readAll()");
      return;
    }

    $http.get(`../Core/Controller/OrderController.php?action=readAllItemsByUser&id=${$scope.currentUser.user_id}`)
      .then(function (response) {
        const allOrders = response.data && response.data.data ? response.data.data : [];

        if (!Array.isArray(allOrders)) {
          console.warn("Expected an array of orders, got:", allOrders);
          $scope.toShipOrders = [];
          $scope.toReceiveOrders = [];
          $scope.completedOrders = [];
          return;
        }

        $scope.toShipOrders = allOrders.filter(o => o.order_status_name === 'Pending');
        $scope.toReceiveOrders = allOrders.filter(o => o.order_status_name === 'To Ship');
        $scope.completedOrders = allOrders.filter(o => o.order_status_name === 'Paid');
        $scope.orders = allOrders;
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  $scope.getTotal = function (items) {
    return items.reduce(function (sum, item) {
      return sum + parseFloat(item.item_total_amt);
    }, 0);
  };

  $scope.searchQuery = "";
  $scope.usershippingdetails = [];
  $scope.usershippingdetail = {};
  $scope.IdForDelete;
  $scope.nameError;
  $scope.user_id;
  $scope.pageSize = 5;

  $scope.pagination = {
    page: 1,
    totalPages: 1
  };

  function getAllUserShippingDetails(page = 1, limit = $scope.pageSize) {
    $http.get(`../Core/Controller/UserShippingDetailsController.php?action=readAll&page=${page}&limit=${limit}`)
      .then(function (response) {
        let userID = $scope.currentUser.user_id;
        $scope.usershippingdetails = (response.data.data || []).filter(o => o.user_id === userID.toString());
        $scope.pagination.page = response.data.page;
        $scope.pagination.limit = response.data.limit;
        $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  getAllUserShippingDetails();

  $scope.loadTransactions = function (page) {
    getAllUserShippingDetails(page, $scope.pageSize);
  };

  $scope.changePageSize = function () {
    getAllUserShippingDetails(1, $scope.pageSize);
  };

  $scope.updateUserShippingDetailFields = function () {
    clearError();
    $scope.usershippingdetail = {
      user_shipping_id: null,
      fullname: "",
      phonenumber: "",
      address: "",
      postalcode: "",
      user_id: null,
      is_default_address: null
    };
  };

  function clearError() {
    $scope.nameHasError = false;
    $scope.PhoneNumberHasError = false;
    $scope.AddressHasError = false;
    $scope.PostalCodeHasError = false;
  }

  $scope.validateName = function () {
    $scope.usershippingdetail.user_id = $scope.currentUser.user_id;

    if ($scope.usershippingdetail.fullname) {
      $http.get(`../Core/Controller/UserShippingDetailsController.php?action=getByFullName&full_name=${$scope.usershippingdetail.fullname}&user_id=${$scope.usershippingdetail.user_id}&user_shipping_id=${$scope.usershippingdetail.user_shipping_id}`)
        .then(function (response) {
          $scope.nameHasError = response.data.isExisting;
          $scope.nameError = "Full Name already exist.";
        })
        .catch(function (error) {
          console.error("Error fetching data:", error);
        });
    } else {
      $scope.nameHasError = true;
      $scope.nameError = "Full Name is required.";
    }
  };

  $scope.validatePhoneNumber = function () {
    $scope.PhoneNumberHasError = !$scope.usershippingdetail.phonenumber;
  };

  $scope.validateAddress = function () {
    $scope.AddressHasError = !$scope.usershippingdetail.address;
  };

  $scope.validatePostalCode = function () {
    $scope.PostalCodeHasError = !$scope.usershippingdetail.postalcode;
  };

  $scope.submit = function () {
    $scope.validateName();
    $scope.validatePhoneNumber();
    $scope.validateAddress();
    $scope.validatePostalCode();

    $scope.usershippingdetail.user_id = $scope.currentUser.user_id;

    let isValid = (!$scope.nameHasError && !$scope.PhoneNumberHasError && !$scope.AddressHasError && !$scope.PostalCodeHasError);

    if (isValid) {
      if (!$scope.usershippingdetail.user_shipping_id) {
        createUserShippingDetails();
      } else {
        updateUserShippingDetails();
      }
    }


  };

  function createUserShippingDetails() {
    $scope.usershippingdetail.user_id = $scope.currentUser.user_id;

    $http.post("../Core/Controller/UserShippingDetailsController.php?action=create", $scope.usershippingdetail)
      .then(function (response) {
        if (response.data.status == "success") {
          $('#UserShippingDetailsCreateModal').modal('hide');
          $scope.updateUserShippingDetailFields();
          getAllUserShippingDetails();
        }
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  }

  function updateUserShippingDetails() {
    $http.post(`../Core/Controller/UserShippingDetailsController.php?action=update&id=${$scope.usershippingdetail.user_shipping_id}`, $scope.usershippingdetail)
      .then(function (response) {
        if (response.data.status == "success") {
          $('#UserShippingDetailsCreateModal').modal('hide');
          $scope.updateUserShippingDetailFields();
          getAllUserShippingDetails();
        }
      })
      .catch(function (error) {
        console.error("Error fetching User Shipping Details:", error);
      });
  }

  $scope.addUserShippingDetailsOnClick = function () {
    $scope.updateUserShippingDetailFields();
  };

  $scope.updateUserShippingDetailsOnClick = function (UserShippingDetails) {
    $scope.usershippingdetail = angular.copy(UserShippingDetails);
    $scope.usershippingdetail.is_default_address = $scope.usershippingdetail.is_default_address == 1;
  };

  $scope.deleteUserShippingDetailsOnClick = function (UserShippingDetails) {
    $scope.usershippingdetail = angular.copy(UserShippingDetails);
    $scope.IdForDelete = $scope.usershippingdetail.user_shipping_id;
  };

  $scope.deleteUserShippingDetailsById = function () {
    $http.post(`../Core/Controller/UserShippingDetailsController.php?action=delete&id=${parseInt($scope.IdForDelete)}`)
      .then(function (response) {
        if (response.data.status == "success") {
          $('#deleteUserShippingDetailsConfirmationModal').modal('hide');
          getAllUserShippingDetails();
        }
      })
      .catch(function (error) {
        console.error("Error fetching User Shipping Details:", error);
      });
  };


  $scope.isOpen = [];

  $scope.toggleCollapse = function (index, $event) {
    $event.preventDefault();
    $scope.isOpen[index] = !$scope.isOpen[index];
  };
  // Panel open/close state
  $scope.panelState = {
    toShip: {},
    toReceive: {},
    completed: {}, // <-- added completed section
  };

  // Check if panel is open
  $scope.isPanelOpen = function (section, index) {
    return !!$scope.panelState[section][index];
  };

  // Toggle panel (prevent redirect and toggle collapse)
  $scope.togglePanel = function (section, index, $event) {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }

    // Optional: true accordion behavior (only one open per section)
    // $scope.panelState[section] = {};

    $scope.panelState[section][index] = !$scope.panelState[section][index];
  };

  $scope.markAsReceived = function (Order) {
    $http.get("../Core/Controller/OrderController.php?action=tagReceived&id=" + Order.order_id)
      .then(function (response) {
        if (response.data.status === "success") {

          readAll(); // refresh

          // Assuming you stored the user in sessionStorage after login
          let user = JSON.parse(sessionStorage.getItem('currentUser')) || {};

          // Prepare email data
          let emailData = {
            to: user.email, // Send to customer
            subject: `Order #${Order.order_id} - Received Confirmation`,
            body: `
            <h3>Hello ${user.name},</h3>
            <p>We’ve confirmed that your order <b>#${Order.order_id}</b> has been marked as received.</p>
            <p>Thank you for trusting <br><br>Ester Store!</p>
          `
          };

          // Send email
          return $http.post('../Core/Controller/email.php?action=send', emailData);
        }
      })
      .then(function (emailResponse) {
        if (emailResponse) console.log("📧 Email response:", emailResponse.data);
      })
      .catch(function (error) {
        console.error("Error marking as received:", error);
      });
  };

});
