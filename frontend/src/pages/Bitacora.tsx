import { useMemo } from "react";
import DataTable from "../components/DataTable";
import { getAuditLogs } from "../utils/auditLog";

const Bitacora = () => {
  const logs = useMemo(() => getAuditLogs(), []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Bitácora</h2>
          <p className="muted">Registro de acciones del sistema (usuarios, perfiles, permisos).</p>
        </div>
      </div>

      <div className="panel panel--compact">
        <DataTable
          rows={logs}
          emptyLabel="Sin movimientos registrados"
          pageSize={15}
          storageKey="bitacora.page"
          columns={[
            {
              header: "Fecha",
              accessor: (row: any) => {
                try {
                  return new Date(row.fechaHora).toLocaleString();
                } catch (e) {
                  return row.fechaHora;
                }
              }
            },
            { header: "Actor", accessor: (row: any) => row.actor },
            { header: "Accion", accessor: (row: any) => row.accion },
            { header: "Entidad", accessor: (row: any) => row.entidad },
            { header: "EntidadId", accessor: (row: any) => row.entidadId },
            { header: "Resumen", accessor: (row: any) => row.resumen },
            {
              header: "Detalle",
              accessor: (row: any) => {
                const diff = row.diff;
                if (!diff) return "-";
                try {
                  if (typeof diff === "string") return diff;
                  // Build a compact readable representation
                  return Object.entries(diff)
                    .map(([k, v]) => {
                      if (v && typeof v === "object") {
                        // if before/after shape
                        if (v.hasOwnProperty("before") || v.hasOwnProperty("after")) {
                          const before = JSON.stringify((v as any).before);
                          const after = JSON.stringify((v as any).after);
                          return `${k}: ${before} → ${after}`;
                        }
                        return `${k}: ${JSON.stringify(v)}`;
                      }
                      return `${k}: ${String(v)}`;
                    })
                    .join(" | ");
                } catch (e) {
                  return JSON.stringify(diff);
                }
              }
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Bitacora;
