import { useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar, { SidebarItem } from "../components/Sidebar";
import Header from "../components/Header";

const AdminRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const token = localStorage.getItem("demo-token");

  const items: SidebarItem[] = useMemo(
    () => [
      { label: "Dashboard", to: "/admin", icon: "D" },
      { label: "Usuarios", to: "/admin/usuarios", icon: "U" },
      { label: "Perfiles", to: "/admin/perfiles", icon: "P" },
      { label: "Permisos", to: "/admin/permisos", icon: "R" },
      { label: "Catalogos", to: "/admin/catalogos", icon: "C" }
    ],
    []
  );

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div className="app-main">
        <Header
          unitLabel="Unidad Central"
          userName="Admin"
          onLogout={() => {
            localStorage.removeItem("demo-token");
            navigate("/login");
          }}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminRoutes;

