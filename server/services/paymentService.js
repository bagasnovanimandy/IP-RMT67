const { snap } = require("../config/midtrans");
const { Booking, Payment, Vehicle } = require("../models");

class PaymentService {
  /**
   * Create a Snap transaction for a booking
   * @param {Object} booking - Booking instance
   * @param {Object} user - User instance
   * @returns {Promise<Object>} { snapToken, redirectUrl, payment }
   */
  static async createSnapTransactionForBooking(booking, user) {
    try {
      // Generate unique order_id
      const timestamp = Date.now();
      const orderId = `GJT-BOOKING-${booking.id}-${timestamp}`;

      // Check if payment already exists for this booking
      let payment = await Payment.findOne({
        where: { BookingId: booking.id },
        order: [["createdAt", "DESC"]],
      });

      // If payment exists and has snapToken, return existing
      if (payment && payment.snapToken) {
        return {
          snapToken: payment.snapToken,
          redirectUrl: payment.redirectUrl,
          payment,
        };
      }

      // Prepare Snap transaction parameters
      const transactionDetails = {
        order_id: orderId,
        gross_amount: booking.totalPrice,
      };

      const customerDetails = {
        first_name: user.name || user.fullName || "Customer",
        email: user.email,
        phone: user.phoneNumber || "",
      };

      const itemDetails = [
        {
          id: `VEHICLE-${booking.VehicleId}`,
          price: booking.totalPrice,
          quantity: 1,
          name: `Rental Vehicle - Booking #${booking.id}`,
        },
      ];

      const snapParams = {
        transaction_details: transactionDetails,
        customer_details: customerDetails,
        item_details: itemDetails,
        callbacks: {
          finish: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success`,
          unfinish: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/pending`,
          error: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/failed`,
        },
      };

      // Create Snap transaction
      console.log("Creating Snap transaction with params:", {
        order_id: snapParams.transaction_details.order_id,
        gross_amount: snapParams.transaction_details.gross_amount,
        customer_email: snapParams.customer_details.email,
      });
      
      const snapResponse = await snap.createTransaction(snapParams);

      // Save payment record
      if (!payment) {
        payment = await Payment.create({
          BookingId: booking.id,
          orderId: orderId,
          grossAmount: booking.totalPrice,
          transactionStatus: "pending",
          snapToken: snapResponse.token,
          redirectUrl: snapResponse.redirect_url,
        });
      } else {
        // Update existing payment
        payment.snapToken = snapResponse.token;
        payment.redirectUrl = snapResponse.redirect_url;
        payment.orderId = orderId;
        await payment.save();
      }

      return {
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        payment,
      };
    } catch (error) {
      console.error("Error creating Snap transaction:", error);
      console.error("Error details:", {
        message: error.message,
        statusCode: error.httpStatusCode,
        apiResponse: error.ApiResponse,
      });
      
      // Provide more detailed error message
      let errorMessage = `Failed to create payment transaction: ${error.message}`;
      if (error.httpStatusCode === 401) {
        errorMessage += ". Please check your Midtrans Server Key in .env file.";
      }
      if (error.ApiResponse) {
        try {
          const apiError = typeof error.ApiResponse === 'string' 
            ? JSON.parse(error.ApiResponse) 
            : error.ApiResponse;
          if (apiError.error_messages) {
            errorMessage += ` ${apiError.error_messages.join(', ')}`;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Handle Midtrans notification webhook
   * Updates payment and booking status based on Midtrans response
   * @param {Object} notificationPayload - Raw notification from Midtrans
   * @returns {Promise<Object>} Updated payment and booking
   */
  static async handleMidtransNotification(notificationPayload) {
    try {
      const { order_id, transaction_status, fraud_status, payment_type, settlement_time } =
        notificationPayload;

      if (!order_id) {
        throw new Error("order_id is required in notification payload");
      }

      // Find payment by orderId
      const payment = await Payment.findOne({
        where: { orderId: order_id },
        include: [
          {
            model: Booking,
            include: [{ model: Vehicle }],
          },
        ],
      });

      if (!payment) {
        console.warn(`Payment not found for order_id: ${order_id}`);
        return null;
      }

      // Check if already processed (idempotency)
      // Only update if status changed or if it's a settlement/capture
      const shouldUpdate =
        payment.transactionStatus !== transaction_status ||
        transaction_status === "settlement" ||
        transaction_status === "capture";

      if (!shouldUpdate && payment.transactionStatus === transaction_status) {
        console.log(
          `Payment ${order_id} already processed with status: ${transaction_status}`
        );
        return { payment, booking: payment.Booking };
      }

      // Update payment record
      payment.transactionStatus = transaction_status;
      payment.fraudStatus = fraud_status || null;
      payment.paymentType = payment_type || null;

      if (settlement_time) {
        payment.paidAt = new Date(settlement_time);
      } else if (transaction_status === "settlement" || transaction_status === "capture") {
        payment.paidAt = new Date();
      }

      await payment.save();

      // Update booking status based on transaction status
      const booking = payment.Booking;
      if (booking) {
        let newBookingStatus = booking.status;

        switch (transaction_status) {
          case "settlement":
          case "capture":
            // Payment successful
            if (fraud_status === "accept" || !fraud_status) {
              newBookingStatus = "PAID";
            } else if (fraud_status === "challenge") {
              newBookingStatus = "PENDING_PAYMENT"; // Wait for manual review
            }
            break;

          case "pending":
            newBookingStatus = "PENDING_PAYMENT";
            break;

          case "deny":
          case "expire":
          case "cancel":
            newBookingStatus = "CANCELLED";
            break;

          default:
            // Keep current status for other statuses
            break;
        }

        if (booking.status !== newBookingStatus) {
          booking.status = newBookingStatus;
          await booking.save();
        }
      }

      return { payment, booking };
    } catch (error) {
      console.error("Error handling Midtrans notification:", error);
      throw error;
    }
  }

  /**
   * Map Midtrans transaction status to Booking status
   * @param {String} transactionStatus - Midtrans transaction status
   * @param {String} fraudStatus - Midtrans fraud status
   * @returns {String} Booking status
   */
  static mapTransactionStatusToBookingStatus(transactionStatus, fraudStatus = null) {
    switch (transactionStatus) {
      case "settlement":
      case "capture":
        if (fraudStatus === "accept" || !fraudStatus) {
          return "PAID";
        } else if (fraudStatus === "challenge") {
          return "PENDING_PAYMENT";
        }
        return "PENDING_PAYMENT";

      case "pending":
        return "PENDING_PAYMENT";

      case "deny":
      case "expire":
      case "cancel":
        return "CANCELLED";

      default:
        return "PENDING_PAYMENT";
    }
  }

  /**
   * Get payment status for a booking
   * @param {Number} bookingId - Booking ID
   * @returns {Promise<Object>} Payment details
   */
  static async getPaymentByBookingId(bookingId) {
    const payment = await Payment.findOne({
      where: { BookingId: bookingId },
      include: [
        {
          model: Booking,
          include: [{ model: Vehicle }, { model: User }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return payment;
  }
}

module.exports = PaymentService;

