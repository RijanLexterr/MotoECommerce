app.controller('ProfileController', function($scope, $http, $location, $rootScope) {

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
  
  $scope.successMessage = null;
  let currentUser = $scope.currentUser;
  function getUserById() {

    if(currentUser) {
      if(currentUser.user_id) {
      $http.get("../Core/Controller/UserController.php?action=readOne&id=" + currentUser.user_id)
            .then(function(response) {                
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
                console.log($scope.user)
       
            })
            .catch(function(error) {
                console.error("Error fetching user details:", error);
            });
    }
    }
    
  }
  getUserById();



    $scope.isChangePassword = false;
    $scope.showErrors = false;

    $scope.toggleChangePassword = function() {
      $scope.isChangePassword = true;
    };

    $scope.cancelChangePassword = function() {
      $scope.isChangePassword = false;
      $scope.user.oldPassword = '';
      $scope.user.newPassword = '';
      $scope.user.confirmPassword = '';
      $scope.showErrors = false;
    };

    $scope.submit = function() {
      $scope.showErrors = true;

      const isBasicValid = $scope.user.name && $scope.user.email;
      if (isBasicValid) {
        getUserByEmail();
        // Add your update logic here
      }
    };

    $scope.submitPassword = function() {
      $scope.showErrors = true;

      const validFields = $scope.user.oldPassword && $scope.user.newPassword && $scope.user.confirmPassword;
      const oldPasswordMatches = $scope.user.oldPassword === $scope.currentUser.password;
      const newPasswordsMatch = $scope.user.newPassword === $scope.user.confirmPassword;

      if (!validFields) return;

      if (!oldPasswordMatches) {
        alert('Old password is incorrect.');
        return;
      }

      if (!newPasswordsMatch) {
        alert('New password and confirm password do not match.');
        return;
      }

      updateUserPassword();

    
    }

  // 🔐 Redirect to login if not logged in
  if (!$scope.isLoggedIn) {
    $location.path('/login');
    return;
  }

  // Default views
  $scope.activeView = 'profile';
  $scope.activeTab = 'toShip';


  function getUserByEmail() {
    $http.get("../Core/Controller/UserController.php?action=getUserByEmail&email=" + currentUser.email)
        .then(function(response) {
          if(response.data.user.user_id == currentUser.user_id) {
            updateUser();
          } else {
            alert("Email already exist!")
          }
        }, function(error) {
          console.error("Error fetching data:", error);
        });
  }



function updateUserPassword() {
      let request = {
        name: $scope.currentUser.name,
        email: $scope.currentUser.email,
        password: $scope.user.newPassword != "" ? $scope.user.newPassword : $scope.currentUser.password,
      }

      $http.post("../Core/Controller/UserController.php?action=updateUserProfile&id=" + parseInt($scope.currentUser.user_id), request)
        .then(function(response) {
          if(response.data.status == "success") {
            alert('Password updated successfully!');
            $scope.cancelChangePassword();
            document.querySelector('#passwordModal .btn-close').click(); // Close modal
             getUserById();
          } 

        }, function(error) {
          console.error("Error fetching data:", error);
        });
    }

    function updateUser() {
      let request = {
        name: $scope.user.name,
        email: $scope.user.email,
        password: $scope.currentUser.password,
      }

      $http.post("../Core/Controller/UserController.php?action=updateUserProfile&id=" + parseInt($scope.currentUser.user_id), request)
        .then(function(response) {
          if(response.data.status == "success") {
            alert("Your profile has been successfully updated.")
             getUserById();
          } 

        }, function(error) {
          console.error("Error fetching data:", error);
        });
    }


     function readAll() {
      let userID = $scope.currentUser.user_id;
    $http.get("../Core/Controller/OrderController.php?action=readAllItemsByUser&id=" + userID )
        .then(function(response) {
          const allOrders = response.data.data;
          $scope.toShipOrders = allOrders.filter(o => o.order_status_name === 'Pending');
          $scope.toReceiveOrders = allOrders.filter(o => o.order_status_name === 'Shipped');
          $scope.completedOrders = allOrders.filter(o => o.order_status_name === 'Paid');

          if(response) {
            $scope.orders = allOrders;
          } else {
            
          }
        }, function(error) {
          console.error("Error fetching data:", error);
        });
  }



  $scope.getTotal = function(items) {
    return items.reduce(function(sum, item) {
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

	$scope.usershippingdetailId = 1; // Set dynamically if needed

	function getAllUserShippingDetails(page = 1, limit = $scope.pageSize) {

		$http.get(`../Core/Controller/UserShippingDetailsController.php?action=readAll&page=${page}&limit=${limit}`)
		.then(function(response) {
      
      let userID = $scope.currentUser.user_id;
		  $scope.usershippingdetails = response.data.data.filter(o => o.user_id === userID.toString());
		  $scope.pagination.page = response.data.page;
		  $scope.pagination.limit = response.data.limit;
		  $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
	};

	// Initial load
	getAllUserShippingDetails();

	// Pagination controls
	$scope.loadTransactions = function(page) {
	  getAllUserShippingDetails(page, $scope.pageSize);
	};

	// Page size change
	$scope.changePageSize = function() {
	  getAllUserShippingDetails(1, $scope.pageSize); // Reset to page 1
	};
	
	$scope.updateUserShippingDetailFields = function() 
	{
		clearError();
		$scope.usershippingdetail.user_shipping_id = null;
		$scope.usershippingdetail.fullname = "";
		$scope.usershippingdetail.phonenumber = "";
		$scope.usershippingdetail.address = "";
		$scope.usershippingdetail.postalcode = "";
		$scope.usershippingdetail.user_id = null;
		$scope.usershippingdetail.is_default_address = null;
	}
  
	function clearError() 
	{
		$scope.nameHasError = false;
		$scope.PhoneNumberHasError = false;
		$scope.AddressHasError = false;
		$scope.PostalCodeHasError = false;
	}
  
	$scope.validateName = function() 
	{
		$scope.usershippingdetail.user_id = $scope.currentUser.user_id;
		
		if($scope.usershippingdetail.fullname) 
		{
			$http.get("../Core/Controller/UserShippingDetailsController.php?action=getByFullName&full_name=" + $scope.usershippingdetail.fullname + "&user_id=" + $scope.usershippingdetail.user_id + "&user_shipping_id=" + $scope.usershippingdetail.user_shipping_id)
			.then(function(response) {
			  $scope.nameHasError = response.data.isExisting;
			  $scope.nameError = "Full Name already exist.";
			}, function(error) {
			  console.error("Error fetching data:", error);
			});
		}
		else
		{
			$scope.nameHasError = !$scope.usershippingdetail.fullname;
			$scope.nameError = "Full Name is required.";
		}
    }
	
	$scope.validatePhoneNumber = function() {
		$scope.PhoneNumberHasError = !$scope.usershippingdetail.phonenumber;
    }
	
	$scope.validateAddress = function() {
		$scope.AddressHasError = !$scope.usershippingdetail.address;
    }

    $scope.validatePostalCode = function() {
      $scope.PostalCodeHasError = !$scope.usershippingdetail.postalcode;
    }
	
	$scope.submit = function() 
	{
		$scope.validateName();
		$scope.validatePhoneNumber();
		$scope.validateAddress();
		$scope.validatePostalCode();
		$scope.usershippingdetail.user_id = $scope.currentUser.user_id;
		
		
		let isValid = (!$scope.nameHasError && !$scope.PhoneNumberHasError && !$scope.AddressHasError && !$scope.PostalCodeHasError)
	  
		if(isValid) 
		{
			if(!$scope.usershippingdetail.user_shipping_id) 
			{
			  createUserShippingDetails();
			} 
			else 
			{
			  updateUserShippingDetails();
			}      
		}
    }


	function createUserShippingDetails() 
	{
		$scope.usershippingdetail.user_id = $scope.currentUser.user_id;
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=create", $scope.usershippingdetail)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#UserShippingDetailsCreateModal').modal('hide');
            $scope.updateUserShippingDetailFields();
            getAllUserShippingDetails();
          } 

        }, function(error) {
          console.error("Error fetching data:", error);
        });
		
    }
	
	
    function updateUserShippingDetails() 
	{
      $http.post("../Core/Controller/UserShippingDetailsController.php?action=update&id=" + $scope.usershippingdetail.user_shipping_id, $scope.usershippingdetail)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#UserShippingDetailsCreateModal').modal('hide');
            $scope.updateUserShippingDetailFields();
            getAllUserShippingDetails();
          } 

        }, function(error) {
          console.error("Error fetching User Shipping Details:", error);
        });
    }
	
	$scope.addUserShippingDetailsOnClick = function() {
		$scope.updateUserShippingDetailFields();
  }
    
    $scope.updateUserShippingDetailsOnClick = function(UserShippingDetails) {
        $scope.usershippingdetail = angular.copy(UserShippingDetails);
		if ($scope.usershippingdetail.is_default_address  == 1)
		{
			$scope.usershippingdetail.is_default_address = true;
		}
		else
		{
			$scope.usershippingdetail.is_default_address = false;
		}
    }
	
	$scope.deleteUserShippingDetailsOnClick = function(UserShippingDetails) {
		$scope.usershippingdetail = angular.copy(UserShippingDetails);
        $scope.IdForDelete = $scope.usershippingdetail.user_shipping_id;
    }
	
  $scope.deleteUserShippingDetailsById = function() {
    $http.post("../Core/Controller/UserShippingDetailsController.php?action=delete&id=" + parseInt($scope.IdForDelete))
      .then(function(response) {
        if(response.data.status == "success") {
          $('#deleteUserShippingDetailsConfirmationModal').modal('hide');
          getAllUserShippingDetails();
        } 
      }, function(error) {
        console.error("Error fetching User Shipping Details:", error);
      });
  }


});
