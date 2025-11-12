import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
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
      if (user) {
        console.log("Login - User data:", user);
        console.log("Login - User role:", user.role);
        localStorage.setItem("gcr_user", JSON.stringify(user));
      }
      await alert.success("Login successful");
      // Redirect based on role
      if (user?.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      await alert.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLoginSuccess(credentialResponse) {
    try {
      setLoading(true);
      const { data } = await serverApi.post("/google-login", {
        id_token: credentialResponse.credential,
      });
      const token = data?.access_token;
      const user = data?.user;
      if (!token) throw new Error("Token not found");
      localStorage.setItem("gjt_token", token);
      localStorage.setItem("gcr_token", token);
      if (user) {
        console.log("Google Login - User data:", user);
        console.log("📸 Picture URL:", user.pictureUrl || "Tidak ada");
        localStorage.setItem("gcr_user", JSON.stringify(user));
      }
      await alert.success("Login dengan Google berhasil");
      // Redirect based on role
      if (user?.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Google login error:", error);
      await alert.error(error.message || "Google login gagal");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLoginError() {
    alert.error("Google login gagal. Silakan coba lagi.");
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
              <span className="text-muted">atau</span>
            </div>

            <div className="d-flex justify-content-center">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                width="360"
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>

            <p className="mt-3 mb-0">
              Belum punya akun? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
