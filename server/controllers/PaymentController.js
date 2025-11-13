const PaymentService = require("../services/paymentService");
const { Booking, Payment, User } = require("../models");

class PaymentController {
  /**
   * POST /api/payments/midtrans/checkout
   * Create Snap transaction for a booking
   */
  static async checkout(req, res, next) {
    try {
      const { bookingId } = req.body;
      const { id: userId } = req.user;

      if (!bookingId) {
        return res.status(400).json({ message: "bookingId is required" });
      }

      // Find booking and verify ownership
      const booking = await Booking.findOne({
        where: { id: bookingId, UserId: userId },
        include: [{ model: User }],
      });

      if (!booking) {
        return res
          .status(404)
          .json({ message: "Booking not found or access denied" });
      }

      // Only allow checkout for PENDING_PAYMENT bookings
      if (booking.status !== "PENDING_PAYMENT") {
        return res.status(400).json({
          message: `Cannot checkout booking with status: ${booking.status}`,
        });
      }

      // Create Snap transaction
      const result = await PaymentService.createSnapTransactionForBooking(
        booking,
        booking.User
      );

      res.status(200).json({
        message: "Payment transaction created",
        snapToken: result.snapToken,
        redirectUrl: result.redirectUrl,
        payment: {
          id: result.payment.id,
          orderId: result.payment.orderId,
          status: result.payment.transactionStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/midtrans/notification
   * Webhook handler for Midtrans notifications
   * Note: This endpoint should bypass authentication but validate signature if possible
   */
  static async handleNotification(req, res, next) {
    try {
      const notificationPayload = req.body;

      // Handle notification
      const result = await PaymentService.handleMidtransNotification(
        notificationPayload
      );

      if (!result) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Return success response to Midtrans
      res.status(200).json({
        message: "Notification processed",
        orderId: result.payment.orderId,
        transactionStatus: result.payment.transactionStatus,
        bookingStatus: result.booking?.status,
      });
    } catch (error) {
      console.error("Error processing Midtrans notification:", error);
      // Still return 200 to Midtrans to prevent retries for invalid requests
      res.status(200).json({
        message: "Notification received but processing failed",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/payments/:bookingId
   * Get payment status for a booking
   */
  static async getPaymentStatus(req, res, next) {
    try {
      const { bookingId } = req.params;
      const { id: userId, role } = req.user;

      // Find booking
      const booking = await Booking.findByPk(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check authorization: user can only see their own bookings, admin/staff can see all
      if (booking.UserId !== userId && role !== "admin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get payment
      const payment = await PaymentService.getPaymentByBookingId(bookingId);

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found for this booking",
          booking: {
            id: booking.id,
            status: booking.status,
            totalPrice: booking.totalPrice,
          },
        });
      }

      res.status(200).json({
        payment: {
          id: payment.id,
          orderId: payment.orderId,
          transactionStatus: payment.transactionStatus,
          fraudStatus: payment.fraudStatus,
          paymentType: payment.paymentType,
          grossAmount: payment.grossAmount,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        },
        booking: {
          id: booking.id,
          status: booking.status,
          totalPrice: booking.totalPrice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;

