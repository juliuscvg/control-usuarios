import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import MultiSelect from "../components/MultiSelect";
import Tabs from "../components/Tabs";
import DataTable from "../components/DataTable";
import { getInitialState } from "../api/mock";
import { permissionEngine } from "../utils/permissionEngine";
import { PermissionGrant, User } from "../types";

const UsuarioDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = useMemo(() => getInitialState(), []);
  const [users, setUsers] = useState<User[]>(initial.users);
  const [activeTab, setActiveTab] = useState("general");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const user = users.find((item) => item.id === id);

  if (!user) {
    return (
      <div className="page">
        <div className="panel">
          <h2>Usuario no encontrado</h2>
          <button className="button" onClick={() => navigate("/admin/usuarios")}
          >
            Volver a usuarios
          </button>
        </div>
      </div>
    );
  }

  const profileOptions = initial.profiles.map((profile) => ({
    value: profile.id,
    label: profile.name,
    description: profile.description
  }));

  const permissionOptions = initial.permissionTypes
    .filter((perm) => perm.isActive)
    .map((perm) => ({
      value: perm.id,
      label: `${perm.name} (${perm.key})`,
      description: perm.scopeMode
    }));

  const selectedPermission = initial.permissionTypes.find(
    (perm) => perm.id === selectedPermissionId
  );

  const handleProfilesChange = (profileIds: string[]) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id ? { ...item, profileIds } : item
      )
    );
  };

  const handleAddGrant = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPermission) return;

    const newGrant: PermissionGrant = {
      id: `grant-${Date.now()}`,
      permissionTypeId: selectedPermission.id,
      unitId: selectedUnitId || undefined,
      serviceId: selectedServiceId || undefined
    };

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? { ...item, directGrants: [newGrant, ...item.directGrants] }
          : item
      )
    );

    setSelectedPermissionId("");
    setSelectedUnitId("");
    setSelectedServiceId("");
    setIsOpen(false);
  };

  const grantsTable = (
    <DataTable
      rows={user.directGrants}
      emptyLabel="No hay permisos directos"
      columns={[
        {
          header: "Permiso",
          accessor: (grant) => {
            const perm = initial.permissionTypes.find(
              (item) => item.id === grant.permissionTypeId
            );
            return (
              <div>
                <div className="table__title">{perm?.name ?? "-"}</div>
                <div className="muted">{perm?.key}</div>
              </div>
            );
          }
        },
        {
          header: "Alcance",
          accessor: (grant) => {
            const unit = initial.hospitalUnits.find(
              (item) => item.id === grant.unitId
            );
            const service = initial.services.find(
              (item) => item.id === grant.serviceId
            );
            return (
              <div>
                <div>{unit?.name ?? "Global"}</div>
                {service && <div className="muted">{service.name}</div>}
              </div>
            );
          }
        }
      ]}
    />
  );

  const effectivePermissions = permissionEngine(
    user,
    initial.profiles,
    initial.permissionTypes,
    { hospitalUnits: initial.hospitalUnits, services: initial.services }
  );

  const effectiveTable = (
    <DataTable
      rows={effectivePermissions}
      emptyLabel="Sin permisos efectivos"
      columns={[
        {
          header: "Permiso",
          accessor: (perm) => (
            <div>
              <div className="table__title">{perm.permissionKey}</div>
              <div className="muted">{perm.scope}</div>
            </div>
          )
        },
        {
          header: "Origen",
          accessor: (perm) => (
            <Badge
              label={perm.source === "profile" ? "Perfil" : "Directo"}
              tone={perm.source === "profile" ? "primary" : "success"}
            />
          )
        },
        {
          header: "Detalle",
          accessor: (perm) => {
            const fallback =
              perm.scope === "GLOBAL"
                ? "Global"
                : perm.scope.startsWith("SERVICE")
                  ? "Todos los servicios"
                  : perm.scope.startsWith("UNIT_SERVICE")
                    ? "Todas las unidades/servicios"
                    : "Todas las unidades";

            return (
              <div>
                <div>{perm.unit?.name ?? fallback}</div>
                {perm.service && <div className="muted">{perm.service.name}</div>}
              </div>
            );
          }
        }
      ]}
    />
  );

  const tabs = [
    {
      id: "general",
      label: "Datos generales",
      content: (
        <div className="panel panel--compact">
          <div className="grid grid--two">
            <div>
              <div className="label">Nombre</div>
              <div className="value">{user.name}</div>
            </div>
            <div>
              <div className="label">Correo</div>
              <div className="value">{user.email}</div>
            </div>
            <div>
              <div className="label">Estado</div>
              <Badge label={user.isActive ? "Activo" : "Inactivo"} tone="success" />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "profiles",
      label: "Perfiles asignados",
      content: (
        <div className="panel panel--compact">
          <MultiSelect
            options={profileOptions}
            value={user.profileIds}
            onChange={handleProfilesChange}
            placeholder="Buscar perfiles"
          />
        </div>
      )
    },
    {
      id: "direct",
      label: "Permisos individuales",
      content: (
        <div className="panel panel--compact">
          <div className="panel__header">
            <h3>Permisos directos</h3>
            <button className="button" onClick={() => setIsOpen(true)}>
              Agregar permiso
            </button>
          </div>
          {grantsTable}
        </div>
      )
    },
    {
      id: "effective",
      label: "Permisos efectivos",
      content: (
        <div className="panel panel--compact">
          <p className="muted">
            Consolidado de permisos por perfil y asignacion directa.
          </p>
          {effectiveTable}
        </div>
      )
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>{user.name}</h2>
          <p className="muted">Gestiona perfiles, permisos y trazabilidad.</p>
        </div>
        <button className="button button--ghost" onClick={() => navigate("/admin/usuarios")}>
          Volver
        </button>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <Modal
        title="Agregar permiso directo"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <form className="stack" onSubmit={handleAddGrant}>
          <label className="field">
            Tipo de permiso
            <select
              className="input"
              value={selectedPermissionId}
              onChange={(event) => {
                setSelectedPermissionId(event.target.value);
                setSelectedUnitId("");
                setSelectedServiceId("");
              }}
              required
            >
              <option value="">Selecciona un permiso</option>
              {permissionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {(selectedPermission?.scopeMode === "UNIT" ||
            selectedPermission?.scopeMode === "UNIT_SERVICE") && (
            <label className="field">
              Unidad hospitalaria
              <select
                className="input"
                value={selectedUnitId}
                onChange={(event) => setSelectedUnitId(event.target.value)}
                required
              >
                <option value="">Selecciona unidad</option>
                {initial.hospitalUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(selectedPermission?.scopeMode === "SERVICE" ||
            selectedPermission?.scopeMode === "UNIT_SERVICE") && (
            <label className="field">
              Servicio
              <select
                className="input"
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                required
              >
                <option value="">Selecciona servicio</option>
                {initial.services
                  .filter((svc) =>
                    selectedUnitId ? svc.unitId === selectedUnitId : true
                  )
                  .map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <button className="button" type="submit">
            Guardar permiso
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default UsuarioDetalle;

