app.controller("OrderController", function ($scope, $http) {
  $scope.OrdersWithItems = [];
  $scope.orderIdForShipping;
  $scope.searchQuery = "";
  $scope.pageSize = 5;
  $scope.pagination = {
    page: 1,
    totalPages: 1
  };
  $scope.returnRemarks = "";
  getAllTransactions();

  function getAllTransactions(page = 1, limit = $scope.pageSize) {
    $http.get(`../Core/Controller/OrderController.php?action=readAll&page=${page}&limit=${limit}`)
      .then(function (response) {
        $scope.OrdersWithItems = response.data.data;
        $scope.pagination.page = response.data.page;
        $scope.pagination.limit = response.data.limit;
        $scope.pagination.totalPages = Math.ceil(response.data.total / response.data.limit);
      })
      .catch(function (error) {
        console.error("Error fetching transactions:", error);
      });
  };

  // Pagination controls
  $scope.loadTransactions = function (page) {
    getAllTransactions(page, $scope.pageSize);
  };

  // Page size change
  $scope.changePageSize = function () {
    getAllTransactions(1, $scope.pageSize); // Reset to page 1
  };

  $scope.showOrderItems = function (parent) {
    console.log(parent);
    $scope.selectedParent = parent;
  };
  $scope.Verify = function () {
    $scope.orderIdForShipping = $scope.selectedParent.order_id;
    $('#showItemsModal').modal('hide');
    $('#shippedOrderConfirmationModal').modal('show');


    console.log($scope.selectedParent.order_id);
  }

  $scope.shippedOrderOnClick = function (parent) {
    $scope.orderIdForShipping = parent.order_id;
    $scope.selectedParent = parent;
    console.log(id);
  }
  $scope.shippedOrder = function () {
    const payload = {
      status_id: 3, // Shipped
      remarks: "Order has been shipped"
    };

    $http.post("../Core/Controller/OrderController.php?action=shipOrder&id=" + $scope.orderIdForShipping, payload)
      .then(function (response) {
        if (response.data.status === "success") {
          // Close modal
          $('#shippedOrderConfirmationModal').modal('hide');

          // Send email confirmation
          const emailData = {
            to: $scope.selectedParent.email,
            subject: `Order #${$scope.orderIdForShipping} - Your Order Has Been Shipped!`,
            body: `
            <div style="font-family: Arial, sans-serif; background-color: #f7f9fb; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
                
                <div style="background-color: #5cb85c; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0;">Your Order Has Been Shipped!</h2>
                </div>

                <div style="padding: 25px; color: #333;">
                  <p style="font-size: 16px;">Hi <strong>${$scope.selectedParent.email}</strong>,</p>

                  <p>We are happy to let you know that your order <strong>#${$scope.orderIdForShipping}</strong> has been verified and is now <span style="color:#5cb85c; font-weight:bold;">on its way</span> to you!</p>

                  <div style="background: #f4f9f4; border-left: 5px solid #5cb85c; padding: 10px 15px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 15px;">
                      <strong>Remarks:</strong> Order has been shipped successfully.
                    </p>
                  </div>

                  <p>You can track your delivery in your account dashboard once it is updated.</p>

                  <p style="margin-top: 20px;">Thank you for shopping with us,<br>
                  <strong>DIY Online Store Team</strong></p>
                </div>

                <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #888;">
                  <p style="margin: 0;">© ${new Date().getFullYear()} Motor Online Store. All rights reserved.</p>
                </div>

              </div>
            </div>
          `
          };

          // Send shipping email
          $http.post('../Core/Controller/email.php?action=send', emailData)
            .then(function (emailResponse) {
              console.log("Shipping email sent successfully:", emailResponse.data);

              // Refresh transaction list
              getAllTransactions();

              // Recalculate stock after shipping
              $http.get("../Core/Controller/OrderController.php?action=readAllItems&id=" + $scope.orderIdForShipping)
                .then(function (response) {
                  angular.forEach(response.data, function (item) {
                    $http.get(`../Core/Controller/InventoryController.php?action=recalculateStock&product_id=${item.product_id}`)
                      .then(() => console.log(`Stock recalculated for product ${item.product_id}`))
                      .catch(err => console.error("Error recalculating stock:", err));
                  });
                })
                .catch(err => console.error("Error reading items:", err));
            })
            .catch(function (error) {
              console.error("Error sending shipping email:", error);
            });
        } else {
          console.error("Error:", response.data.message);
        }
      })
      .catch(function (error) {
        console.error("Error shipping order:", error);
      });
  };


  $scope.returnOrder = function () {
    const payload = {
      status_id: 6,
      remarks: $scope.returnRemarks || "Order returned"
    };

    $http.post("../Core/Controller/OrderController.php?action=returnOrder&id=" + $scope.selectedParent.order_id, payload)
      .then(function (response) {
        if (response.data.status === "success") {
          // Hide modal
          $('#returnOrder').modal('hide');

          // Build email content
          const emailData = {
            to: $scope.selectedParent.email,
            subject: `Order #${$scope.selectedParent.order_id} - Payment Proof Rejected`,
            body: `
            <div style="font-family: Arial, sans-serif; background-color: #f7f9fb; padding: 20px;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
                
                <div style="background-color: #d9534f; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0;">Payment Review Failed</h2>
                </div>

                <div style="padding: 25px; color: #333;">
                  <p style="font-size: 16px;">Hi <strong>${$scope.selectedParent.email}</strong>,</p>
                  <p>We’ve reviewed your submitted payment proof for <strong>Order #${$scope.selectedParent.order_id}</strong>, and unfortunately, it has been <span style="color:#d9534f; font-weight: bold;">rejected</span>.</p>

                  <div style="background: #f9f1f1; border-left: 5px solid #d9534f; padding: 10px 15px; margin: 15px 0;">
                    <p style="margin: 0; font-size: 15px;">
                      <strong>Remarks:</strong><br>
                      ${$scope.returnRemarks || 'No specific remarks were provided.'}
                    </p>
                  </div>

                  <p>You may re-upload a new proof of payment for review in your account dashboard.</p>

                  <p style="margin-top: 20px;">Thank you for your understanding,<br>
                  <strong>Your Support Team</strong></p>
                </div>

                <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #888;">
                  <p style="margin: 0;">© ${new Date().getFullYear()} Motor Online Store. All rights reserved.</p>
                </div>

              </div>
            </div>
          `
          };

          // Send email after updating status
          $http.post('../Core/Controller/email.php?action=send', emailData)
            .then(function (emailResponse) {
              console.log("Email sent successfully:", emailResponse.data);
              getAllTransactions(); // refresh UI
              $scope.returnRemarks = ""; // clear textarea
            })
            .catch(function (error) {
              console.error("Error sending email:", error);
            });

        } else {
          console.error(response.data.message);
        }
      })
      .catch(function (error) {
        console.error("Error returning order:", error);
      });
  };



});
