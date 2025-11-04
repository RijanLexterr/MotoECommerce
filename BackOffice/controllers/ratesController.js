app.controller("RatesController", function($scope, $http, $routeParams) {

    // Get the view param or default to 'super_admin'
    $scope.userView = $routeParams.view || "List";

    // If route param missing, update URL automatically
    if (!$routeParams.view) {
        $location.path("/rates/List");  
        return; // stop here so it doesn’t call the API twice
    }

    $scope.searchQuery = "";
	$scope.munilist = [];
	$scope.bgrylist = [];
    $scope.pageSize = 5;
	$scope.pagination = {
		page: 1,
		totalPages: 1
	};

    getListBasedOnView();

    function getListBasedOnView(page = 1, limit = $scope.pageSize)
    {
        if ($scope.userView === "Municipality")
        {
            $http.get(`../Core/Controller/UserShippingDetailsController.php?action=getAllMunicipalities&page=${page}&limit=${limit}`)
			.then(function (response) {
				$scope.munilist = response.data.data;
				$scope.pagination.page = response.data.page;
				$scope.pagination.limit = response.data.limit;
				$scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
			}, function (error) {
				console.error("Error fetching data:", error);
			});
        }
        else
        {
            $http.get(`../Core/Controller/UserShippingDetailsController.php?action=readAllMunicipalities`)
			.then(function (response) {
				$scope.muniAlllist = response.data.data;
			}, function (error) {
				console.error("Error fetching data:", error);
			});

            $http.get(`../Core/Controller/UserShippingDetailsController.php?action=getAllBrgyWithRates&page=${page}&limit=${limit}`)
			.then(function (response) {
				$scope.bgrylist = response.data.data;
				$scope.pagination.page = response.data.page;
				$scope.pagination.limit = response.data.limit;
				$scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
			}, function (error) {
				console.error("Error fetching data:", error);
			});
        }
    }

    $scope.deleteMuniById = function () {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=deleteMunicipality&id=" + parseInt($scope.muniIdForDelete))
			.then(function (response) {
				if (response.data.status == "success") {
					$('#deleteMuniConfirmationModal').modal('hide');
					getListBasedOnView();
				}
			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}

     $scope.deleteBrgyById = function () {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=deleteBarangay&id=" + parseInt($scope.brgyIdForDelete))
			.then(function (response) {
				if (response.data.status == "success") {
					$('#deleteBrgyConfirmationModal').modal('hide');
					getListBasedOnView();
				}
			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}

    $scope.updateMuniOnClick = function (Muni) {
		$scope.muni = angular.copy(Muni);
	}

    $scope.updateBrgyOnClick = function (Brgy) {
		$scope.brgy = angular.copy(Brgy);
	}

	$scope.deleteMuniOnClick = function (Muni) {
		$scope.muni = angular.copy(Muni);
		$scope.muniIdForDelete = $scope.muni.Muni_ID;
		$scope.muniNameForDelete = $scope.muni.Muni_Name;
	}

    $scope.deleteBrgyOnClick = function (Brgy) {
		$scope.brgy = angular.copy(Brgy);
		$scope.brgyIdForDelete = $scope.brgy.Brgy_ID;
		$scope.brgyNameForDelete = $scope.brgy.Brgy_Name;
	}

    $scope.submit = function () {
		$scope.validateName();
		let isValid = (!$scope.nameHasError)

		if (isValid) {
			if (!$scope.muni.Muni_ID) {
				createMunicipality();
			}
			else {
				updateMunicipality();
			}
		}
	}

	function createMunicipality() {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=createMunicipality", $scope.muni)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#MuniCreateModal').modal('hide');
					$scope.updateMuniFields();
					getListBasedOnView();
				}

			}, function (error) {
				console.error("Error fetching data:", error);
			});
	}

	function updateMunicipality() {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=updateMunicipality&id=" + $scope.muni.Muni_ID, $scope.muni)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#MuniCreateModal').modal('hide');
					$scope.updateMuniFields();
					getListBasedOnView();
				}

			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}

    function createBarangay() {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=createBarangay", $scope.brgy)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#BrgyCreateModal').modal('hide');
					$scope.updateBrgyFields();
					getListBasedOnView();
				}

			}, function (error) {
				console.error("Error fetching data:", error);
			});
	}

	function updateBarangay() {
		$http.post("../Core/Controller/UserShippingDetailsController.php?action=updateBarangay&id=" + $scope.brgy.Brgy_ID, $scope.brgy)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#BrgyCreateModal').modal('hide');
					$scope.updateBrgyFields();
					getListBasedOnView();
				}

			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}

    $scope.updateMuniFields = function (id = null, name = null) {
		clearError();
		$scope.muni.Muni_ID = id;
		$scope.muni.Muni_Name = name;
	}

    $scope.updateBrgyFields = function (id = null, name = null, muniid = null, rates = null) {
		clearBrgyError();
		$scope.brgy.Brgy_ID = id;
		$scope.brgy.Brgy_Name = name;
		$scope.brgy.Muni_ID = muniid;
		$scope.brgy.Rates = rates;
	}

    function clearError() {
		$scope.nameHasError = false;
	}

    function clearBrgyError() {
		$scope.nameBrgyHasError = false;
        $scope.priceHasError = false;
        $scope.selectedMuniIdHasError = false;
	}

    $scope.validateMunicipality = function () {
		$scope.selectedMuniIdHasError = !$scope.brgy.Muni_ID;
	}

    $scope.validateName = function () {
		$scope.nameHasError = !$scope.muni.Muni_Name;
		$scope.nameError = "Municipality Name is required."

		if ($scope.muni.Muni_Name) {
			$http.get("../Core/Controller/UserShippingDetailsController.php?action=getByMunicipalityName&muni_name=" + $scope.muni.Muni_Name + "&id=" + $scope.muni.Muni_ID)
				.then(function (response) {
					$scope.nameHasError = response.data.isExisting;
					$scope.nameError = "Municipality Name already exist."
				}, function (error) {
					console.error("Error fetching data:", error);
				});
		}

	}

    $scope.validateBrgyName = function () {
		$scope.nameBrgyHasError = !$scope.brgy.Brgy_Name;
		$scope.nameBrgyError = "Barangay Name is required."

		if ($scope.brgy.Brgy_Name) {
			$http.get("../Core/Controller/UserShippingDetailsController.php?action=getByBarangayName&brgy_name=" + $scope.brgy.Brgy_Name + "&id=" + $scope.brgy.Brgy_ID)
				.then(function (response) {
					$scope.nameBrgyHasError = response.data.isExisting;
					$scope.nameBrgyError = "Barangay Name already exist."
				}, function (error) {
					console.error("Error fetching data:", error);
				});
		}
	}

    $scope.validatePrice = function () {
		$scope.priceHasError = !$scope.brgy.Rates;
		$scope.priceError = "Price is required.";

		if ($scope.brgy.Rates) {
			const input = document.getElementById('decimalInput').value;
			// Regular expression for a decimal number (optional negative sign, digits, optional decimal point, optional digits after decimal)
			const regex = /^-?\d*\.?\d+$/;

			if (regex.test(input)) {
				const price = Number(input);
				if (price <= 0) {
					$scope.priceError = "Valid price is required.";
					$scope.priceHasError = 1;
				}
				// Further processing or form submission
			} else {
				$scope.priceError = "Invalid decimal number. Please enter a valid format.";
				$scope.priceHasError = 1;
			}
		}
	}

    $scope.submitBrgy = function () {
		$scope.validateBrgyName();
		$scope.validatePrice();
		$scope.validateMunicipality();
		let isValid = (!$scope.nameBrgyHasError && !$scope.priceHasError && !$scope.selectedMuniIdHasError)

		if (isValid) {
			if (!$scope.brgy.Brgy_ID) {
				createBarangay();
			}
			else {
				updateBarangay();
			}
		}
	}


    // Pagination controls
	$scope.loadTransactions = function (page) {
		getListBasedOnView(page, $scope.pageSize);
	};

    // Page size change
	$scope.changePageSize = function () {
		getListBasedOnView(1, $scope.pageSize); // Reset to page 1
	};




});