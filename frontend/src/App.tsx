import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./AuthContext";

import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NearbyCyclesPage } from "./pages/NearbyCyclesPage";
import { CycleDetailsPage } from "./pages/CycleDetailsPage";
import { ActiveRidePage } from "./pages/ActiveRidePage";
import { EndRidePage } from "./pages/EndRidePage";
import { BookingsPage } from "./pages/BookingsPage";
import { WalletPage } from "./pages/WalletPage";
import { TripHistoryPage } from "./pages/TripHistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

export default function App() {
  const { role } = useAuth();
  const location = useLocation();
  const showBottomNav = Boolean(role) && !["/login", "/signup"].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<ProtectedRoute>{<DashboardPage />}</ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/map" element={<ProtectedRoute>{<NearbyCyclesPage />}</ProtectedRoute>} />
        <Route path="/cycles/:id" element={<ProtectedRoute>{<CycleDetailsPage />}</ProtectedRoute>} />

        <Route path="/active-ride" element={<ProtectedRoute>{<ActiveRidePage />}</ProtectedRoute>} />
        <Route path="/end-ride" element={<ProtectedRoute>{<EndRidePage />}</ProtectedRoute>} />

        <Route path="/bookings" element={<ProtectedRoute>{<BookingsPage />}</ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute>{<WalletPage />}</ProtectedRoute>} />
        <Route path="/trip-history" element={<ProtectedRoute>{<TripHistoryPage />}</ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute>{<ProfilePage />}</ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={["admin"]}>{<AdminDashboardPage />}</ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showBottomNav && role ? <BottomNav role={role} /> : null}
    </>
  );
}
