app.controller('LoginController', function ($scope, $http, $location) {
  $scope.isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  $scope.currentUser = sessionStorage.getItem('currentUser');


  // Error flags
  $scope.emailError = '';
  $scope.passwordError = '';
  $scope.error = '';

  $scope.login = function () {


    // Reset errors
    $scope.emailError = '';
    $scope.passwordError = '';
    $scope.error = '';

    // Client-side validation
    let valid = true;
    if (!$scope.username || !$scope.username.trim()) {
      $scope.emailError = 'Email is required.';
      valid = false;
    }

    if (!$scope.password || !$scope.password.trim()) {
      $scope.passwordError = 'Password is required.';
      valid = false;
    }

    if (!valid) return;


    $http.post('../Core/Controller/Login/bofficelogin.php', {
      email: $scope.username,
      password: $scope.password
    }).then(function (response) {
      if (response.data.status === 'success') {
        $scope.isLoggedIn = true;
        $scope.currentUser = response.data.user;


        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
        $scope.$emit('isLoggedIn', response.data.user);
        $location.path('/users/Super Admin');

      } else {
        $scope.error = response.data.message;
      }
    });
  };

  $scope.isForgotPW = false;




  // Step 1: Send reset code
  $scope.sendResetEmail = function () {
    const email = $scope.username;
    $scope.resetMessage = '';
    $scope.emailError = '';

    if (!email) {
      $scope.emailError = "Please enter your email address.";
      return;
    }

    // Step 1: Validate user email
    $http.get("../Core/Controller/UserController.php?action=validateUserByEmail", {
      params: { email: $scope.username }
    })
      .then(function (response) {
        if (!response.data.isExisting) {
          $scope.emailError = "This email is not registered in our system.";
          return Promise.reject("Invalid email");
        }

        // Step 2: Create reset code in backend
        return $http.post('../Core/Controller/ForgotPassword.php?action=createRequest', { email: email });
      })
      .then(function (response) {
        if (!response) return;

        const data = response.data;
        if (data.status !== "success") {
          $scope.resetMessage = "Error: " + (data.message || "Could not create reset request.");
          return Promise.reject();
        }

        const code = data.code;

        // Step 3: Send email
        const emailData = {
          to: email,
          subject: "Your Password Reset Code",
          body: `
          <h3>Hello,</h3>
          <p>We received a request to reset your password.</p>
          <p>Your reset code is:</p>
          <h2 style="letter-spacing:4px;">${code}</h2>
          <p>Enter this code in the reset form to proceed.</p>
          <br>
          <p>Thank you,<br><b>Your Support Team</b></p>
        `
        };

        return $http.post('../Core/Controller/email.php?action=send', emailData);
      })
      .then(function (emailResponse) {
        if (!emailResponse) return;

        if (emailResponse.data.status === "success") {
          $scope.resetMessage = "We have sent an email with your reset code. Please check your inbox.";
          $('#loginModal').modal('hide'); // optional: close modal
          $location.path('/forgotpassword');
        } else {
          $scope.resetMessage = "Failed to send reset email. Please try again later.";
        }
      })
      .catch(function (error) {
        console.error("Forgot password error:", error);
        if (!$scope.resetMessage && !$scope.emailError) {
          $scope.resetMessage = "Something went wrong. Please try again.";
        }
      });
  };

});
