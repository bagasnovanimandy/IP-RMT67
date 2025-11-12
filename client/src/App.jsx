import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/Home.page.jsx";
import LoginPage from "./pages/Login.page.jsx";
import RegisterPage from "./pages/Register.page.jsx";
import VehicleDetailPage from "./pages/VehicleDetail.page.jsx";
import MyBookingsPage from "./pages/MyBookings.page.jsx";
import RecommendationsPage from "./pages/Recommendations.page.jsx";
import DashboardPage from "./pages/Dashboard.page.jsx";

import "./App.css";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/mybookings" element={<MyBookingsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Halaman baru untuk hasil AI */}
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route
            path="*"
            element={<p className="text-center my-5">Not Found</p>}
          />
        </Routes>
      </div>
    </>
  );
}
