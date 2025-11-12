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

const CITY_OPTIONS = ["ALL", "Jakarta", "Bandung"]; // dari seed saat ini

export default function HomePage() {
  // query state
  const [q, setQ] = useState("");
  const [city, setCity] = useState("ALL");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  // data state
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // compose params (city=ALL -> kosong)
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

  // fetch server-side
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

  // reset page saat filter berubah (kecuali page itu sendiri)
  useEffect(() => {
    setPage(1);
  }, [q, city, min, max, sort, order, limit]);

  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? items.length;

  const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  if (loading) return <p className="text-center my-5">Loading vehicles...</p>;
  if (err) return <div className="alert alert-danger">{err}</div>;

  return (
    <>
      <div className="d-flex flex-wrap align-items-end gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1">Daftar Mobil</h1>
          <small className="text-muted">
            {totalItems} hasil{" "}
            {q || city !== "ALL" || min || max ? "(terfilter)" : ""}
          </small>
        </div>

        <div className="ms-auto d-flex flex-wrap gap-2">
          {/* search */}
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

          {/* city */}
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

          {/* price range */}
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

          {/* sort */}
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

          {/* per page */}
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

      {totalItems === 0 ? (
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
