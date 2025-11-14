import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { getPaymentStatus } from "../helpers/payment";
import { alert } from "../lib/alert";

export default function PaymentFailedPage() {
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

  const handleRetryPayment = async () => {
    if (!bookingId) return;
    try {
      navigate(`/payment/checkout/${bookingId}`);
    } catch (error) {
      await alert.error("Gagal memuat halaman pembayaran");
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-danger" role="status">
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
                  className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: 80, height: 80 }}
                >
                  <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: "3rem" }}>✗</i>
                </div>
              </div>
              <h2 className="text-danger mb-3">Pembayaran Gagal</h2>
              <p className="text-muted mb-4">
                Maaf, pembayaran Anda gagal diproses. Silakan coba lagi atau gunakan metode
                pembayaran lain.
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
                        <span className="badge bg-danger">
                          {paymentData.payment?.transactionStatus || "failed"}
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

              <div className="alert alert-warning">
                <small>
                  <strong>Tips:</strong> Pastikan saldo atau limit kartu Anda mencukupi. Jika
                  masalah berlanjut, silakan hubungi customer service.
                </small>
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-primary"
                  onClick={handleRetryPayment}
                >
                  Coba Lagi
                </button>
                <Link to="/mybookings" className="btn btn-outline-secondary">
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

