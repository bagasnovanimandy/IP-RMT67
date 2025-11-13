import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { serverApi } from "../helpers/serverApi";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}

export default function RecommendationsPage() {
  const queryParams = useQuery();
  const q = queryParams.get("query") || "";
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [filters, setFilters] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        // AI akan mengekstrak originCity dari prompt
        const { data } = await serverApi.post("/ai/recommend", { prompt: q });
        if (!alive) return;
        
        // Set reason dan filters
        const reasonText = data?.reason || "";
        setReason(reasonText);
        setFilters(data?.filters || null);
        setItems(data?.data || []);
        
        // Cek apakah reason mengandung error - jika ya, tampilkan sebagai warning bukan error
        if (reasonText.includes("Error during analysis")) {
          // Ini bukan error fatal, hanya warning karena masih ada fallback
          setErr("");
        }
      } catch (e) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Gagal memuat rekomendasi";
        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (q) {
      run();
    } else {
      setLoading(false);
      setErr("Prompt tidak boleh kosong");
    }
    
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 mb-0">Rekomendasi Kendaraanmu</h1>
        <Link to="/" className="btn btn-outline-secondary">
          ← Kembali
        </Link>
      </div>

      <div className="alert alert-info">
        <div className="fw-semibold mb-1">Prompt kamu:</div>
        <div className="small">{q || "-"}</div>
      </div>

      {loading ? (
        <p className="text-center my-5">
          Menganalisis kebutuhanmu via Gemini...
        </p>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : (
        <>
          {/* Tampilkan warning jika ada error dalam analysis tapi tetap ada hasil */}
          {reason && reason.includes("Error during analysis") && (
            <div className="alert alert-warning mb-3">
              <strong>Peringatan:</strong> {reason}
              <br />
              <small>Menggunakan fallback parsing untuk mengekstrak informasi.</small>
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h6 mb-2">Analisis AI</h2>
              <p className="mb-2">
                {reason && !reason.includes("Error during analysis") ? (
                  <span className="text-success">✓ {reason}</span>
                ) : reason ? (
                  <span className="text-muted">{reason}</span>
                ) : (
                  "Analisis AI akan muncul di sini."
                )}
              </p>

              {filters && (
                <div className="small text-muted mt-3">
                  <span className="me-2 fw-semibold">Filter yang diterapkan:</span>
                  {filters.originCity && (
                    <span className="badge text-bg-primary me-2">
                      Lokasi Awal: {filters.originCity}
                    </span>
                  )}
                  {filters.city && !filters.originCity && (
                    <span className="badge text-bg-info me-2">
                      Kota: {filters.city}
                    </span>
                  )}
                  {Number.isFinite(filters.people) && (
                    <span className="badge text-bg-success me-2">
                      Penumpang: {filters.people} orang
                    </span>
                  )}
                  {filters.type && (
                    <span className="badge text-bg-secondary me-2">
                      Tipe: {filters.type}
                    </span>
                  )}
                  {Number.isFinite(filters.min) && Number.isFinite(filters.max) ? (
                    <span className="badge text-bg-warning me-2">
                      Harga: Rp {rupiah(filters.min)} - Rp {rupiah(filters.max)}/hari
                    </span>
                  ) : Number.isFinite(filters.min) ? (
                    <span className="badge text-bg-warning me-2">
                      Min: Rp {rupiah(filters.min)}/hari
                    </span>
                  ) : Number.isFinite(filters.max) ? (
                    <span className="badge text-bg-warning">
                      Max: Rp {rupiah(filters.max)}/hari
                    </span>
                  ) : null}
                  {Number.isFinite(filters.days) && (
                    <span className="badge text-bg-info">
                      Durasi: {filters.days} hari
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {!items.length ? (
            <div className="alert alert-warning">
              Belum ada kendaraan yang cocok. Coba perjelas prompt atau ubah
              batas harga.
            </div>
          ) : (
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
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
