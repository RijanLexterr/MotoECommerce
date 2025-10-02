

app.controller("ProductController", function($scope, $http) {	
	$scope.searchQuery = "";
	$scope.products = [];
	$scope.product = {};
	$scope.CategoryItems = [];
	$scope.BrandItems = [];
	$scope.IdForDelete;
	$scope.productNameForDelete;
	$scope.nameError;
		
	$scope.pageSize = 5;
	$scope.pagination = {
	  page: 1,
	  totalPages: 1
	};

	$scope.productId = 1; // Set dynamically if needed

  $scope.triggerUpload = function() {
    document.getElementById('imageInput').click();
  };

  $scope.uploadImage = function(files) {
    $scope.formData = new FormData();
    // $scope.formData.append('product_id', $scope.productId);
    $scope.formData.append('image', files[0]);

    // $http.post('../Core/Controller/ProductController.php?action=uploadImage', formData, {
    //   headers: { 'Content-Type': undefined }
    // }).then(function(response) {
    //   console.log('Upload success:', response.data);
    // }, function(error) {
    //   console.error('Upload failed:', error);
    // });
  };

	function getAllProducts(page = 1, limit = $scope.pageSize) {
		$http.get(`../Core/Controller/ProductController.php?action=readAll&page=${page}&limit=${limit}`)
		.then(function(response) {
		  $scope.products = response.data.data;
		  $scope.pagination.page = response.data.page;
		  $scope.pagination.limit = response.data.limit;
		  $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
	};

	function getAllCategoriesAndBrands() {
		$http.get("../Core/Controller/ProductController.php?action=readAllCategories")
		.then(function(response) {
		  $scope.CategoryItems = response.data.data;
		  
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
		
		$http.get("../Core/Controller/ProductController.php?action=readAllBrands")
		.then(function(response) {
		  $scope.BrandItems = response.data.data;
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
	}
  
	// Initial load
	getAllProducts();

	// Pagination controls
	$scope.loadTransactions = function(page) {
	  getAllProducts(page, $scope.pageSize);
	};

	// Page size change
	$scope.changePageSize = function() {
	  getAllProducts(1, $scope.pageSize); // Reset to page 1
	};
	  
	$scope.updateProductFields = function(id = null, name = null, description = null, price = null, stock = null, expiration_date = null, CategoryId = null, BrandId = null) 
	{
		clearError();
		$scope.product.product_id = id;
		$scope.product.name = name;
		$scope.product.description = description;
		$scope.product.price = price;
		$scope.product.stock = stock;
		$scope.product.expiration_date = expiration_date;
		$scope.category_id = CategoryId;
		$scope.brand_id = BrandId;
	}
  
	function clearError() 
	{
		$scope.nameHasError = false;
		$scope.descriptionHasError = false;
		$scope.priceHasError = false;
		$scope.selectedCategoryIdHasError = false;
		$scope.selectedBrandIdHasError = false;
	}
  
	$scope.validateName = function() {
		$scope.nameHasError = !$scope.product.name
		$scope.nameError = "Brand Name is required."
		
		if($scope.product.name) 
		{
			$http.get("../Core/Controller/ProductController.php?action=getByProductName&product_name=" + $scope.product.name + "&id=" + $scope.product.product_id)
			.then(function(response) {
			  $scope.nameHasError = response.data.isExisting;
			  $scope.nameError = "Product Name already exist."
			}, function(error) {
			  console.error("Error fetching data:", error);
			});
		}
		
    }
	
	$scope.validateDescription = function() {
		$scope.descriptionHasError = !$scope.product.description
    }
	
	$scope.validatePrice = function() {
		$scope.priceHasError = !$scope.product.price
    }

    $scope.validateCategory = function() {
      $scope.selectedCategoryIdHasError = !$scope.product.category_id
    }
	
	$scope.validateBrand = function() {
      $scope.selectedBrandIdHasError = !$scope.product.brand_id
    }
	
	$scope.submit = function() 
	{
		$scope.validateName();
		$scope.validateDescription();
		$scope.validatePrice();
		$scope.validateCategory();
		$scope.validateBrand();
		let isValid = (!$scope.nameHasError && !$scope.descriptionHasError && !$scope.priceHasError && !$scope.selectedCategoryIdHasError && !$scope.selectedBrandIdHasError)
	  
		if(isValid) 
		{
			if(!$scope.product.product_id) 
			{
			  createProduct()
			} 
			else 
			{
			  updateProduct()
			}      
		}
    }

    function createProduct() {
      $http.post("../Core/Controller/ProductController.php?action=create", $scope.product)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#ProductCreateModal').modal('hide');
			$scope.formData.append('product_id', response.data.id);

			$http.post('../Core/Controller/ProductController.php?action=uploadImage', $scope.formData, {
			headers: { 'Content-Type': undefined }
			}).then(function(response) {
			console.log('Upload success:', response.data);
			}, function(error) {
			console.error('Upload failed:', error);
			});

            $scope.updateProductFields();
            getAllProducts();
          } 

        }, function(error) {
          console.error("Error fetching data:", error);
        });
    }
	
    function updateProduct() {
      $http.post("../Core/Controller/ProductController.php?action=update&id=" + $scope.product.product_id, $scope.product)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#ProductCreateModal').modal('hide');
            $scope.updateProductFields();
            getAllProducts();
          } 

        }, function(error) {
          console.error("Error fetching product:", error);
        });
    }
	
	$scope.addProductOnClick = function() {
    getAllCategoriesAndBrands();
  }
    
    $scope.updateProductOnClick = function(Product) {
        $scope.product = angular.copy(Product);
		getAllCategoriesAndBrands();
    }
	
	$scope.deleteProductOnClick = function(Product) {
		$scope.product = angular.copy(Product);
        $scope.IdForDelete = $scope.product.product_id;
		$scope.productNameForDelete = $scope.product.name;
    }
	
    $scope.deleteProductById = function() {
      $http.post("../Core/Controller/ProductController.php?action=delete&id=" + parseInt($scope.IdForDelete))
        .then(function(response) {
          if(response.data.status == "success") {
            $('#deleteProductConfirmationModal').modal('hide');
            getAllProducts();
          } 
        }, function(error) {
          console.error("Error fetching product:", error);
        });
    }
	
	
});