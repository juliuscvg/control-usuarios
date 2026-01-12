import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { getInitialState } from "../api/mock";

const Perfiles = () => {
  const { profiles } = useMemo(() => getInitialState(), []);
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Perfiles</h2>
          <p className="muted">
            Agrupa permisos y asigna roles operativos por area.
          </p>
        </div>
        <button className="button" onClick={() => navigate("/admin/perfiles/nuevo")}>
          Nuevo perfil
        </button>
      </div>

      <DataTable
        rows={profiles}
        columns={[
          {
            header: "Perfil",
            accessor: (row) => (
              <div>
                <div className="table__title">{row.name}</div>
                <div className="muted">{row.description}</div>
              </div>
            )
          },
          {
            header: "Permisos",
            accessor: (row) => row.permissionTypeIds.length
          },
          {
            header: "Estado",
            accessor: (row) => (
              <Badge
                label={row.isActive ? "Activo" : "Inactivo"}
                tone={row.isActive ? "success" : "neutral"}
              />
            )
          },
          {
            header: "Accion",
            accessor: (row) => (
              <button
                className="button button--ghost"
                onClick={() => navigate(`/admin/perfiles/${row.id}`)}
              >
                Editar
              </button>
            )
          }
        ]}
      />
    </div>
  );
};

export default Perfiles;

