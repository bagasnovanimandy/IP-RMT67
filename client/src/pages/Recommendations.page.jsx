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
  const q = useQuery().get("query") || "";
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(""); // ringkasan “alasan” (nanti dari Gemini)
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function fetchRecommendations() {
      setLoading(true);
      setErr("");
      try {
        // === PLACEHOLDER LOGIC ===
        // Contoh sangat sederhana: deteksi kata kunci & panggil /vehicles dengan filter yang mendekati.
        const lower = q.toLowerCase();

        let min, max, type, city;
        if (lower.includes("keluarga") || lower.includes("rombongan"))
          type = "MPV";
        if (
          lower.includes("banyak orang") ||
          lower.includes("rombongan") ||
          lower.includes("elf") ||
          lower.includes("hiace")
        )
          type = "VAN";
        if (lower.includes("hemat") || lower.includes("murah")) max = 350000;
        if (lower.includes("bandung")) city = "Bandung";
        if (lower.includes("jakarta")) city = "Jakarta";

        const params = {
          q: type, // kita pakai ke kolom type/name/brand
          min,
          max,
          city,
          sort: "dailyPrice",
          order: "ASC",
          page: 1,
          limit: 12,
        };

        const { data } = await serverApi.get("/vehicles", { params });

        if (!alive) return;

        setItems(data?.data || []);
        setReason(
          `Rekomendasi berdasarkan prompt: “${q}”. ` +
            `Filter awal: ${type ? `tipe ${type}, ` : ""}${
              city ? `kota ${city}, ` : ""
            }` +
            `${min ? `min Rp ${min}, ` : ""}${
              max ? `max Rp ${max}` : ""
            }`.trim()
        );
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

    fetchRecommendations();
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
        <p className="text-center my-5">Menganalisis kebutuhanmu...</p>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h2 className="h6 mb-2">Alasan singkat</h2>
              <p className="mb-0">
                {reason || "Analisis AI akan muncul di sini."}
              </p>
              <small className="text-muted d-block mt-1">
                *Akan ditingkatkan dengan Gemini untuk memahami konteks lengkap.
              </small>
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
