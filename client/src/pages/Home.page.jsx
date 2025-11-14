import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { serverApi } from "../helpers/serverApi";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}

const CITY_OPTIONS = ["ALL", "Jakarta", "Bandung"]; // sesuai seed

export default function HomePage() {
  const navigate = useNavigate();

  // ==== STATE: Query Vehicles (server-side) ====
  const [q, setQ] = useState("");
  const [city, setCity] = useState("ALL");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const params = useMemo(() => {
    const p = {
      q: q || undefined,
      city: city !== "ALL" ? city : undefined,
      min: min || undefined,
      max: max || undefined,
      sort,
      order,
      page,
      limit,
    };
    return p;
  }, [q, city, min, max, sort, order, page, limit]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await serverApi.get("/vehicles", { params });
        if (!alive) return;
        setItems(data?.data || []);
        setMeta(data?.meta || null);
      } catch (e) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message || e?.message || "Gagal memuat kendaraan";
        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params]);

  useEffect(() => {
    setPage(1);
  }, [q, city, min, max, sort, order, limit]);

  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? items.length;
  const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // ==== STATE: Kotak AI Generative (placeholder Gemini) ====
  const [aiPrompt, setAiPrompt] = useState("");

  function handleAskAI(e) {
    e.preventDefault();
    const query = aiPrompt.trim();
    if (!query) return;
    
    // Build query string - AI akan mengekstrak originCity dari prompt
    const params = new URLSearchParams();
    params.set("query", query);
    
    navigate(`/recommendations?${params.toString()}`);
  }

  return (
    <>
      {/* ====== Hero / AI Box ====== */}
      <div className="hero-card">
        <h2 className="h4 mb-3">🤖 AI Rekomendasi Perjalanan (Gemini)</h2>
        <p className="mb-4" style={{ opacity: 0.95 }}>
          Sampaikan keperluan travellingmu di sini (misal: "berangkat dari jakarta, keluarga 6 orang,
          3 hari di Bandung, butuh bagasi besar, budget 400–600 ribu/hari").
        </p>

        <form onSubmit={handleAskAI}>
          <div className="mb-3">
            <label className="form-label small text-muted mb-1">
              <strong>Kebutuhan Perjalanan</strong>
            </label>
            <textarea
              className="form-control"
              rows="3"
              placeholder='Contoh: "berangkat dari jakarta, keluarga 6 orang, 3 hari di Bandung, butuh bagasi besar, budget 400–600 ribu/hari"'
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{ resize: 'none' }}
            />
            <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
              AI akan menganalisis lokasi awal Anda dan memberikan rekomendasi cabang terdekat
            </small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button type="submit" className="btn btn-light">
              ✨ Dapatkan Rekomendasi
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => setAiPrompt("")}
            >
              🔄 Reset
            </button>
          </div>
          <small className="d-block mt-3" style={{ opacity: 0.9 }}>
            *Fitur AI menggunakan Gemini — segera aktif. Untuk sekarang akan
            menuju halaman rekomendasi dengan hasil placeholder.
          </small>
        </form>
      </div>

      {/* ====== Toolbar Filter/List ====== */}
      <div className="filter-section">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h4 mb-1 fw-bold">🚗 Daftar Mobil</h1>
            <small className="text-muted">
              {totalItems} hasil{" "}
              {q || city !== "ALL" || min || max ? (
                <span className="badge bg-primary">terfilter</span>
              ) : (
                ""
              )}
            </small>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="row g-3">
          {/* Search & City */}
          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label small text-muted mb-1">
              <strong>Cari Kendaraan</strong>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                🔎
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Nama, brand, type, atau plat..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small text-muted mb-1">
              <strong>Kota</strong>
            </label>
            <select
              className="form-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "Semua Kota" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="col-12 col-md-6 col-lg-3">
            <label className="form-label small text-muted mb-1">
              <strong>Rentang Harga (Rp/hari)</strong>
            </label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                placeholder="Min"
                min={0}
                value={min}
                onChange={(e) => setMin(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
              <span className="input-group-text bg-white" style={{ fontSize: '0.9rem' }}>
                -
              </span>
              <input
                type="number"
                className="form-control"
                placeholder="Max"
                min={0}
                value={max}
                onChange={(e) => setMax(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Sort & Limit */}
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">
              <strong>Urutkan</strong>
            </label>
            <select
              className="form-select"
              value={`${sort}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(":");
                setSort(s);
                setOrder(o);
              }}
            >
              <option value="createdAt:DESC">Terbaru</option>
              <option value="createdAt:ASC">Terlama</option>
              <option value="dailyPrice:ASC">Harga termurah</option>
              <option value="dailyPrice:DESC">Harga termahal</option>
              <option value="year:DESC">Tahun terbaru</option>
              <option value="year:ASC">Tahun terlama</option>
              <option value="name:ASC">Nama A-Z</option>
              <option value="name:DESC">Nama Z-A</option>
            </select>
          </div>
        </div>

        {/* Items per page - separate row */}
        <div className="row mt-3">
          <div className="col-12 col-md-6 col-lg-2">
            <label className="form-label small text-muted mb-1">
              <strong>Tampilkan per halaman</strong>
            </label>
            <select
              className="form-select"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[6, 9, 12, 18, 24].map((n) => (
                <option key={n} value={n}>
                  {n} item
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ====== List Kendaraan ====== */}
      {loading ? (
        <div className="loading-spinner"></div>
      ) : err ? (
        <div className="alert alert-danger">
          <strong>Error:</strong> {err}
        </div>
      ) : totalItems === 0 ? (
        <div className="alert alert-warning text-center">
          <strong>Tidak ada data yang cocok.</strong> Coba ubah kata kunci atau filter.
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {items.map((v) => (
              <div className="col" key={v.id}>
                <div className="card vehicle-card h-100">
                  {v.imgUrl ? (
                    <img
                      src={v.imgUrl}
                      alt={v.name}
                      className="card-img-top"
                      style={{ objectFit: "cover", height: 200 }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ height: 200, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
                    >
                      <span className="text-muted">📷 No image</span>
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="card-title" title={v.name}>
                      {v.name}
                    </h5>
                    <p className="price">
                      Rp {rupiah(v.dailyPrice)} <small className="text-muted">/hari</small>
                    </p>
                    <p className="location">
                      📍 {v?.Branch?.name} · {v?.Branch?.city}
                    </p>
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="btn btn-primary w-100"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => go(page - 1)}>
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <li
                  key={p}
                  className={`page-item ${p === page ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => go(p)}>
                    {p}
                  </button>
                </li>
              ))}
              <li
                className={`page-item ${page === totalPages ? "disabled" : ""}`}
              >
                <button className="page-link" onClick={() => go(page + 1)}>
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
