import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { alert } from "../lib/alert";
import { initSnapPayment } from "../helpers/payment";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}
function toDateStr(d) {
  try {
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toISOString().slice(0, 10);
  } catch {
    return d;
  }
}
function diffDays(a, b) {
  try {
    const s = new Date(a),
      e = new Date(b);
    const diff = (e - s) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  } catch {
    return 0;
  }
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const isLoggedIn = useMemo(
    () =>
      !!(
        localStorage.getItem("gjt_token") || localStorage.getItem("gcr_token")
      ),
    []
  );
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const { data } = await serverApi.get("/bookings/me");
        setBookings(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, navigate]);

  async function reload() {
    const { data } = await serverApi.get("/bookings/me");
    setBookings(data);
  }

  async function handleCancel(id) {
    const ans = await alert.confirm({
      title: "Batalkan booking?",
      text: "Status akan menjadi CANCELED.",
      confirmText: "Ya, batalkan",
    });
    if (!ans.isConfirmed) return;
    try {
      await serverApi.patch(`/bookings/${id}/cancel`);
      await alert.toast("Booking dibatalkan", "success");
      await reload();
    } catch (e) {
      await alert.error(e.message);
    }
  }

  async function handleDelete(id) {
    const ans = await alert.confirm({
      title: "Hapus booking?",
      text: "Tindakan ini tidak bisa dibatalkan.",
      confirmText: "Hapus",
    });
    if (!ans.isConfirmed) return;
    try {
      await serverApi.delete(`/bookings/${id}`);
      await alert.toast("Booking dihapus", "success");
      await reload();
    } catch (e) {
      await alert.error(e.message);
    }
  }

  async function handlePay(bookingId) {
    try {
      // Navigate to payment checkout page
      navigate(`/payment/checkout/${bookingId}`);
    } catch (e) {
      await alert.error(e.message || "Gagal memuat halaman pembayaran");
    }
  }

  if (!isLoggedIn) return null;
  if (loading) return <p className="text-center my-5">Loading bookings...</p>;
  if (err) return <div className="alert alert-danger">{err}</div>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">My Bookings</h1>
        <Link to="/" className="btn btn-outline-secondary">
          ← Back to Home
        </Link>
      </div>

      {!bookings.length ? (
        <div className="alert alert-warning">
          Kamu belum memiliki booking. Cari mobil di{" "}
          <Link to="/">halaman Home</Link>.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Vehicle</th>
                <th className="text-nowrap">Start</th>
                <th className="text-nowrap">End</th>
                <th className="text-center">Days</th>
                <th className="text-end">Price</th>
                <th className="text-center">Status</th>
                <th style={{ width: 180 }} className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const days = diffDays(b.startDate, b.endDate);
                const badgeClass =
                  b.status === "PENDING_PAYMENT"
                    ? "text-bg-warning"
                    : b.status === "PAID"
                    ? "text-bg-success"
                    : b.status === "CANCELLED" || b.status === "CANCELED"
                    ? "text-bg-danger"
                    : b.status === "COMPLETED"
                    ? "text-bg-info"
                    : b.status === "PENDING"
                    ? "text-bg-secondary"
                    : b.status === "CONFIRMED"
                    ? "text-bg-primary"
                    : "text-bg-secondary";
                return (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {b.Vehicle?.imgUrl ? (
                          <img
                            src={b.Vehicle.imgUrl}
                            alt={b.Vehicle.name}
                            width={56}
                            height={36}
                            className="rounded me-2"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            className="bg-light border rounded me-2 d-flex align-items-center justify-content-center"
                            style={{ width: 56, height: 36 }}
                          >
                            <small className="text-muted">No Img</small>
                          </div>
                        )}
                        <div>
                          <div className="fw-semibold">
                            {b.Vehicle?.name || "-"}
                          </div>
                          <small className="text-muted">#{b.VehicleId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap">{toDateStr(b.startDate)}</td>
                    <td className="text-nowrap">{toDateStr(b.endDate)}</td>
                    <td className="text-center">{days}</td>
                    <td className="text-end">Rp {rupiah(b.totalPrice)}</td>
                    <td className="text-center">
                      <span className={`badge ${badgeClass}`}>{b.status}</span>
                    </td>
                    <td className="text-center">
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handlePay(b.id)}
                          disabled={b.status !== "PENDING_PAYMENT"}
                          title={
                            b.status !== "PENDING_PAYMENT"
                              ? "Hanya booking dengan status PENDING_PAYMENT yang bisa dibayar"
                              : "Bayar booking"
                          }
                        >
                          Pay
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancel(b.id)}
                          disabled={b.status !== "PENDING_PAYMENT"}
                          title={
                            b.status !== "PENDING_PAYMENT"
                              ? "Hanya PENDING_PAYMENT bisa dibatalkan"
                              : "Batalkan booking"
                          }
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleDelete(b.id)}
                          title="Hapus booking"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
