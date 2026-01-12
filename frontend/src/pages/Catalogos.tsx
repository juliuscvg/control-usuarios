import { useMemo } from "react";
import DataTable from "../components/DataTable";
import { getInitialState } from "../api/mock";

const Catalogos = () => {
  const { hospitalUnits, services } = useMemo(() => getInitialState(), []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Catalogos</h2>
          <p className="muted">Unidades hospitalarias y servicios asociados.</p>
        </div>
      </div>

      <div className="grid grid--two">
        <div className="panel panel--compact">
          <h3>Unidades hospitalarias</h3>
          <DataTable
            rows={hospitalUnits}
            columns={[
              {
                header: "Unidad",
                accessor: (row) => (
                  <div>
                    <div className="table__title">{row.name}</div>
                    <div className="muted">{row.code}</div>
                  </div>
                )
              }
            ]}
          />
        </div>
        <div className="panel panel--compact">
          <h3>Servicios</h3>
          <DataTable
            rows={services}
            columns={[
              {
                header: "Servicio",
                accessor: (row) => (
                  <div>
                    <div className="table__title">{row.name}</div>
                    <div className="muted">{row.code}</div>
                  </div>
                )
              },
              {
                header: "Unidad",
                accessor: (row) =>
                  hospitalUnits.find((unit) => unit.id === row.unitId)?.name
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Catalogos;

