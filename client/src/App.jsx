import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/Home.page.jsx";
import LoginPage from "./pages/Login.page.jsx";
import RegisterPage from "./pages/Register.page.jsx";
import VehicleDetailPage from "./pages/VehicleDetail.page.jsx";
import MyBookingsPage from "./pages/MyBookings.page.jsx";
import RecommendationsPage from "./pages/Recommendations.page.jsx";
import DashboardPage from "./pages/Dashboard.page.jsx";
import PaymentCheckoutPage from "./pages/PaymentCheckout.page.jsx";
import PaymentSuccessPage from "./pages/PaymentSuccess.page.jsx";
import PaymentPendingPage from "./pages/PaymentPending.page.jsx";
import PaymentFailedPage from "./pages/PaymentFailed.page.jsx";

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
          {/* Payment pages */}
          <Route path="/payment/checkout/:bookingId" element={<PaymentCheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/pending" element={<PaymentPendingPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route
            path="*"
            element={<p className="text-center my-5">Not Found</p>}
          />
        </Routes>
      </div>
    </>
  );
}
