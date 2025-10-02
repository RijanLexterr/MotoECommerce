app.controller("ProductDetailsController", function($scope, $http, $routeParams) {
    $scope.product = {};
    
    var productId = $routeParams.productID; // must match route param name
    console.log("Product ID from route:", productId);

    if (productId) {
        $http.get("../Core/Controller/ProductController.php?action=readOne&id=" + productId)
            .then(function(response) {
                $scope.product = response.data;
            })
            .catch(function(error) {
                console.error("Error fetching product details:", error);
            });
    } else {
        console.warn("No product ID provided in route");
    }


});
