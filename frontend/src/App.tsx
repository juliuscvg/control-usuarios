import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import UsuarioDetalle from "./pages/UsuarioDetalle";
import Perfiles from "./pages/Perfiles";
import PerfilEditor from "./pages/PerfilEditor";
import Permisos from "./pages/Permisos";
import Catalogos from "./pages/Catalogos";
import AdminRoutes from "./routes/AdminRoutes";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminRoutes />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="usuarios/:id" element={<UsuarioDetalle />} />
          <Route path="perfiles" element={<Perfiles />} />
          <Route path="perfiles/nuevo" element={<PerfilEditor />} />
          <Route path="perfiles/:id" element={<PerfilEditor />} />
          <Route path="permisos" element={<Permisos />} />
          <Route path="catalogos" element={<Catalogos />} />
        </Route>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

