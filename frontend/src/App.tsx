// src/App.tsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import AlchemistsPage from "./pages/AlchemistsPage";
import MaterialsPage from "./pages/MaterialsPage";
import MissionsPage from "./pages/MissionsPage";
import TransmutationsPage from "./pages/TransmutationsPage";
import AuditsPage from "./pages/AuditsPage";
import RegisterPage from "./pages/RegisterPage";

import LoginPage from "./pages/LoginPage";           
import { PrivateRoute, RoleRoute } from "./routeGuards"; 
import { AuthProvider } from "./auth";                

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/*  Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/*  Área protegida (requiere token JWT) */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/*  Dashboard común */}
            <Route path="/" element={<Dashboard />} />

            {/*  Secciones accesibles para ambos roles */}
            <Route path="/alchemists" element={<AlchemistsPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/transmutations" element={<TransmutationsPage />} />

            {/*  Solo SUPERVISOR */}
            <Route
              path="/audits"
              element={
                <RoleRoute role="SUPERVISOR">
                  <AuditsPage />
                </RoleRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
