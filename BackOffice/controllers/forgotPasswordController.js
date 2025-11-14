app.controller('ForgotPasswordController', function ($scope, $http, $location) {
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

    let alertModal = null; // Bootstrap modal instance holder

    // ✅ Initialize or show modal
    $scope.showModal = function (title, message, type = "info") {
        $scope.modalTitle = title;
        $scope.modalMessage = message;
        $scope.modalType = type;

        // Ensure Angular scope is updated before showing
        if (!$scope.$$phase) $scope.$applyAsync();

        const modalEl = document.getElementById("alertModal");
        if (!alertModal) {
            alertModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });
        }
        alertModal.show();
    };

    // ✅ Close modal
    $scope.closeModal = function () {
        const modalEl = document.getElementById("alertModal");
        if (!alertModal) {
            alertModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: true });
        }
        if (alertModal) {
            alertModal.hide();
        }
    };

    // ✅ Step 1: Validate code + email
    $scope.validateCode = function () {
        $scope.isLoading = true;
        $scope.errorMessage = "";
        $scope.successMessage = "";

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

    $scope.resetPassword = function () {
        if ($scope.newPassword !== $scope.confirmPassword) {
            $scope.errorMessage = "Passwords do not match.";
            $scope.showModal("Error", "Passwords do not match.", "error");
            return;
        }
        if ($scope.newPassword == '' ) {
            $scope.errorMessage = "Passwords is required!";
            $scope.showModal("Error", "Password is required", "error");
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

                    // Invalidate reset code
                    $http.get("../Core/Controller/ForgotPassword.php?action=invalidate", {
                        params: { email: $scope.email, code: $scope.code }
                    }).then(function (emailResponse) { $location.path('/login');; });

                    // ✅ Redirect to login after 2 seconds




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