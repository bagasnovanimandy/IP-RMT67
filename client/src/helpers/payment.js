/**
 * Payment helper functions for Midtrans Snap integration
 */

/**
 * Initialize Midtrans Snap payment
 * @param {string} snapToken - Snap token from backend
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onSuccess - Called when payment succeeds
 * @param {Function} callbacks.onPending - Called when payment is pending
 * @param {Function} callbacks.onError - Called when payment fails
 * @param {Function} callbacks.onClose - Called when payment popup is closed
 */
export function initSnapPayment(snapToken, callbacks = {}) {
  if (typeof window === "undefined" || !window.snap) {
    console.error("Midtrans Snap JS not loaded");
    if (callbacks.onError) {
      callbacks.onError(new Error("Payment gateway not available"));
    }
    return;
  }

  // Prevent multiple calls to snap.pay()
  if (window._snapPaymentInProgress) {
    console.warn("Snap payment already in progress, ignoring duplicate call");
    return;
  }

  // Check if snap.pay is available and not in invalid state
  if (!window.snap.pay || typeof window.snap.pay !== "function") {
    console.error("snap.pay is not available");
    if (callbacks.onError) {
      callbacks.onError(new Error("Payment gateway not available"));
    }
    return;
  }

  window._snapPaymentInProgress = true;

  // Helper to safely reset flag and call callback
  const safeCallback = (callback, result) => {
    // Reset flag immediately to prevent issues
    window._snapPaymentInProgress = false;
    
    // Use setTimeout to ensure callback runs after state is reset
    setTimeout(() => {
      if (callback) {
        try {
          callback(result);
        } catch (error) {
          console.error("Error in payment callback:", error);
        }
      }
    }, 0);
  };

  try {
    window.snap.pay(snapToken, {
    onSuccess: (result) => {
      console.log("Payment success:", result);
      safeCallback(callbacks.onSuccess, result);
    },
    onPending: (result) => {
      console.log("Payment pending:", result);
      safeCallback(callbacks.onPending, result);
    },
    onError: (result) => {
      console.error("Payment error:", result);
      safeCallback(callbacks.onError, result);
    },
    onClose: () => {
      console.log("Payment popup closed");
      // Reset flag immediately
      window._snapPaymentInProgress = false;
      
      // Call onClose with a small delay to ensure state is clean
      setTimeout(() => {
        if (callbacks.onClose) {
          try {
            callbacks.onClose();
          } catch (error) {
            console.error("Error in onClose callback:", error);
          }
        }
      }, 100);
    },
  });
  } catch (error) {
    window._snapPaymentInProgress = false;
    console.error("Error calling snap.pay:", error);
    
    // Only call error callback if it's a real error, not a state error
    if (error.message && !error.message.includes("state transition")) {
      if (callbacks.onError) {
        try {
          callbacks.onError(error);
        } catch (e) {
          console.error("Error in error callback:", e);
        }
      }
    } else {
      // For state transition errors, just log and don't trigger error callback
      console.warn("Snap payment state error (likely popup was closed):", error.message);
    }
  }
}

/**
 * Get payment status from backend
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} Payment status
 */
export async function getPaymentStatus(bookingId, serverApi) {
  try {
    const { data } = await serverApi.get(`/payments/${bookingId}`);
    return data;
  } catch (error) {
    console.error("Error fetching payment status:", error);
    throw error;
  }
}

