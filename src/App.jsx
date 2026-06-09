import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Pricing from './pages/Pricing';

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users"     element={<Users />} />
        <Route path="/drivers"   element={<Drivers />} />
        <Route path="/bookings"  element={<Bookings />} />
        <Route path="/payments"  element={<Payments />} />
        <Route path="/pricing"   element={<Pricing />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
