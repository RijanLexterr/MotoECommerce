app.controller("ShopController", function ($scope, $http, $routeParams) {
    $scope.categoryIds = $routeParams.categoryId || "0";
    $scope.brandIds = $routeParams.brandIds || "0";

    $scope.Products = [];
    $scope.brandList = [];
    $scope.categoryList = [];

    // Basic pagination state
    $scope.pagination = { page: 1, limit: 6, total: 0, pages: 0 };

    function loadProducts(categoryIds, brandIds, page = 1) {
        let url = "../Core/Controller/ProductController.php?action=readByFilter"
            + "&categoryIds=" + categoryIds
            + "&brandIds=" + brandIds
            + "&page=" + page
            + "&limit=" + $scope.pagination.limit;

        $http.get(url).then(function (response) {
            let res = response.data;

            $scope.Products = res.data || [];
            console.log(res);
            // ✅ keep pagination state in sync
            $scope.pagination.page = parseInt(res.page) || 1;
            $scope.pagination.limit = parseInt(res.limit) || 6;
            $scope.pagination.total = parseInt(res.total) || 0;
            $scope.pagination.pages = parseInt(res.pages) || 0;
        }, function (error) {
            console.error("Error fetching products:", error);
            $scope.Products = [];
        });
    }

    $scope.updateFilters = function () {
        let selectedCategories = $scope.categoryList.filter(c => c.selected).map(c => c.category_id);
        let selectedBrands = $scope.brandList.filter(b => b.selected).map(b => b.brand_id);

        $scope.categoryIds = selectedCategories.length ? selectedCategories.join(",") : "0";
        $scope.brandIds = selectedBrands.length ? selectedBrands.join(",") : "0";

        // ✅ Reset to page 1 when filters change
        $scope.pagination.page = 1;
        loadProducts($scope.categoryIds, $scope.brandIds, 1);
    };

    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.pagination.pages) {
            // ✅ update current page before fetching
            console.log(page);
            $scope.pagination.page = page;
            loadProducts($scope.categoryIds, $scope.brandIds, page);
        }
    };

    $scope.getPageRange = function (num) {
        return new Array(num);
    };

    function getAllBrands() {
        $http.get(`../Core/Controller/BrandController.php?action=readAll&page=1&limit=99999`)
            .then(function (response) {
                $scope.brandList = response.data.data || [];
            });
    }

    function getAllCategories() {
        $http.get(`../Core/Controller/CategoryController.php?action=readAll&page=1&limit=99999`)
            .then(function (response) {
                $scope.categoryList = response.data.data || [];

                // ✅ mark selected based on route param
                if ($scope.categoryIds && $scope.categoryIds !== "0") {
                    let selectedIds = $scope.categoryIds.split(",");
                    $scope.categoryList.forEach(cat => {
                        cat.selected = selectedIds.includes(String(cat.category_id));
                    });
                }
            });
    }

    // Initial load
    getAllBrands();
    getAllCategories();
    loadProducts($scope.categoryIds, $scope.brandIds, $scope.pagination.page);

    let productsOnCartList = JSON.parse(sessionStorage.getItem('productsOnCart')) || [];

    $scope.addToCart = function (currentProductId) {
        let existingProduct = productsOnCartList.find(p => p.id === currentProductId);

        if (existingProduct) {
            existingProduct.count += 1;
            $scope.showModal("Item already in cart. Quantity updated.");
        } else {
            productsOnCartList.push({ id: currentProductId, count: 1});
            $scope.showModal("Item added in cart.");
        }

        sessionStorage.setItem('productsOnCart', JSON.stringify(productsOnCartList));
        $scope.$emit('productsOnCart', productsOnCartList);
    };

    $scope.alertMessage = '';

    $scope.showModal = function(message) {
        $scope.alertMessage = message;
    };
});
