import { FormEvent, useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getInitialState } from "../api/mock";
import { PermissionType, ScopeMode } from "../types";

const Permisos = () => {
  const { permissionTypes: initialPermissions } = useMemo(
    () => getInitialState(),
    []
  );
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("GLOBAL");

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const newPermission: PermissionType = {
      id: `perm-${Date.now()}`,
      name,
      key,
      description,
      scopeMode,
      isActive: true
    };
    setPermissions((prev) => [newPermission, ...prev]);
    setName("");
    setKey("");
    setDescription("");
    setScopeMode("GLOBAL");
    setIsOpen(false);
  };

  const toggleActive = (id: string) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.id === id ? { ...perm, isActive: !perm.isActive } : perm
      )
    );
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Permisos</h2>
          <p className="muted">Define tipos de permisos y su alcance.</p>
        </div>
        <button className="button" onClick={() => setIsOpen(true)}>
          Nuevo permiso
        </button>
      </div>

      <DataTable
        rows={permissions}
        columns={[
          {
            header: "Permiso",
            accessor: (row) => (
              <div>
                <div className="table__title">{row.name}</div>
                <div className="muted">{row.key}</div>
              </div>
            )
          },
          {
            header: "Scope",
            accessor: (row) => row.scopeMode
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
                onClick={() => toggleActive(row.id)}
              >
                {row.isActive ? "Desactivar" : "Activar"}
              </button>
            )
          }
        ]}
      />

      <Modal title="Nuevo permiso" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form className="stack" onSubmit={handleCreate}>
          <label className="field">
            Nombre
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Key
            <input
              className="input"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="users.read"
              required
            />
          </label>
          <label className="field">
            Descripcion
            <textarea
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>
          <label className="field">
            Scope
            <select
              className="input"
              value={scopeMode}
              onChange={(event) => setScopeMode(event.target.value as ScopeMode)}
            >
              <option value="GLOBAL">GLOBAL</option>
              <option value="UNIT">UNIT</option>
              <option value="SERVICE">SERVICE</option>
              <option value="UNIT_SERVICE">UNIT_SERVICE</option>
            </select>
          </label>
          <button className="button" type="submit">
            Guardar permiso
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Permisos;

