import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";

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
    if (isNaN(dt)) return d;
    return dt.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return d;
  }
}

function diffDays(a, b) {
  try {
    const s = new Date(a);
    const e = new Date(b);
    const diff = (e - s) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  } catch {
    return 0;
  }
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const isLoggedIn = useMemo(() => !!localStorage.getItem("gcr_token"), []);
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
        const msg =
          e?.response?.data?.message || e?.message || "Gagal memuat bookings";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, navigate]);

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
                <th style={{ width: 140 }} className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const days = diffDays(b.startDate, b.endDate);
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
                      <span className="badge text-bg-secondary">
                        {b.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          disabled
                        >
                          Pay
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled
                        >
                          Cancel
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
