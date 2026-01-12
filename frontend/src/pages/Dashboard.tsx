import { useMemo } from "react";
import { getInitialState } from "../api/mock";

const Dashboard = () => {
  const { users, profiles, permissionTypes } = useMemo(
    () => getInitialState(),
    []
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Visor General</h2>
          <p className="muted">
            Estado operativo del sistema de usuarios, perfiles y permisos.
          </p>
        </div>
        <button className="button button--secondary">Exportar resumen</button>
      </div>

      <div className="grid grid--cards">
        <div className="card">
          <h3>Usuarios activos</h3>
          <div className="card__value">{users.filter((u) => u.isActive).length}</div>
          <p className="muted">Personas con acceso habilitado.</p>
        </div>
        <div className="card">
          <h3>Perfiles</h3>
          <div className="card__value">{profiles.length}</div>
          <p className="muted">Agrupaciones de permisos vigentes.</p>
        </div>
        <div className="card">
          <h3>Permisos definidos</h3>
          <div className="card__value">{permissionTypes.length}</div>
          <p className="muted">Tipos de permisos activos.</p>
        </div>
      </div>

      <div className="grid grid--two">
        <div className="panel">
          <h3>Accesos rapidos</h3>
          <div className="panel__list">
            <button className="panel__action">Crear usuario</button>
            <button className="panel__action">Nuevo perfil</button>
            <button className="panel__action">Alta permiso</button>
          </div>
        </div>
        <div className="panel">
          <h3>Actividad reciente</h3>
          <ul className="timeline">
            <li>
              <strong>Admin Institucional</strong> asigno perfil Administrador a
              user@demo.com
            </li>
            <li>
              <strong>Consulta</strong> activo permiso reportes.read para unidad JIM
            </li>
            <li>
              <strong>Seguridad</strong> reviso permisos efectivos en Unidad FAA
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

