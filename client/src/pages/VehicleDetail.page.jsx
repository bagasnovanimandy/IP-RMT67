import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { alert } from "../lib/alert";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isLoggedIn = useMemo(
    () =>
      !!(
        localStorage.getItem("gjt_token") || localStorage.getItem("gcr_token")
      ),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serverApi.get(`/vehicles/${id}`);
        setVehicle(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = (e - s) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  }, [startDate, endDate]);

  const totalPrice = useMemo(
    () => (!vehicle || !days ? 0 : days * (vehicle.dailyPrice ?? 0)),
    [vehicle, days]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Cek login status terlebih dahulu
    if (!isLoggedIn) {
      const result = await alert.confirm({
        title: "🔐 Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk melakukan booking. Apakah Anda ingin login sekarang?",
        confirmText: "Ya, Login",
        cancelText: "Batal",
        icon: "warning",
      });
      if (result.isConfirmed) {
        navigate("/login");
      }
      return;
    }
    
    // Validasi tanggal
    if (!startDate || !endDate) {
      return alert.error("Silakan pilih tanggal mulai dan tanggal selesai terlebih dahulu");
    }
    
    if (days < 1) {
      return alert.error("Tanggal tidak valid. Tanggal selesai harus setelah tanggal mulai (min 1 hari)");
    }

    try {
      // Pastikan format data benar
      const vehicleId = Number(id);
      if (isNaN(vehicleId) || vehicleId <= 0) {
        return alert.error("ID kendaraan tidak valid");
      }

      // Pastikan tanggal dalam format ISO string
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = new Date(endDate).toISOString();

      // Validasi tanggal tidak boleh di masa lalu
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      if (startDateObj < today) {
        return alert.error("Tanggal mulai tidak boleh di masa lalu");
      }

      const bookingData = {
        VehicleId: vehicleId,
        startDate: startDateISO,
        endDate: endDateISO,
      };

      console.log("Sending booking data:", bookingData);

      await serverApi.post("/bookings", bookingData);
      await alert.success("Booking berhasil dibuat");
      navigate("/mybookings");
    } catch (error) {
      console.error("Booking error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal membuat booking";
      await alert.error(errorMessage);
    }
  }

  if (loading) return <p className="text-center my-5">Loading detail...</p>;
  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!vehicle)
    return <div className="alert alert-warning">Vehicle not found</div>;

  return (
    <>
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link px-0 me-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="h5 mb-0">{vehicle.name}</h2>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          {vehicle.imgUrl ? (
            <img
              src={vehicle.imgUrl}
              alt={vehicle.name}
              className="img-fluid rounded shadow-sm"
            />
          ) : (
            <div
              className="bg-light border rounded d-flex align-items-center justify-content-center"
              style={{ height: 320 }}
            >
              <span className="text-muted">No image</span>
            </div>
          )}

          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h3 className="h6 mb-3">Spesifikasi</h3>
              <ul className="list-unstyled mb-0">
                <li>
                  <strong>Harga:</strong> Rp {rupiah(vehicle.dailyPrice)} / hari
                </li>
                <li>
                  <strong>Kursi:</strong> {vehicle.seat}
                </li>
                <li>
                  <strong>Transmisi:</strong> {vehicle.transmission}
                </li>
                <li>
                  <strong>BBM:</strong> {vehicle.fuelType}
                </li>
                <li>
                  <strong>Tahun:</strong> {vehicle.year}
                </li>
                <li>
                  <strong>Plat:</strong> {vehicle.plateNumber}
                </li>
                <li>
                  <strong>Status:</strong> {vehicle.status}
                </li>
                <li>
                  <strong>Lokasi:</strong> {vehicle?.Branch?.name} ·{" "}
                  {vehicle?.Branch?.city}
                </li>
                {vehicle?.Branch?.address ? (
                  <li>
                    <strong>Alamat:</strong> {vehicle.Branch.address}
                  </li>
                ) : null}
              </ul>
              <hr />
              <h4 className="h6">Deskripsi</h4>
              <p className="mb-0">{vehicle.description || "-"}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h6 mb-3">Booking</h3>


              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tanggal Mulai</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tanggal Selesai</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1">
                    <strong>Durasi:</strong> {days} hari
                  </p>
                  <p className="mb-0">
                    <strong>Total:</strong> Rp {rupiah(totalPrice)}
                  </p>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <Link to="/" className="btn btn-outline-secondary">
                    Kembali
                  </Link>
                  <button
                    className="btn btn-primary"
                    type="submit"
                  >
                    Book Now
                  </button>
                </div>
              </form>

              <hr className="my-4" />
              <small className="text-muted">
                *Harga total dihitung otomatis dari selisih hari × harga per
                hari.
              </small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
