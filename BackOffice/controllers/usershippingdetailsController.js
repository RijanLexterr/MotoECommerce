

app.controller("UserShippingDetailsController", function($scope, $http) {	
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
		  $scope.usershippingdetails = response.data.data;
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