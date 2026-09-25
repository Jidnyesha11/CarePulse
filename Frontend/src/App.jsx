import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";

import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Records from "./pages/Records";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import Beds from "./pages/Beds";
import AI from "./pages/AI";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";

import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

const Protected = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public information pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Authenticated application */}
          <Route element={<Protected><Layout /></Protected>}>

            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/appointments"
              element={<Appointments />}
            />

            <Route
              path="/book"
              element={<Appointments />}
            />

            <Route
              path="/records"
              element={<Records />}
            />

            <Route
              path="/prescriptions"
              element={<Prescriptions />}
            />

            <Route
              path="/billing"
              element={<Billing />}
            />

            <Route
              path="/beds"
              element={
                <Protected roles={["admin"]}>
                  <Beds />
                </Protected>
              }
            />

            <Route
              path="/ai"
              element={<AI />}
            />

            <Route
              path="/admin"
              element={
                <Protected roles={["admin"]}>
                  <Admin />
                </Protected>
              }
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}