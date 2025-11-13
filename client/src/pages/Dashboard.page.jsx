import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { serverApi } from "../helpers/serverApi";
import { alert } from "../lib/alert";

function rupiah(n) {
  try {
    return new Intl.NumberFormat("id-ID").format(n ?? 0);
  } catch {
    return n;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const user = useMemo(() => {
    try {
      const userStr = localStorage.getItem("gcr_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!localStorage.getItem("gcr_token");

  useEffect(() => {
    // Debug info
    console.log("Dashboard - User:", user);
    console.log("Dashboard - isLoggedIn:", isLoggedIn);
    console.log("Dashboard - isAdmin:", isAdmin);
    
    if (!isLoggedIn) {
      alert.error("Anda harus login terlebih dahulu");
      navigate("/login");
      return;
    }
    if (!isAdmin) {
      console.warn("User is not admin. Role:", user?.role);
      alert.error("Akses ditolak. Hanya admin yang dapat mengakses dashboard.");
      navigate("/");
      return;
    }
    loadData();
  }, [isLoggedIn, isAdmin, navigate, user]);

  async function loadData() {
    setLoading(true);
    const errors = [];
    
    try {
      // Load both in parallel
      const results = await Promise.allSettled([loadVehicles(), loadBookings()]);
      
      // Check for errors
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const resource = index === 0 ? 'kendaraan' : 'bookings';
          const errorMsg = result.reason?.message || `Gagal memuat data ${resource}`;
          errors.push(errorMsg);
          console.error(`Error loading ${resource}:`, result.reason);
        }
      });
      
      if (errors.length > 0 && errors.length < 2) {
        // Only show error if not both failed (might be auth issue)
        const hasAuthError = errors.some(e => e.includes('Unauthorized') || e.includes('Forbidden'));
        if (!hasAuthError) {
          await alert.error(errors.join('\n'));
        }
      } else if (errors.length === 2) {
        // Both failed - might be server issue
        const firstError = errors[0];
        if (firstError.includes('Server error') || firstError.includes('Network')) {
          await alert.error("Tidak dapat terhubung ke server. Pastikan server berjalan di http://localhost:3000");
        } else {
          await alert.error("Gagal memuat data dashboard. " + firstError);
        }
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal memuat data dashboard";
      await alert.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthError(error) {
    const errorMessage = error?.response?.data?.message || error?.message || "";
    const isInvalidToken = errorMessage.toLowerCase().includes("invalid signature") || 
                          errorMessage.toLowerCase().includes("jwt") ||
                          errorMessage.toLowerCase().includes("token");
    
    if (isInvalidToken || error?.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem("gcr_token");
      localStorage.removeItem("gcr_user");
      localStorage.removeItem("gjt_token");
      
      await alert.error("Sesi Anda telah berakhir atau token tidak valid. Silakan login ulang.");
      navigate("/login");
      return true; // Indicates auth error was handled
    }
    
    return false; // Not an auth error
  }

  async function loadVehicles() {
    setVehicleLoading(true);
    try {
      const response = await serverApi.get("/admin/vehicles");
      const data = response?.data;
      setVehicles(data?.data || data || []);
    } catch (error) {
      console.error("Load vehicles error:", error);
      
      // Handle auth errors first
      const authErrorHandled = await handleAuthError(error);
      if (authErrorHandled) {
        return Promise.reject(new Error("Unauthorized"));
      }
      
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal memuat data kendaraan";
      
      if (status === 403) {
        await alert.error("Akses ditolak. Hanya admin yang dapat mengakses.");
        navigate("/");
        return Promise.reject(new Error("Forbidden"));
      }
      
      if (status === 404 || status >= 500) {
        console.error("Server error:", error?.response);
        return Promise.reject(new Error(`Server error: ${errorMessage}`));
      }
      
      setVehicles([]);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setVehicleLoading(false);
    }
  }

  async function loadBookings() {
    setBookingLoading(true);
    try {
      const response = await serverApi.get("/admin/bookings");
      const data = response?.data;
      setBookings(data?.data || data || []);
    } catch (error) {
      console.error("Load bookings error:", error);
      
      // Handle auth errors first
      const authErrorHandled = await handleAuthError(error);
      if (authErrorHandled) {
        return Promise.reject(new Error("Unauthorized"));
      }
      
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal memuat data bookings";
      
      if (status === 403) {
        await alert.error("Akses ditolak. Hanya admin yang dapat mengakses.");
        navigate("/");
        return Promise.reject(new Error("Forbidden"));
      }
      
      if (status === 404 || status >= 500) {
        console.error("Server error:", error?.response);
        return Promise.reject(new Error(`Server error: ${errorMessage}`));
      }
      
      setBookings([]);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleDeleteVehicle(id) {
    const result = await alert.confirm({
      title: "Hapus Kendaraan?",
      text: "Tindakan ini tidak bisa dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      await serverApi.delete(`/admin/vehicles/${id}`);
      await alert.toast("Kendaraan berhasil dihapus", "success");
      await loadVehicles();
    } catch (error) {
      await alert.error(error.message);
    }
  }

  async function handleUpdateBookingStatus(id, newStatus) {
    try {
      await serverApi.patch(`/admin/bookings/${id}/status`, { status: newStatus });
      await alert.toast("Status booking berhasil diupdate", "success");
      await loadBookings();
    } catch (error) {
      await alert.error(error.message);
    }
  }

  async function handleDeleteBooking(id) {
    const result = await alert.confirm({
      title: "Hapus Booking?",
      text: "Tindakan ini tidak bisa dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      await serverApi.delete(`/admin/bookings/${id}`);
      await alert.toast("Booking berhasil dihapus", "success");
      await loadBookings();
    } catch (error) {
      await alert.error(error.message);
    }
  }

  // All hooks must be called before any conditional returns
  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;
    const totalRevenue = bookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      totalVehicles,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      totalRevenue,
    };
  }, [vehicles, bookings]);

  // Conditional rendering - must be after all hooks
  if (!isLoggedIn || !isAdmin) {
    return <div className="text-center my-5">Redirecting...</div>;
  }
  
  if (loading) {
    return <div className="text-center my-5">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 mb-0">🎛️ Admin Dashboard</h1>
        <button className="btn btn-primary" onClick={loadData}>
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "vehicles" ? "active" : ""}`}
            onClick={() => setActiveTab("vehicles")}
          >
            Manajemen Mobil ({stats.totalVehicles})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            Manajemen Bookings ({stats.totalBookings})
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-muted">Total Kendaraan</h5>
                <h2 className="mb-0">{stats.totalVehicles}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-muted">Total Bookings</h5>
                <h2 className="mb-0">{stats.totalBookings}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-warning">Pending</h5>
                <h2 className="mb-0">{stats.pendingBookings}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title text-success">Total Revenue</h5>
                <h2 className="mb-0">Rp {rupiah(stats.totalRevenue)}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Tab */}
      {activeTab === "vehicles" && (
        <div>
          <div className="d-flex justify-content-between mb-3">
            <h5 className="mb-0">Daftar Kendaraan</h5>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => alert.info("Fitur tambah kendaraan akan segera tersedia")}
            >
              + Tambah Kendaraan
            </button>
          </div>
          {vehicleLoading ? (
            <div className="text-center my-5">Loading...</div>
          ) : vehicles.length === 0 ? (
            <div className="alert alert-info">Belum ada kendaraan</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Harga/Hari</th>
                    <th>Status</th>
                    <th>Lokasi</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td>{v.id}</td>
                      <td>{v.name}</td>
                      <td>Rp {rupiah(v.dailyPrice)}</td>
                      <td>
                        <span className={`badge ${v.status === "available" ? "bg-success" : "bg-danger"}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>{v?.Branch?.city || "-"}</td>
                      <td className="text-center">
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => alert.info("Fitur edit akan segera tersedia")}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteVehicle(v.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === "bookings" && (
        <div>
          <h5 className="mb-3">Daftar Bookings</h5>
          {bookingLoading ? (
            <div className="text-center my-5">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="alert alert-info">Belum ada bookings</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Kendaraan</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Total Harga</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.id}</td>
                      <td>{b.User?.email || "-"}</td>
                      <td>{b.Vehicle?.name || "-"}</td>
                      <td>{new Date(b.startDate).toLocaleDateString("id-ID")}</td>
                      <td>{new Date(b.endDate).toLocaleDateString("id-ID")}</td>
                      <td>Rp {rupiah(b.totalPrice)}</td>
                      <td>
                        <span
                          className={`badge ${
                            b.status === "PENDING"
                              ? "bg-secondary"
                              : b.status === "CONFIRMED"
                              ? "bg-primary"
                              : b.status === "COMPLETED"
                              ? "bg-success"
                              : b.status === "REJECTED"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group">
                          {b.status === "PENDING" && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleUpdateBookingStatus(b.id, "CONFIRMED")}
                              >
                                Confirm
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleUpdateBookingStatus(b.id, "REJECTED")}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteBooking(b.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

