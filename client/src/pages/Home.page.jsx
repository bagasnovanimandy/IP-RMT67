import { useEffect, useState } from "react";
import { Link } from "react-router";
import { serverApi } from "../helpers/serverApi";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}

export default function HomePage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serverApi.get("/vehicles");
        setVehicles(data);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Fetch failed";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-center my-5">Loading vehicles...</p>;
  if (err) return <div className="alert alert-danger">{err}</div>;
  if (!vehicles.length)
    return <div className="alert alert-warning">Data kendaraan kosong.</div>;

  return (
    <>
      <h1 className="h4 mb-4">Daftar Mobil</h1>

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {vehicles.map((v) => (
          <div className="col" key={v.id}>
            <div className="card h-100 shadow-sm">
              {v.imgUrl ? (
                <img
                  src={v.imgUrl}
                  alt={v.name}
                  className="card-img-top"
                  style={{ objectFit: "cover", height: 180 }}
                />
              ) : (
                <div
                  className="bg-light d-flex align-items-center justify-content-center"
                  style={{ height: 180 }}
                >
                  <span className="text-muted">No image</span>
                </div>
              )}

              <div className="card-body">
                <h5 className="card-title text-truncate" title={v.name}>
                  {v.name}
                </h5>
                <p className="card-text mb-1">
                  <strong>Rp {rupiah(v.dailyPrice)}</strong> / hari
                </p>
                <p className="card-text text-muted mb-3">
                  {v?.Branch?.name} · {v?.Branch?.city}
                </p>
                <Link
                  to={`/vehicles/${v.id}`}
                  className="btn btn-primary w-100"
                >
                  Detail
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
