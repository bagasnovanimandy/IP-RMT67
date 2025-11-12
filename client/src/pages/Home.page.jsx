import { useEffect, useMemo, useState } from "react";
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

  // UI state: search, filter, pagination
  const [q, setQ] = useState("");
  const [city, setCity] = useState("ALL");
  const [perPage, setPerPage] = useState(6);
  const [page, setPage] = useState(1);

  // fetch data
  useEffect(() => {
    (async () => {
      try {
        const { data } = await serverApi.get("/vehicles");
        setVehicles(data || []);
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Fetch failed";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // unique city options (from Branch.city)
  const cityOptions = useMemo(() => {
    const set = new Set(
      (vehicles || []).map((v) => v?.Branch?.city).filter(Boolean)
    );
    return ["ALL", ...Array.from(set).sort()];
  }, [vehicles]);

  // filtered list
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (vehicles || []).filter((v) => {
      const okCity = city === "ALL" ? true : v?.Branch?.city === city;
      if (!okCity) return false;

      if (!term) return true;
      const hay = `${v?.name || ""} ${v?.brand || ""} ${v?.type || ""} ${
        v?.Branch?.name || ""
      } ${v?.Branch?.city || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [vehicles, q, city]);

  // pagination data
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  // reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [q, city, perPage]);

  // ui helpers
  const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  if (loading) return <p className="text-center my-5">Loading vehicles...</p>;
  if (err) return <div className="alert alert-danger">{err}</div>;

  return (
    <>
      <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Daftar Mobil</h1>
          <small className="text-muted">
            {totalItems} hasil {q || city !== "ALL" ? "(terfilter)" : ""}
          </small>
        </div>

        <div className="ms-auto d-flex flex-wrap gap-2">
          <div className="input-group" style={{ minWidth: 260 }}>
            <span className="input-group-text" id="search-addon">
              🔎
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari nama/brand/lokasi…"
              aria-label="search"
              aria-describedby="search-addon"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ minWidth: 160 }}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Filter kota"
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Semua Kota" : c}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 120 }}
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            aria-label="Per halaman"
          >
            {[6, 9, 12, 18].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="alert alert-warning">
          Tidak ada data yang cocok. Coba ubah kata kunci atau filter kota.
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {paged.map((v) => (
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

          {/* Pagination */}
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => go(currentPage - 1)}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${p === currentPage ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => go(p)}>
                    {p}
                  </button>
                </li>
              ))}

              <li
                className={`page-item ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => go(currentPage + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
