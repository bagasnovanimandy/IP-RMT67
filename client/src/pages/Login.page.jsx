import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";

export default function LoginPage() {
  const navigate = useNavigate();

  // Prefill biar cepat tes (pakai user seed)
  const [email, setEmail] = useState("bagas@example.com");
  const [password, setPassword] = useState("bagas123");

  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await serverApi.post("/login", { email, password });
      localStorage.setItem("gcr_token", data.access_token);
      localStorage.setItem("gcr_user", JSON.stringify(data.user));
      navigate("/");
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Login gagal";
      setErr(msg);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Login</h1>
            {err ? <div className="alert alert-danger">{err}</div> : null}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
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

              <button className="btn btn-primary w-100">Sign In</button>
            </form>

            <p className="mt-3 mb-0">
              Belum punya akun? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
