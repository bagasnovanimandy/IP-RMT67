// src/pages/Register.page.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { alert } from "../lib/alert";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await serverApi.post("/register", {
        name,
        email,
        password,
        phoneNumber,
      });
      await alert.success("Registrasi berhasil! Mengarahkan ke halaman login...");
      navigate("/login");
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Registrasi gagal";
      await alert.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Register</h1>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nama</label>
                <input
                  className="form-control"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">No. HP</label>
                <input
                  className="form-control"
                  placeholder="+62..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-warning w-100" disabled={loading}>
                {loading ? "Mendaftar..." : "Create Account"}
              </button>
            </form>

            <p className="mt-3 mb-0">
              Sudah punya akun? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
