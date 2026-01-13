import { FormEvent, useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { getInitialState, upsertPermissionType } from "../api/mock";
import { buildDiff, recordAuditLog } from "../utils/auditLog";
import { PermissionConfigField, PermissionType, ScopeMode } from "../types";

const Permisos = () => {
  const { permissionTypes: initialPermissions } = useMemo(
    () => getInitialState(),
    []
  );
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionType | null>(
    null
  );
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("GLOBAL");
  const [system, setSystem] = useState("");
  const [apartado, setApartado] = useState("");
  const [grupo, setGrupo] = useState("");
  const [configFields, setConfigFields] = useState<PermissionConfigField[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingPermission) {
      setName(editingPermission.name);
      setKey(editingPermission.key);
      setDescription(editingPermission.description);
      setScopeMode(editingPermission.scopeMode);
      setSystem(editingPermission.system ?? "");
      setApartado(editingPermission.apartado ?? "");
      setGrupo(editingPermission.grupo ?? "");
      setConfigFields(editingPermission.configSchema?.fields ?? []);
      return;
    }
    setName("");
    setKey("");
    setDescription("");
    setScopeMode("GLOBAL");
    setSystem("");
    setApartado("");
    setGrupo("");
    setConfigFields([]);
  }, [editingPermission, isOpen]);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    const payload: PermissionType = {
      id: editingPermission?.id ?? `perm-${Date.now()}`,
      name,
      key,
      description,
      scopeMode,
      system: system || undefined,
      apartado: apartado || undefined,
      grupo: grupo || undefined,
      isActive: editingPermission?.isActive ?? true,
      configSchema: configFields.length ? { fields: configFields } : undefined
    };
    upsertPermissionType(payload);
    setPermissions((prev) => {
      if (editingPermission) {
        return prev.map((perm) => (perm.id === payload.id ? payload : perm));
      }
      return [payload, ...prev];
    });
    if (editingPermission) {
      const diff = buildDiff(
        editingPermission as Record<string, unknown>,
        payload as Record<string, unknown>,
        ["name", "key", "description", "system", "apartado", "grupo", "scopeMode"]
      );
      recordAuditLog(
        "MODIFICACION",
        "PERMISSION",
        payload.id,
        `Edito permiso ${payload.key}`,
        diff
      );
    } else {
      recordAuditLog(
        "ALTA",
        "PERMISSION",
        payload.id,
        `Creo permiso ${payload.key}`,
        { key: payload.key }
      );
    }
    setIsOpen(false);
    setEditingPermission(null);
  };

  const toggleActive = (id: string) => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (perm.id !== id) return perm;
        const next = { ...perm, isActive: !perm.isActive };
        upsertPermissionType(next);
        recordAuditLog(
          next.isActive ? "MODIFICACION" : "BAJA",
          "PERMISSION",
          next.id,
          `${next.isActive ? "Activo" : "Desactivo"} permiso ${next.key}`
        );
        return next;
      })
    );
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Permisos</h2>
          <p className="muted">Define tipos de permisos y su alcance.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setEditingPermission(null);
            setIsOpen(true);
          }}
        >
          Nuevo permiso
        </button>
      </div>

      <DataTable
        rows={permissions}
        storageKey="permisos.page"
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
            header: "Sistema",
            accessor: (row) => row.system ?? "-"
          },
          {
            header: "Apartado",
            accessor: (row) => row.apartado ?? "-"
          },
          {
            header: "Grupo",
            accessor: (row) => row.grupo ?? "-"
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
              <div className="actions">
                <button
                  className="button button--ghost"
                  onClick={() => {
                    setEditingPermission(row);
                    setIsOpen(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => toggleActive(row.id)}
                >
                  {row.isActive ? "Desactivar" : "Activar"}
                </button>
              </div>
            )
          }
        ]}
      />

      <Modal
        title={editingPermission ? "Editar permiso" : "Nuevo permiso"}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingPermission(null);
        }}
      >
        <form className="stack" onSubmit={handleSave}>
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
            Sistema
            <input
              className="input"
              value={system}
              onChange={(event) => setSystem(event.target.value)}
            />
          </label>
          <label className="field">
            Apartado
            <input
              className="input"
              value={apartado}
              onChange={(event) => setApartado(event.target.value)}
            />
          </label>
          <label className="field">
            Grupo
            <input
              className="input"
              value={grupo}
              onChange={(event) => setGrupo(event.target.value)}
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
          {configFields.length > 0 && (
            <div className="stack">
              <div className="label">Configuracion</div>
              {configFields.map((field, index) => (
                <div key={field.id} className="panel panel--compact">
                  <label className="field">
                    Etiqueta
                    <input
                      className="input"
                      value={field.label}
                      onChange={(event) => {
                        const next = [...configFields];
                        next[index] = { ...field, label: event.target.value };
                        setConfigFields(next);
                      }}
                    />
                  </label>
                  <label className="field">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      onChange={(event) => {
                        const next = [...configFields];
                        next[index] = { ...field, required: event.target.checked };
                        setConfigFields(next);
                      }}
                    />
                    Requerido
                  </label>
                </div>
              ))}
            </div>
          )}
          <button className="button" type="submit">
            {editingPermission ? "Guardar cambios" : "Guardar permiso"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Permisos;
