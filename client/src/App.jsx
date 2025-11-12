import { Routes, Route, Navigate } from "react-router";
import Navbar from "./components/Navbar";
import HomePage from "./pages/Home.page";
import LoginPage from "./pages/Login.page";
import RegisterPage from "./pages/Register.page";
import VehicleDetailPage from "./pages/VehicleDetail.page";
import MyBookingsPage from "./pages/MyBookings.page"; // <-- tambah ini

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/mybookings" element={<MyBookingsPage />} /> {/* baru */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
