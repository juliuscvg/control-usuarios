import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { getInitialState, upsertUser } from "../api/mock";
import { recordAuditLog } from "../utils/auditLog";
import { User } from "../types";

const getFullName = (user: User) =>
  [user.apellidoPaterno, user.apellidoMaterno, user.nombres]
    .filter(Boolean)
    .join(" ");

const getInitials = (user: User) => {
  const name = getFullName(user) || user.name || "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const Usuarios = () => {
  const initial = useMemo(() => getInitialState(), []);
  const [users, setUsers] = useState<User[]>(initial.users || []);
  const services = initial.services || [];
  const profiles = initial.profiles || [];
  const [filterName, setFilterName] = useState("");
  const [filterRud, setFilterRud] = useState("");
  const [filterService, setFilterService] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [correo, setCorreo] = useState("");
  const [rud, setRud] = useState("");
  const [categoria, setCategoria] = useState("");
  const navigate = useNavigate();

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = `${apellidoPaterno} ${apellidoMaterno} ${nombres}`.trim();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: correo,
      fotografia: "",
      apellidoPaterno,
      apellidoMaterno,
      nombres,
      rud,
      correo,
      categoria,
      isActive: true,
      profileIds: [],
      directGrants: [],
      unidadesAsociadas: [],
      serviciosAsociados: [],
      almacenesAsociados: []
    };
    setUsers((prev) => [newUser, ...prev]);
    upsertUser(newUser);
    recordAuditLog("ALTA", "USER", newUser.id, `Creo usuario ${name}`, {
      correo: newUser.correo,
      rud: newUser.rud
    });
    setNombres("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setCorreo("");
    setRud("");
    setCategoria("");
    setIsOpen(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Usuarios</h2>
          <p className="muted">Gestiona cuentas, perfiles y permisos directos.</p>
        </div>
        <div className="actions">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              placeholder="Buscar nombre o correo..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              style={{ width: 220 }}
            />
            <input
              className="input"
              placeholder="RUD"
              value={filterRud}
              onChange={(e) => setFilterRud(e.target.value)}
              style={{ width: 120 }}
            />
            <select className="input" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
              <option value="">Todos servicios</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button className="button" onClick={() => setIsOpen(true)}>Nuevo usuario</button>
          </div>
        </div>
      </div>

      <DataTable
        rows={users.filter((u) => {
          const q = filterName.trim().toLowerCase();
          if (q) {
            const name = ([u.apellidoPaterno, u.apellidoMaterno, u.nombres].filter(Boolean).join(" ") || u.name || "").toLowerCase();
            const email = (u.correo || u.email || "").toLowerCase();
            if (!name.includes(q) && !email.includes(q)) return false;
          }
          if (filterRud && !(u.rud ?? "").toLowerCase().includes(filterRud.toLowerCase())) return false;
          if (filterService) {
            // match main service id if present, otherwise check associated services
            const main = (u as any).servicioPrincipalId;
            if (main) return main === filterService;
            return (u.serviciosAsociados || []).some((s) => s.id === filterService);
          }
          return true;
        })}
        columns={[
          {
            header: "Usuario",
            accessor: (row) => (
              <div className="actions">
                {row.fotografia ? (
                  <img className="avatar" src={row.fotografia} alt={row.name} />
                ) : (
                  <div className="avatar">{getInitials(row) || "U"}</div>
                )}
                <div>
                  <div className="table__title">{getFullName(row) || row.name}</div>
                  <div className="muted">{row.correo ?? row.email}</div>
                </div>
              </div>
            )
          },
          {
            header: "RUD",
            accessor: (row) => row.rud ?? "-"
          },
          {
            header: "Servicio",
            accessor: (row: User) => {
              const main = services.find((s: any) => s.id === (row as any).servicioPrincipalId);
              if (main) return main.name;
              const first = (row.serviciosAsociados || [])[0];
              return first ? first.name : "-";
            }
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
            header: "Perfiles",
            accessor: (row) => row.profileIds.length
          },
          {
            header: "Accion",
            accessor: (row) => (
              <button
                className="button button--ghost"
                onClick={() => navigate(`/admin/usuarios/${row.id}`)}
              >
                Ver detalle
              </button>
            )
          }
        ]}
      />

      <Modal title="Nuevo usuario" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form className="stack" onSubmit={handleCreate}>
          <label className="field">
            Nombres
            <input
              className="input"
              value={nombres}
              onChange={(event) => setNombres(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Apellido paterno
            <input
              className="input"
              value={apellidoPaterno}
              onChange={(event) => setApellidoPaterno(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Apellido materno
            <input
              className="input"
              value={apellidoMaterno}
              onChange={(event) => setApellidoMaterno(event.target.value)}
            />
          </label>
          <label className="field">
            Correo institucional
            <input
              className="input"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
          </label>
          <label className="field">
            RUD
            <input
              className="input"
              value={rud}
              onChange={(event) => setRud(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Categoria
            <input
              className="input"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
          </label>
          <button className="button" type="submit">
            Crear usuario
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Usuarios;
