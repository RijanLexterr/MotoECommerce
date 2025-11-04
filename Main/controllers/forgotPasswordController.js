app.controller('ForgotPasswordController', function ($scope, $http) {
    $scope.email = "";
    $scope.code = "";
    $scope.newPassword = "";
    $scope.confirmPassword = "";
    $scope.isCodeVerified = false;
    $scope.isLoading = false;
    $scope.successMessage = "";
    $scope.errorMessage = "";
    $scope.modalTitle = "";
    $scope.modalMessage = "";
    $scope.modalType = "";

    var alertModal; // global reference

    // ✅ Show modal (Bootstrap 3 version)
    $scope.showModal = function (title, message, type = "info") {
        $scope.modalTitle = title;
        $scope.modalMessage = message;
        $scope.modalType = type;

        // Ensure scope updates before showing modal
        if (!$scope.$$phase) $scope.$applyAsync();

        if (!alertModal) {
            alertModal = $("#alertModal");
        }

        alertModal.modal({
            backdrop: 'static',
            keyboard: true
        });

        alertModal.modal('show');
    };

    // ✅ Close modal
    $scope.closeModal = function () {
        if (alertModal) {
            alertModal.modal('hide');
        }
    };

    // ✅ Step 1: Validate code + email
    $scope.validateCode = function () {
        $scope.isLoading = true;
        $scope.errorMessage = "";
        $scope.successMessage = "";
        console.log($scope.email + "" + $scope.email)
        $http.get("../Core/Controller/ForgotPassword.php?action=validateCode", {
            params: { email: $scope.email, code: $scope.code }
        })
            .then(function (response) {
                $scope.isLoading = false;
                if (response.data.status === "success") {
                    $scope.isCodeVerified = true;
                    $scope.successMessage = "Code verified! You can now set a new password.";
                    $scope.showModal("Success", "Code verified successfully.", "success");
                } else {
                    $scope.errorMessage = "Invalid or expired code.";
                    $scope.showModal("Error", "Invalid or expired code.", "error");
                }
            })
            .catch(function () {
                $scope.isLoading = false;
                $scope.errorMessage = "Something went wrong during validation.";
                $scope.showModal("Error", "Something went wrong during validation.", "error");
            });
    };

    // ✅ Step 2: Reset password
    $scope.resetPassword = function () {
        if ($scope.newPassword !== $scope.confirmPassword) {
            $scope.errorMessage = "Passwords do not match.";
            $scope.showModal("Error", "Passwords do not match.", "error");
            return;
        }

        $scope.isLoading = true;
        $scope.errorMessage = "";
        $scope.successMessage = "";

        $http.post("../Core/Controller/UserController.php?action=resetPassword", {
            email: $scope.email,
            password: $scope.newPassword
        })
            .then(function (response) {
                $scope.isLoading = false;
                if (response.data.status === "success") {
                    $scope.successMessage = "Password successfully reset! You can now log in.";
                    $scope.showModal("Success", "Password successfully reset!", "success");
                    $timeout(function () {
                        $location.path('/login');
                    }, 1500);
                    // Invalidate code after success
                    $http.get("../Core/Controller/ForgotPassword.php?action=invalidate", {
                        params: { email: $scope.email, code: $scope.code }
                    });

                } else {
                    $scope.errorMessage = response.data.message || "Unable to reset password.";
                    $scope.showModal("Error", $scope.errorMessage, "error");
                }
            })
            .catch(function () {
                $scope.isLoading = false;
                $scope.errorMessage = "An error occurred while resetting the password.";
                $scope.showModal("Error", "An error occurred while resetting the password.", "error");
            });
    };
});
