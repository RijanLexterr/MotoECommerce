

app.controller("CategoryController", function($scope, $http) {
	$scope.searchQuery = "";
	$scope.categorylist = [];
	$scope.category = {};
	$scope.userIdForDelete;
	
	$scope.pageSize = 5;
	$scope.pagination = {
	  page: 1,
	  totalPages: 1
	};

	 function getAllCategories(page = 1, limit = $scope.pageSize) {
	  $http.get(`../Core/Controller/CategoryController.php?action=readAll&page=${page}&limit=${limit}`)
		.then(function(response) {
		  $scope.categorylist = response.data.data;
		  $scope.pagination.page = response.data.page;
		  $scope.pagination.limit = response.data.limit;
		  $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
	};

	// Initial load
	getAllCategories();

	// Pagination controls
	$scope.loadTransactions = function(page) {
	  getAllCategories(page, $scope.pageSize);
	};

	// Page size change
	$scope.changePageSize = function() {
	  getAllCategories(1, $scope.pageSize); // Reset to page 1
	};
	  
	$scope.updateCategoryFields = function(id = null, name = null) 
	{
		clearError();
		$scope.category.category_id = id;
		$scope.category.name = name;
	}
  
	function clearError() 
	{
		$scope.nameHasError = false;
	}
  
	$scope.validateName = function() {
      $scope.nameHasError = !$scope.category.name
    }

	$scope.submit = function() 
	{
		  $scope.validateName();
		  let isValid = (!$scope.nameHasError)

		  if(isValid) 
		  {
			if(!$scope.category.category_id) 
			{
			  createCategory()
			} 
			else 
			{
			  updateCategory()
			}      
		  }
    }
	
/* 	function CheckAllCategories(id) {
		$http.get("../Core/Controller/CategoryController.php?action=CheckAllCategories")
		.then(function(response) {
		  $scope.categories = response.data;
		  if(id) {
			console.log($scope.categorylist.find(u => u.category_id === id))
			let currentCategory = $scope.categorylist.find(u => u.category_id === id);
			$scope.updateCategoryFields(currentCategory.category_id, currentCategory.name)
		  }
		}, function(error) {
		  console.error("Error fetching data:", error);
		});
	  }
		  
 */

    function createCategory() {
      $http.post("../Core/Controller/CategoryController.php?action=createcategory", $scope.category)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#CategoryCreateModal').modal('hide');
            $scope.updateCategoryFields();
            getAllCategories();
          } 

        }, function(error) {
          console.error("Error fetching data:", error);
        });
    }
	
    function updateCategory() {
      $http.post("../Core/Controller/CategoryController.php?action=updatecategory&id=" + $scope.category.category_id, $scope.category)
        .then(function(response) {

          if(response.data.status == "success") {
            $('#CategoryCreateModal').modal('hide');
            $scope.updateCategoryFields();
            getAllCategories();
          } 

        }, function(error) {
          console.error("Error fetching category:", error);
        });
    }
    
    $scope.updateCategoryOnClick = function(Category) {
        $scope.category = angular.copy(Category);
    }
	
	$scope.deleteCategoryOnClick = function(id) {
        $scope.userIdForDelete = id;
    }
	
    $scope.deleteCategoryById = function() {
      $http.post("../Core/Controller/CategoryController.php?action=deletecategory&id=" + parseInt($scope.userIdForDelete))
        .then(function(response) {
          if(response.data.status == "success") {
            $('#deleteCategoryConfirmationModal').modal('hide');
            getAllCategories();
          } 
        }, function(error) {
          console.error("Error fetching category:", error);
        });
    }


});
