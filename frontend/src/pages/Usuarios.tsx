import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { getInitialState } from "../api/mock";
import { User } from "../types";

const Usuarios = () => {
  const { users: initialUsers } = useMemo(() => getInitialState(), []);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      isActive: true,
      profileIds: [],
      directGrants: []
    };
    setUsers((prev) => [newUser, ...prev]);
    setName("");
    setEmail("");
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
          <button className="button" onClick={() => setIsOpen(true)}>
            Nuevo usuario
          </button>
        </div>
      </div>

      <DataTable
        rows={users}
        columns={[
          {
            header: "Usuario",
            accessor: (row) => (
              <div>
                <div className="table__title">{row.name}</div>
                <div className="muted">{row.email}</div>
              </div>
            )
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
            Nombre completo
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Correo institucional
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
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

