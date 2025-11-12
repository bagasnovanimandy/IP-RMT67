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
    // Untuk sekarang kita kirim via querystring; nanti endpoint Gemini bisa dipanggil dari halaman rekomendasi.
    navigate(`/recommendations?query=${encodeURIComponent(query)}`);
  }

  return (
    <>
      {/* ====== Hero / AI Box ====== */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h2 className="h5 mb-2">AI Rekomendasi Perjalanan (Gemini)</h2>
          <p className="text-muted mb-3">
            Sampaikan keperluan travellingmu di sini (misal: “keluarga 6 orang,
            3 hari di Bandung, butuh bagasi besar, budget 400–600 ribu/hari”).
          </p>

          <form onSubmit={handleAskAI}>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Tulis kebutuhan perjalananmu..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-dark">
                Dapatkan Rekomendasi
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setAiPrompt("")}
              >
                Reset
              </button>
            </div>
            <small className="text-muted d-block mt-2">
              *Fitur AI menggunakan Gemini — segera aktif. Untuk sekarang akan
              menuju halaman rekomendasi dengan hasil placeholder.
            </small>
          </form>
        </div>
      </div>

      {/* ====== Toolbar Filter/List ====== */}
      <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Daftar Mobil</h1>
          <small className="text-muted">
            {totalItems} hasil{" "}
            {q || city !== "ALL" || min || max ? "(terfilter)" : ""}
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
              placeholder="Cari nama/brand/type/plat…"
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
            {CITY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Semua Kota" : c}
              </option>
            ))}
          </select>

          <div className="input-group" style={{ width: 240 }}>
            <span className="input-group-text">Min</span>
            <input
              type="number"
              className="form-control"
              min={0}
              placeholder="0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
            <span className="input-group-text">Max</span>
            <input
              type="number"
              className="form-control"
              min={0}
              placeholder="9999999"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 170 }}
            value={`${sort}:${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":");
              setSort(s);
              setOrder(o);
            }}
            aria-label="Urutkan"
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

          <select
            className="form-select"
            style={{ width: 120 }}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            aria-label="Per halaman"
          >
            {[6, 9, 12, 18, 24].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ====== List Kendaraan ====== */}
      {loading ? (
        <p className="text-center my-5">Loading vehicles...</p>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : totalItems === 0 ? (
        <div className="alert alert-warning">
          Tidak ada data yang cocok. Coba ubah kata kunci atau filter.
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {items.map((v) => (
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
