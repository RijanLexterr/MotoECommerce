

app.controller("BrandController", function ($scope, $http) {
	$scope.searchQuery = "";
	$scope.brandlist = [];
	$scope.brand = {};
	$scope.brandIdForDelete;
	$scope.brandNameForDelete;
	$scope.nameError;

	$scope.pageSize = 5;
	$scope.pagination = {
		page: 1,
		totalPages: 1
	};

	function getAllBrands(page = 1, limit = $scope.pageSize) {
		$http.get(`../Core/Controller/BrandController.php?action=readAll&page=${page}&limit=${limit}`)
			.then(function (response) {
				$scope.brandlist = response.data.data;
				$scope.pagination.page = response.data.page;
				$scope.pagination.limit = response.data.limit;
				$scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
			}, function (error) {
				console.error("Error fetching data:", error);
			});
	};

	// Initial load
	getAllBrands();

	// Pagination controls
	$scope.loadTransactions = function (page) {
		getAllBrands(page, $scope.pageSize);
	};

	// Page size change
	$scope.changePageSize = function () {
		getAllBrands(1, $scope.pageSize); // Reset to page 1
	};

	$scope.updateBrandFields = function (id = null, name = null) {
		clearError();
		$scope.brand.brand_id = id;
		$scope.brand.name = name;
	}

	function clearError() {
		$scope.nameHasError = false;
	}

	$scope.validateName = function () {
		$scope.nameHasError = !$scope.brand.name
	}

	$scope.validateName = function () {
		$scope.nameHasError = !$scope.brand.name
		$scope.nameError = "Brand Name is required."

		if ($scope.brand.name) {
			$http.get("../Core/Controller/BrandController.php?action=getByBrandName&brand_name=" + $scope.brand.name + "&id=" + $scope.brand.brand_id)
				.then(function (response) {
					$scope.nameHasError = response.data.isExisting;
					$scope.nameError = "Brand Name already exist."
				}, function (error) {
					console.error("Error fetching data:", error);
				});
		}

	}

	$scope.submit = function () {
		$scope.validateName();
		let isValid = (!$scope.nameHasError)

		if (isValid) {
			if (!$scope.brand.brand_id) {
				createBrand()
			}
			else {
				updateBrand()
			}
		}
	}

	function createBrand() {
		$http.post("../Core/Controller/BrandController.php?action=createbrand", $scope.brand)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#BrandCreateModal').modal('hide');
					$scope.updateBrandFields();
					getAllBrands();
				}

			}, function (error) {
				console.error("Error fetching data:", error);
			});
	}

	function updateBrand() {
		$http.post("../Core/Controller/BrandController.php?action=updatebrand&id=" + $scope.brand.brand_id, $scope.brand)
			.then(function (response) {

				if (response.data.status == "success") {
					$('#BrandCreateModal').modal('hide');
					$scope.updateBrandFields();
					getAllBrands();
				}

			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}

	$scope.updateBrandOnClick = function (Brand) {
		$scope.brand = angular.copy(Brand);
	}

	$scope.deleteBrandOnClick = function (Brand) {
		$scope.brand = angular.copy(Brand);
		$scope.brandIdForDelete = $scope.brand.brand_id;
		$scope.brandNameForDelete = $scope.brand.name;
	}

	$scope.deleteBrandById = function () {
		$http.post("../Core/Controller/BrandController.php?action=deletebrand&id=" + parseInt($scope.brandIdForDelete))
			.then(function (response) {
				if (response.data.status == "success") {
					$('#deleteBrandConfirmationModal').modal('hide');
					getAllBrands();
				}
			}, function (error) {
				console.error("Error fetching brand:", error);
			});
	}


});
