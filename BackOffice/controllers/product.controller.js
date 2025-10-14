

app.controller("ProductController", function($scope, $http) {	
	$scope.searchQuery = "";
	$scope.products = [];
	$scope.product = {};
	$scope.CategoryItems = [];
	$scope.BrandItems = [];
	$scope.IdForDelete;
	$scope.productNameForDelete;
	$scope.nameError;
	$scope.priceError;
	$scope.newpriceError;
	$scope.DirImageFile;
	
	$scope.pageSize = 5;
	$scope.pagination = 
	{
	  page: 1,
	  totalPages: 1
	};

	const imageInput = document.getElementById('imageInput');
	const previewImage = document.getElementById('previewImage');

	imageInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        const imageURL = URL.createObjectURL(file);
        previewImage.src = imageURL;
        previewImage.style.display = 'block';
      } else {
        clearPreview();
      }
    });

    function clearPreview() {
      // Clear image preview
      previewImage.src = '#';
      previewImage.style.display = 'none';

      // Clear the file input
      imageInput.value = '';
    }

	$scope.productId = 1; // Set dynamically if needed

	$scope.triggerUpload = function() 
	{
		document.getElementById('imageInput').click();
	};

	$scope.uploadImage = function(files) {
	$scope.formData = new FormData();
	$scope.formData.append('image', files[0]);
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
	  
	$scope.updateProductFields = function(id = null, name = null, description = null, price = null, stock = null, expiration_date = null, CategoryId = null, BrandId = null, image_location = null, is_promoted = null, new_price = null) 
	{
		clearError();
		clearPreview();
		$scope.product.product_id = id;
		$scope.product.name = name;
		$scope.product.description = description;
		$scope.product.price = price;
		$scope.product.stock = stock;
		$scope.product.expiration_date = expiration_date;
		$scope.product.category_id = CategoryId;
		$scope.product.brand_id = BrandId;
		$scope.product.image_location = image_location;
		$scope.product.is_promoted = is_promoted;
		$scope.product.new_price = new_price;
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
		$scope.nameHasError = !$scope.product.name;
		$scope.nameError = "Brand Name is required.";
		
		if($scope.product.name) 
		{
			$http.get("../Core/Controller/ProductController.php?action=getByProductName&product_name=" + $scope.product.name + "&id=" + $scope.product.product_id)
			.then(function(response) {
			  $scope.nameHasError = response.data.isExisting;
			  $scope.nameError = "Product Name already exist.";
			}, function(error) {
			  console.error("Error fetching data:", error);
			});
		}
		
    }
	
	$scope.validateDescription = function() {
		$scope.descriptionHasError = !$scope.product.description;
    }
	
	$scope.validatePrice = function() {
		$scope.priceHasError = !$scope.product.price;
		$scope.priceError = "Price is required.";
		
		if($scope.product.price) 
		{
			const input = document.getElementById('decimalInput').value;
			  // Regular expression for a decimal number (optional negative sign, digits, optional decimal point, optional digits after decimal)
			const regex = /^-?\d*\.?\d+$/; 
			
			if (regex.test(input)) 
			{
				const price = Number(input);
				if (price <= 0)
				{
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
	
	$scope.validateNewPrice = function() {
		
		const input = document.getElementById('decimalInputNew').value;
		const input_is_promoted = document.getElementById('is_promoted').value;
			
		const new_price = Number(input);
		
		$scope.newpriceHasError = 0;
		
		if ($scope.product.is_promoted == true && new_price == 0)
		{
			$scope.newpriceError = "New price is required if promoted item.";
			$scope.newpriceHasError = 1;
		}
				
		if($scope.product.new_price) 
		{
			  // Regular expression for a decimal number (optional negative sign, digits, optional decimal point, optional digits after decimal)
			const regex = /^-?\d*\.?\d+$/; 
			
			if (regex.test(input)) 
			{
				if (new_price <= 0)
				{
					$scope.newpriceError = "Please enter a valid new price.";
					$scope.newpriceHasError = 1;
				}
				// Further processing or form submission
			} 
			else 
			{
				$scope.newpriceError = "Invalid decimal number. Please enter a valid format.";
				$scope.newpriceHasError = 1;
			}
		}
		
    }

    $scope.validateCategory = function() {
      $scope.selectedCategoryIdHasError = !$scope.product.category_id;
    }
	
	$scope.validateBrand = function() {
      $scope.selectedBrandIdHasError = !$scope.product.brand_id;
    }
	
	$scope.submit = function() 
	{
		$scope.validateName();
		$scope.validateDescription();
		$scope.validatePrice();
		$scope.validateCategory();
		$scope.validateBrand();
		$scope.validateNewPrice();
		
		let isValid = (!$scope.nameHasError && !$scope.descriptionHasError && !$scope.priceHasError && !$scope.selectedCategoryIdHasError && !$scope.selectedBrandIdHasError && !$scope.newpriceHasError)
	  
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
		
		const fileInput = document.getElementById('imageInput');
        const files = fileInput.files;

        if (files && files.length > 0) 
		{
            // An image has been selected
            const uploadedFile = files[0];

            // You can also perform further validation here, e.g., check file type
            if (!uploadedFile.type.startsWith('image/')) 
			{
                alert('It is not an image file.');
				return;
            } 
        } 

		$scope.product.expiration_date = document.getElementById("ExpirationDate").value;
		$scope.product.stock = document.getElementById("Stock").value;
		
		$http.post("../Core/Controller/ProductController.php?action=create", $scope.product)
        .then(function(response) 
		{
			if(response.data.status == "success") 
			{
				if (files && files.length > 0) 
				{
					$scope.formData.append('product_id', response.data.id);
					$scope.formData.append('image_location', "");
					
					$http.post('../Core/Controller/ProductController.php?action=uploadImage', $scope.formData, {
					headers: { 'Content-Type': undefined }
					}).then(function(response) 
					{
						console.log('Upload success:', response.data);
					}, 
					function(error) 
					{
						console.error('Upload failed:', error);
					});
				}
				
				$('#ProductCreateModal').modal('hide');
				$scope.updateProductFields();
				getAllProducts();
			} 
        }, 
		function(error) 
		{
          console.error("Error fetching data:", error);
        });
		
    }
	
    function updateProduct() {
		
		const fileInput = document.getElementById('imageInput');
        const files = fileInput.files;

        if (files && files.length > 0) 
		{
            // An image has been selected
            const uploadedFile = files[0];
            console.log('Image selected:', uploadedFile.name);

            // You can also perform further validation here, e.g., check file type
            if (uploadedFile.type.startsWith('image/')) {
                $scope.formData.append('product_id', $scope.product.product_id);
				$scope.formData.append('image_location', uploadedFile.name);
				$http.post('../Core/Controller/ProductController.php?action=uploadImage', $scope.formData, {
				headers: { 'Content-Type': undefined }
				}).then(function(response) 
				{
					$('#ProductCreateModal').modal('hide');
				}, 
				function(error) 
				{
					$('#ProductCreateModal').modal('hide');
				});
            } 
			else 
			{
				alert('It is not an image file.');
				return;
            }
        }
		
		$scope.product.expiration_date = document.getElementById("ExpirationDate").value;
		$scope.product.stock = document.getElementById("Stock").value;
		$http.post("../Core/Controller/ProductController.php?action=update&id=" + $scope.product.product_id, $scope.product)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#ProductCreateModal').modal('hide');
            $scope.updateProductFields();
            getAllProducts();
          } 
		  else
		  {
			  //alert($scope.product.is_promoted);
		  }

        }, function(error) {
          console.error("Error fetching product:", error);
		  //alert($scope.product.is_promoted);
        });
    }
	
	$scope.addProductOnClick = function() 
	{
		$scope.updateProductFields();
		getAllCategoriesAndBrands();
	}
    
    $scope.updateProductOnClick = function(Product) {
        $scope.product = angular.copy(Product);
		
		if ($scope.product.is_promoted  == 1)
		{
			$scope.product.is_promoted = true;
		}
		else
		{
			$scope.product.is_promoted = false;
		}
		
		getAllCategoriesAndBrands();
		
		$scope.DirImageFile = '../Backoffice/uploads/' + $scope.product.image_location;
		previewImage.src = $scope.DirImageFile;
		previewImage.style.display = 'block';
    }
	
	$scope.deleteProductOnClick = function(Product) {
		$scope.product = angular.copy(Product);
        $scope.IdForDelete = $scope.product.product_id;
		$scope.productNameForDelete = $scope.product.name;
    }
	
    $scope.deleteProductById = function() 
	{
		
		$http.post("../Core/Controller/ProductController.php?action=delete&id=" + $scope.product.product_id, $scope.product)
        .then(function(response) {
          if(response.data.status == "success") 
		  {
            $('#deleteProductConfirmationModal').modal('hide');
            getAllProducts();
          }
		else
		{
			$('#deleteProductConfirmationModal').modal('hide');
		}		  
		  
        }, function(error) {
			$('#deleteProductConfirmationModal').modal('hide');
        });
		
		
    }
	
	
});