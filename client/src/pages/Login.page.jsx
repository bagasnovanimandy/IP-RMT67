import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { alert } from "../lib/alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("bagas@example.com");
  const [password, setPassword] = useState("bagas123");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await serverApi.post("/login", { email, password });
      const token = data?.access_token;
      const user = data?.user;
      if (!token) throw new Error("Token not found");
      localStorage.setItem("gjt_token", token);
      localStorage.setItem("gcr_token", token);
      if (user) localStorage.setItem("gcr_user", JSON.stringify(user));
      await alert.success("Login successful");
      navigate("/");
    } catch (error) {
      await alert.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await alert.info("Google Login will be available after integration.");
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Login</h1>

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

              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="text-center my-3">
              <span className="text-muted">or</span>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger w-100"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>

            <p className="mt-3 mb-0">
              Belum punya akun? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
