import { Link, useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { alert } from "../lib/alert";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get state from Redux
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    const result = await alert.confirm({
      title: "Logout?",
      text: "Apakah Anda yakin ingin keluar?",
      confirmText: "Ya, Logout",
      cancelText: "Batal",
    });
    if (result.isConfirmed) {
      dispatch(logout());
      await alert.toast("Berhasil logout", "success");
      navigate("/login");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" style={{ color: 'white', fontSize: '1.5rem' }}>
          🚗 Galindo Car Rental
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div id="mainNav" className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/" style={{ fontWeight: '500' }}>
                Home
              </Link>
            </li>
            {isAuthenticated && !isAdmin && (
              <li className="nav-item">
                <Link className="nav-link text-white" to="/mybookings" style={{ fontWeight: '500' }}>
                  My Bookings
                </Link>
              </li>
            )}
            {isAuthenticated && isAdmin && (
              <li className="nav-item">
                <Link className="nav-link text-white" to="/dashboard" style={{ fontWeight: '500' }}>
                  🎛️ Dashboard
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {!isAuthenticated ? (
              <>
                <Link className="btn btn-light" to="/login" style={{ fontWeight: '600', borderRadius: '8px' }}>
                  Login
                </Link>
                <Link className="btn btn-warning" to="/register" style={{ fontWeight: '600', borderRadius: '8px', color: '#212529' }}>
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* User Info */}
                <div className="d-flex align-items-center gap-2" style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '8px',
                  color: 'white',
                  maxWidth: '250px'
                }}>
                  {user?.pictureUrl ? (
                    <img 
                      src={user.pictureUrl} 
                      alt={user.name || user.email}
                      onError={(e) => {
                        console.error("❌ Error loading avatar:", user.pictureUrl);
                        // Replace dengan fallback avatar
                        const fallback = document.createElement('div');
                        fallback.style.cssText = `
                          width: 32px;
                          height: 32px;
                          border-radius: 50%;
                          background: rgba(255, 255, 255, 0.3);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-weight: bold;
                          font-size: 0.875rem;
                          flex-shrink: 0;
                          border: 2px solid rgba(255, 255, 255, 0.3);
                        `;
                        fallback.textContent = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
                        e.target.parentNode.replaceChild(fallback, e.target);
                      }}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="d-flex flex-column" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <span 
                      style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        lineHeight: '1.2',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={user?.name || user?.email || 'User'}
                    >
                      {user?.name || user?.email || 'User'}
                    </span>
                    {user?.name && user?.email && (
                      <small 
                        style={{ 
                          fontSize: '0.75rem', 
                          opacity: 0.9,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={user.email}
                      >
                        {user.email}
                      </small>
                    )}
                  </div>
                </div>
                <button 
                  className="btn btn-light" 
                  onClick={handleLogout}
                  style={{ fontWeight: '600', borderRadius: '8px', color: '#dc3545' }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
