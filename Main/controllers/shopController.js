app.controller("ShopController", function ($scope, $http, $routeParams) {
    // Initialize filter params
    $scope.categoryIds = $routeParams.categoryId || "0";
    $scope.brandIds = $routeParams.brandIds || "0";

    // Initialize lists
    $scope.Products = [];
    $scope.brandList = [];
    $scope.categoryList = [];

    // Pagination state
    $scope.pagination = { page: 1, limit: 6, total: 0, pages: 0 };

    // -------------------- LOAD PRODUCTS --------------------
    function loadProducts(categoryIds, brandIds, page = 1) {
        let url = "../Core/Controller/ProductController.php?action=readByFilter"
            + "&categoryIds=" + categoryIds
            + "&brandIds=" + brandIds
            + "&page=" + page
            + "&limit=" + $scope.pagination.limit;

        $http.get(url).then(function (response) {
            let res = response.data;

            $scope.Products = res.data || [];

            // ✅ Update pagination
            $scope.pagination.page = parseInt(res.page) || 1;
            $scope.pagination.limit = parseInt(res.limit) || 6;
            $scope.pagination.total = parseInt(res.total) || 0;
            $scope.pagination.pages = parseInt(res.pages) || 0;
        }, function (error) {
            console.error("Error fetching products:", error);
            $scope.Products = [];
        });
    }

    // -------------------- UPDATE FILTERS --------------------
    $scope.updateFilters = function () {
        let selectedCategories = $scope.categoryList.filter(c => c.selected).map(c => c.category_id);
        let selectedBrands = $scope.brandList.filter(b => b.selected).map(b => b.brand_id);

        $scope.categoryIds = selectedCategories.length ? selectedCategories.join(",") : "0";
        $scope.brandIds = selectedBrands.length ? selectedBrands.join(",") : "0";

        $scope.pagination.page = 1;
        loadProducts($scope.categoryIds, $scope.brandIds, 1);
    };

    // -------------------- PAGINATION --------------------
    $scope.goToPage = function (page) {
        if (page >= 1 && page <= $scope.pagination.pages) {
            $scope.pagination.page = page;
            loadProducts($scope.categoryIds, $scope.brandIds, page);
        }
    };

    $scope.getPageRange = function (num) {
        return new Array(num);
    };

    // -------------------- LOAD BRANDS --------------------
    function getAllBrands() {
        $http.get(`../Core/Controller/BrandController.php?action=readAll&page=1&limit=99999`)
            .then(function (response) {
                $scope.brandList = response.data.data || [];
            });
    }

    // -------------------- LOAD CATEGORIES --------------------
    function getAllCategories() {
        $http.get(`../Core/Controller/CategoryController.php?action=readAll&page=1&limit=99999`)
            .then(function (response) {
                $scope.categoryList = response.data.data || [];
                if ($scope.categoryIds && $scope.categoryIds !== "0") {
                    let selectedIds = $scope.categoryIds.split(",");
                    $scope.categoryList.forEach(cat => {
                        cat.selected = selectedIds.includes(String(cat.category_id));
                    });
                }
            });
    }

    // -------------------- INITIAL LOAD --------------------
    getAllBrands();
    getAllCategories();
    loadProducts($scope.categoryIds, $scope.brandIds, $scope.pagination.page);

    // -------------------- CART MANAGEMENT --------------------
    let productsOnCartList = JSON.parse(sessionStorage.getItem('productsOnCart')) || [];
    $scope.alertMessage = '';

    // ✅ Add to Cart with stock validation & live update
    $scope.addToCart = function (currentProductId) {
        const currentProduct = $scope.Products.find(p => p.product_id === currentProductId);
        if (!currentProduct) return;

        // 🚫 1. Out of stock validation
        if (currentProduct.stock <= 0) {
            $scope.showModal("Sorry, this item is out of stock.");
            return;
        }

        // 2️⃣ Check if product already in cart
        let existingProduct = productsOnCartList.find(p => p.id === currentProductId);

        if (existingProduct) {
            // 🚫 Prevent adding beyond stock
            if (existingProduct.count >= currentProduct.stock) {
                $scope.showModal("Cannot add more. Stock limit reached.");
                return;
            }

            existingProduct.count += 1;
            currentProduct.stock -= 1; // 🟢 update stock visually
            $scope.showModal("Quantity updated in cart.");
        } else {
            productsOnCartList.push({ id: currentProductId, count: 1 });
            currentProduct.stock -= 1; // 🟢 update stock visually
            $scope.showModal("Item added to cart.");
        }

        // Save to session
        sessionStorage.setItem('productsOnCart', JSON.stringify(productsOnCartList));
        $scope.$emit('productsOnCart', productsOnCartList);
    };

    // ✅ Bootstrap Modal helper
    $scope.showModal = function (message) {
        $scope.alertMessage = message;
    };
});
