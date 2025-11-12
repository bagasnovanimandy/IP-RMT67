import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { serverApi } from "../helpers/serverApi";

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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serverApi.get(`/vehicles/${id}`);
        setVehicle(data);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Fetch failed";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="h5 mb-3">Spesifikasi</h3>
              <ul className="list-unstyled mb-3">
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

              <h4 className="h6">Deskripsi</h4>
              <p className="mb-0">{vehicle.description || "-"}</p>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <Link to="/" className="btn btn-outline-secondary">
              Kembali
            </Link>
            <button className="btn btn-primary" disabled>
              Book Now (next step)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
