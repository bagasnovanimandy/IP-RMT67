import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { getPaymentStatus } from "../helpers/payment";

export default function PaymentPendingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");
  const bookingId = searchParams.get("booking_id");
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      navigate("/mybookings");
      return;
    }

    // Fetch latest payment status
    (async () => {
      try {
        const data = await getPaymentStatus(parseInt(bookingId, 10), serverApi);
        setPaymentData(data);
      } catch (error) {
        console.error("Error fetching payment status:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <div className="mb-4">
                <div
                  className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 80, height: 80 }}
                >
                  <i className="bi bi-clock-history text-warning" style={{ fontSize: "3rem" }}>⏳</i>
                </div>
              </div>
              <h2 className="text-warning mb-3">Pembayaran Pending</h2>
              <p className="text-muted mb-4">
                Pembayaran Anda sedang diproses. Silakan tunggu konfirmasi dari pihak bank atau
                penyedia pembayaran.
              </p>

              {paymentData && (
                <div className="text-start mb-4">
                  <div className="border rounded p-3 bg-light">
                    <div className="row mb-2">
                      <div className="col-5">
                        <strong>Order ID:</strong>
                      </div>
                      <div className="col-7">{paymentData.payment?.orderId || orderId}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5">
                        <strong>Status:</strong>
                      </div>
                      <div className="col-7">
                        <span className="badge bg-warning">
                          {paymentData.payment?.transactionStatus || "pending"}
                        </span>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-5">
                        <strong>Total:</strong>
                      </div>
                      <div className="col-7">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          paymentData.booking?.totalPrice || 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="alert alert-info">
                <small>
                  <strong>Catatan:</strong> Status pembayaran akan diperbarui secara otomatis
                  setelah bank atau penyedia pembayaran mengkonfirmasi. Anda dapat mengecek status
                  di halaman My Bookings.
                </small>
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <Link to="/mybookings" className="btn btn-primary">
                  Lihat Booking Saya
                </Link>
                <Link to="/" className="btn btn-outline-secondary">
                  Kembali ke Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

