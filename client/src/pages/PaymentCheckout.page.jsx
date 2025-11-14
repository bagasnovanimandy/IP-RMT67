import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { initSnapPayment } from "../helpers/payment";
import { alert } from "../lib/alert";

export default function PaymentCheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapOpened, setSnapOpened] = useState(false);
  const hasInitialized = useRef(false); // Prevent multiple calls
  const isUnmounting = useRef(false); // Track if component is unmounting

  useEffect(() => {
    // Prevent multiple calls (React Strict Mode in development)
    if (hasInitialized.current || isUnmounting.current) {
      return;
    }

    if (!bookingId) {
      setError("Booking ID tidak valid");
      setLoading(false);
      return;
    }

    // Wait for Snap JS to be loaded
    const waitForSnap = () => {
      return new Promise((resolve, reject) => {
        if (typeof window !== "undefined" && window.snap) {
          resolve();
          return;
        }

        // Check every 100ms for max 5 seconds
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
          attempts++;
          if (typeof window !== "undefined" && window.snap) {
            clearInterval(interval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error("Midtrans Snap JS failed to load"));
          }
        }, 100);
      });
    };

    // Create payment transaction and open Snap
    (async () => {
      try {
        hasInitialized.current = true;
        setLoading(true);

        // Wait for Snap JS to load
        await waitForSnap();

        const { data } = await serverApi.post("/payments/midtrans/checkout", {
          bookingId: parseInt(bookingId, 10),
        });

        if (data.snapToken) {
          // Small delay to ensure everything is ready
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Mark that snap is about to open
          setSnapOpened(true);
          setError(""); // Clear any previous errors

          // Initialize Snap payment
          initSnapPayment(data.snapToken, {
            onSuccess: (result) => {
              console.log("Payment success:", result);
              navigate(`/payment/success?order_id=${result.order_id}&booking_id=${bookingId}`);
            },
            onPending: (result) => {
              console.log("Payment pending:", result);
              navigate(`/payment/pending?order_id=${result.order_id}&booking_id=${bookingId}`);
            },
            onError: (result) => {
              console.error("Payment error:", result);
              navigate(`/payment/failed?order_id=${result.order_id}&booking_id=${bookingId}`);
            },
            onClose: () => {
              // Mark as unmounting to prevent any re-initialization
              isUnmounting.current = true;
              
              // User closed the popup, redirect to bookings page
              // Use setTimeout to ensure navigation happens after state cleanup
              setTimeout(() => {
                try {
                  alert.info("Pembayaran dibatalkan. Anda dapat melakukan pembayaran nanti dari halaman My Bookings.");
                  navigate("/mybookings");
                } catch (error) {
                  console.error("Error in onClose navigation:", error);
                  // Fallback: just navigate without alert
                  navigate("/mybookings");
                }
              }, 200);
            },
          });
        } else {
          setError("Gagal mendapatkan token pembayaran");
        }
      } catch (err) {
        console.error("Error creating payment:", err);
        setError(err.message || "Gagal memproses pembayaran");
        await alert.error(err.message || "Gagal memproses pembayaran");
      } finally {
        setLoading(false);
      }
    })();

    // Cleanup function
    return () => {
      isUnmounting.current = true;
      // Reset global flag if component unmounts
      if (typeof window !== "undefined") {
        window._snapPaymentInProgress = false;
      }
    };
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Mempersiapkan halaman pembayaran...</p>
      </div>
    );
  }

  // Don't show error if snap popup is already opened
  if (error && !snapOpened) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/mybookings")}
          >
            Kembali ke My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ display: snapOpened ? "none" : "block" }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">
          {snapOpened ? "Halaman pembayaran sedang dibuka..." : "Mempersiapkan halaman pembayaran..."}
        </p>
        <p className="text-muted small">
          Jika halaman pembayaran tidak muncul, pastikan pop-up tidak diblokir.
        </p>
      </div>
    </div>
  );
}

