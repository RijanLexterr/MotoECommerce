app.controller("InventoryReportController", function ($scope, $http, $timeout) {
    $scope.monthlyReports = [];
    $scope.yearlyReports = [];
    $scope.productReport = {};
    $scope.DropdownItems = [];

    $scope.filter = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        product_id: "",
        start_date: "",
        end_date: ""
    };
    $scope.setTab = function (tab) { $scope.activeTab = tab; };
    $scope.isTab = function (tab) { return $scope.activeTab === tab; };

    let monthlyChart = null;
    let yearlyChart = null;

    // ======================
    // Load products
    // ======================
    $scope.loadDropdown = function () {
        $http.get("../Core/Controller/InventoryController.php?action=GetAllProducts&pageSize=9999")
            .then(function (response) {
                $scope.DropdownItems = response.data.data || [];
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Load Monthly Report
    // ======================
    $scope.loadMonthlyReport = function () {
        let params = angular.copy($scope.filter);
        $http.get("../Core/Controller/Report.php?action=monthly", { params })
            .then(function (response) {
                $scope.monthlyReports = response.data.data || [];
                $scope.currentPeriod = response.data.period;
                $scope.filterText = response.data.filter;

                // Render chart (optional)
                $timeout($scope.renderMonthlyChart, 100);
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Load Yearly Report
    // ======================
    $scope.loadYearlyReport = function () {
        let params = { year: $scope.filter.year };
        $http.get("../Core/Controller/Report.php?action=yearly", { params })
            .then(function (response) {
                $scope.yearlyReports = response.data.data || [];
                $scope.currentYear = response.data.year;

                // Chart rendering
                $timeout($scope.renderYearlyChart, 100);
            })
            .catch(err => console.error(err));
    };

    // ======================
    // Load Report by Product
    // ======================
    $scope.loadProductReport = function () {
        if (!$scope.filter.product_id) {
            alert("Please select a product first.");
            return;
        }

        $http.get("../Core/Controller/Report.php?action=byProduct", {
            params: { product_id: $scope.filter.product_id }
        })
            .then(function (response) {
                const data = response.data.data || response.data;
                $scope.productReport = Array.isArray(data) ? data : [data];
                console.log("Product Report:", $scope.productReport);
            })
            .catch(err => console.error(err));
    };

    $scope.getColumnTotal = function (field) {
        return $scope.monthlyReports.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    };
    $scope.getMonthName = function (monthNumber) {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[monthNumber - 1] || "Unknown";
    };

    // ======================
    // Render Monthly Chart
    // ======================
    $scope.renderMonthlyChart = function () {
        if (!document.getElementById("monthlyChart")) return;
        let ctx = document.getElementById("monthlyChart").getContext("2d");

        if (monthlyChart) monthlyChart.destroy();

        let labels = $scope.monthlyReports.map(r => r.product_name);
        let inQty = $scope.monthlyReports.map(r => r.total_in);
        let outQty = $scope.monthlyReports.map(r => r.total_out);

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total IN',
                        data: inQty,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Total OUT',
                        data: outQty,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    };


    // ======================
    // Render Yearly Chart
    // ======================
    $scope.renderYearlyChart = function () {
        if (!document.getElementById("yearlyChart")) return;
        let ctx = document.getElementById("yearlyChart").getContext("2d");

        if (yearlyChart) yearlyChart.destroy();

        let labels = $scope.yearlyReports.map(r => r.month);
        let inQty = $scope.yearlyReports.map(r => r.total_in);
        let outQty = $scope.yearlyReports.map(r => r.total_out);

        yearlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total IN',
                        data: inQty,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false
                    },
                    {
                        label: 'Total OUT',
                        data: outQty,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        fill: false
                    }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    };

    $scope.exportMonthlyReport = function () {
        const y = $scope.filter.year || new Date().getFullYear();
        const m = $scope.filter.month || new Date().getMonth() + 1;
        const pid = $scope.filter.product_id || '';
        window.open(`Core/Controller/ReportController.php?action=exportMonthly&year=${y}&month=${m}&product_id=${pid}`, '_blank');
    };
    $scope.exportYearlyReport = function () {
        const y = $scope.filter.year || new Date().getFullYear();
        window.open(`Core/Controller/ReportController.php?action=exportYearly&year=${y}`, '_blank');
    };
    $scope.exportProductReport = function () {
        if (!$scope.filter.product_id) return alert("Select a product first");
        window.open(`Core/Controller/ReportController.php?action=exportProduct&product_id=${$scope.filter.product_id}`, '_blank');
    };

    $scope.exportReport = function (type) {
        let params = { type: type };
        if (type === 'monthly') {
            params.year = $scope.filter.year;
            params.month = $scope.filter.month;
        } else if (type === 'yearly') {
            params.year = $scope.filter.year;
        }

        const query = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
        window.open(`../Core/Controller/Report.php?action=export&${query}`, '_blank');
    };

    $scope.getMonthName = function (monthNumber) {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return monthNames[monthNumber - 1] || "Unknown";
    };
    // ======================
    // Initialize
    // ======================
    $scope.loadDropdown();
    $scope.loadMonthlyReport();
});
