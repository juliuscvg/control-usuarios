import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import MultiSelect from "../components/MultiSelect";
import Tabs from "../components/Tabs";
import DualListSelector from "../components/DualListSelector";
import { getInitialState, upsertUser } from "../api/mock";
import { buildDiff, getAuditLogsForUser, recordAuditLog } from "../utils/auditLog";
import { showToast } from "../utils/toast";
import { buildEffectivePermissions } from "../utils/permissionEngine";
import {
  EffectivePermission,
  HospitalUnit,
  PermissionConfigField,
  PermissionGrant,
  PermissionType,
  Profile,
  Service,
  User,
  Warehouse,
  SpecialFlag
} from "../types";

const getScopeLabel = (scopeMode: EffectivePermission["scopeMode"]) => {
  if (scopeMode === "GLOBAL") return "Global";
  if (scopeMode === "UNIT" || scopeMode === "UNIDAD") return "Unidad";
  if (scopeMode === "SERVICE" || scopeMode === "SERVICIO") return "Servicio";
  if (scopeMode === "UNIT_SERVICE" || scopeMode === "UNIDAD_Y_SERVICIO") {
    return "Unidad + servicio";
  }
  return "Alcance";
};

const getFullName = (user: User) =>
  [user.apellidoPaterno, user.apellidoMaterno, user.nombres]
    .filter(Boolean)
    .join(" ");

const getCoverageSummary = (user: User) => {
  const units = user.unidadesAsociadas?.length ?? 0;
  const services = user.serviciosAsociados?.length ?? 0;
  const warehouses = user.almacenesAsociados?.length ?? 0;
  return `Unidades ${units} / Servicios ${services} / Almacenes ${warehouses}`;
};

const formatConfigValue = (value: unknown) => {
  if (Array.isArray(value)) return `${value.length} seleccionados`;
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return `${Object.keys(value as Record<string, unknown>).length} items`;
  }
  return "-";
};

const summarizeConfig = (config?: Record<string, unknown>) => {
  if (!config) return "Sin detalle";
  const parts = Object.entries(config).map(([key, value]) => {
    if (Array.isArray(value)) return `${key}: ${value.length}`;
    if (typeof value === "boolean") return value ? key : null;
    if (typeof value === "string") return `${key}: ${value}`;
    if (value && typeof value === "object") {
      return `${key}: ${Object.keys(value as Record<string, unknown>).length}`;
    }
    return null;
  });
  const filtered = parts.filter(Boolean) as string[];
  return filtered.length ? filtered.join(" - ") : "Sin detalle";
};

type CollapsibleSectionProps = {
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const CollapsibleSection = ({
  title,
  summary,
  isOpen,
  onToggle,
  children
}: CollapsibleSectionProps) => (
  <div className="panel panel--compact">
    <button
      className="panel__header"
      onClick={onToggle}
      aria-expanded={isOpen}
      style={{ width: "100%", textAlign: "left" }}
      type="button"
    >
      <div>
        <div className="table__title">{title}</div>
        {summary && <div className="muted">{summary}</div>}
      </div>
      <span className="muted">{isOpen ? "Ocultar" : "Mostrar"}</span>
    </button>
    <div
      style={{
        maxHeight: isOpen ? "1200px" : "0px",
        opacity: isOpen ? 1 : 0,
        overflow: "hidden",
        transition: "max-height 0.25s ease, opacity 0.2s ease"
      }}
    >
      <div className="stack" style={{ paddingTop: isOpen ? "1rem" : "0rem" }}>
        {children}
      </div>
    </div>
  </div>
);

type GrantCatalogs = {
  hospitalUnits: HospitalUnit[];
  services: Service[];
  warehouses: Warehouse[];
  specialFlags: SpecialFlag[];
};

type GrantEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grant: PermissionGrant) => void;
  permissionTypes: PermissionType[];
  catalogs: GrantCatalogs;
  initialGrant?: PermissionGrant | null;
};

const GrantEditor = ({
  isOpen,
  onClose,
  onSave,
  permissionTypes,
  catalogs,
  initialGrant
}: GrantEditorProps) => {
  const [permissionTypeId, setPermissionTypeId] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  const permission = permissionTypes.find((item) => item.id === permissionTypeId);

  useEffect(() => {
    if (!isOpen) return;
    if (initialGrant) {
      setPermissionTypeId(initialGrant.permissionTypeId);
      setConfig(initialGrant.config ?? {});
      return;
    }
    setPermissionTypeId("");
    setConfig({});
  }, [isOpen, initialGrant]);

  const getCatalogOptions = (field: PermissionConfigField) => {
    const { sourceCatalog } = field;
    if (!sourceCatalog) return [];
    if (sourceCatalog === "units") {
      return catalogs.hospitalUnits.map((unit) => ({
        value: unit.id,
        label: unit.name
      }));
    }
    if (sourceCatalog === "services") {
      return catalogs.services.map((svc) => ({
        value: svc.id,
        label: svc.name
      }));
    }
    if (sourceCatalog === "warehouses") {
      return catalogs.warehouses.map((wh) => ({
        value: wh.id,
        label: `${wh.name} (${wh.code})`
      }));
    }
    if (sourceCatalog === "specialFlags") {
      return catalogs.specialFlags.map((flag) => ({
        value: flag.id,
        label: flag.label
      }));
    }
    return [];
  };

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const isScopeValid = () => {
    if (!permission) return false;
    return true;
  };

  const isFieldValid = (field: PermissionConfigField) => {
    if (!field.required) return true;
    const value = config[field.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.length > 0;
    if (value && typeof value === "object") {
      return Object.keys(value as Record<string, unknown>).length > 0;
    }
    return false;
  };

  const isValid = () => {
    if (!permissionTypeId) return false;
    if (!isScopeValid()) return false;
    const fields = permission?.configSchema?.fields ?? [];
    return fields.every((field) => isFieldValid(field));
  };

  const handleSave = () => {
    if (!permission || !isValid()) return;
    const nextGrant: PermissionGrant = {
      id: initialGrant?.id ?? `grant-${Date.now()}`,
      permissionTypeId: permission.id,
      isActive: initialGrant?.isActive ?? true,
      config: Object.keys(config).length ? config : undefined
    };
    onSave(nextGrant);
  };

  return (
    <Modal
      title={initialGrant ? "Editar permiso" : "Asignar permiso"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="stack">
        <label className="field">
          Tipo de permiso
          <select
            className="input"
            value={permissionTypeId}
            onChange={(event) => setPermissionTypeId(event.target.value)}
            required
          >
            <option value="">Selecciona un permiso</option>
            {permissionTypes.map((perm) => (
              <option key={perm.id} value={perm.id}>
                {perm.name} ({perm.key})
              </option>
            ))}
          </select>
        </label>

        {permission?.scopeMode && (
          <div className="field">
            <div className="label">Cobertura</div>
            <div className="muted">
              La cobertura se define por las asociaciones del usuario.
            </div>
          </div>
        )}

        {permission?.configSchema?.fields.map((field) => {
          const options = getCatalogOptions(field);
          const value = config[field.id];
          if (field.type === "multiselect") {
            return (
              <div key={field.id}>
                <div className="label">{field.label}</div>
                <MultiSelect
                  options={options}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onChange={(next) => updateConfig(field.id, next)}
                  placeholder={`Selecciona ${field.label.toLowerCase()}`}
                />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <label key={field.id} className="field">
                {field.label}
                <select
                  className="input"
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => updateConfig(field.id, event.target.value)}
                  required={field.required}
                >
                  <option value="">Selecciona una opcion</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (field.type === "checkboxGroup") {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
              <div key={field.id} className="stack">
                <div className="label">{field.label}</div>
                {options.map((option) => {
                  const checked = selected.includes(option.value);
                  return (
                    <label key={option.value} className="field">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selected, option.value]
                            : selected.filter((item) => item !== option.value);
                          updateConfig(field.id, next);
                        }}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            );
          }
          if (field.type === "boolean") {
            return (
              <label key={field.id} className="field">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => updateConfig(field.id, event.target.checked)}
                />
                {field.label}
              </label>
            );
          }
          return (
            <label key={field.id} className="field">
              {field.label}
              <input
                className="input"
                value={typeof value === "string" ? value : ""}
                onChange={(event) => updateConfig(field.id, event.target.value)}
                required={field.required}
              />
            </label>
          );
        })}

        <button className="button" onClick={handleSave} disabled={!isValid()}>
          Guardar permiso
        </button>
      </div>
    </Modal>
  );
};

const UsuarioDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = useMemo(() => getInitialState(), []);
  const [users, setUsers] = useState<User[]>(initial.users);
  const [activeTab, setActiveTab] = useState("profiles");
  const [isGrantEditorOpen, setIsGrantEditorOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<PermissionGrant | null>(null);
  const [profilePreview, setProfilePreview] = useState<Profile | null>(null);
  const [effectiveDetail, setEffectiveDetail] =
    useState<EffectivePermission | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<User | null>(null);
  const [auditVersion, setAuditVersion] = useState(0);
  const [confirmRemovingGrantId, setConfirmRemovingGrantId] = useState<string | null>(null);
  const [lastRemovedGrant, setLastRemovedGrant] = useState<PermissionGrant | null>(null);
  // Default: collapsed. User expands sections when needed.
  const [isUserDataOpen, setIsUserDataOpen] = useState(false);
  const [isAssociationsOpen, setIsAssociationsOpen] = useState(false);

  const user = users.find((item) => item.id === id);

  if (!user) {
    return (
      <div className="page">
        <div className="panel">
          <h2>Usuario no encontrado</h2>
          <button className="button" onClick={() => navigate("/admin/usuarios")}>
            Volver a usuarios
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!savedSnapshot || savedSnapshot.id !== user.id) {
      setSavedSnapshot(user);
    }
  }, [savedSnapshot, user]);

  // Note: default collapsed is now handled by initial state above.

  const bumpAudit = () => setAuditVersion((prev) => prev + 1);

  const handleSave = () => {
    // email validation
    const emailValue = user.correo ?? user.email ?? "";
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (emailValue && !emailRegex.test(emailValue)) {
      showToast("Correo inválido. Corrige antes de guardar.");
      return;
    }
    if (!savedSnapshot) return;
    const baseDiff = buildDiff(
      savedSnapshot as Record<string, unknown>,
      user as Record<string, unknown>,
      [
        "nombres",
        "apellidoPaterno",
        "apellidoMaterno",
        "rud",
        "correo",
        "servicioPrincipalId",
        "categoria",
        "fotografia"
      ]
    );
    if (baseDiff) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        "Actualizo datos del usuario",
        baseDiff
      );
      bumpAudit();
    }
    upsertUser(user);
    setSaveMessage("Listo, cambios sincronizados");
    window.setTimeout(() => setSaveMessage(""), 2000);
    setIsDirty(false);
    setSavedSnapshot(user);
  };

  const profileOptions = initial.profiles.map((profile) => ({
    value: profile.id,
    label: profile.name,
    description: profile.description
  }));

  const permissionTypeMap = useMemo(
    () => new Map(initial.permissionTypes.map((perm) => [perm.id, perm])),
    [initial.permissionTypes]
  );

  const updateUserState = (nextUser: User) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === user.id ? nextUser : item))
    );
    setIsDirty(true);
  };

  const handleUserFieldChange = (field: keyof User, value: string) => {
    const nextUser = { ...user, [field]: value };
    if (
      field === "apellidoPaterno" ||
      field === "apellidoMaterno" ||
      field === "nombres"
    ) {
      const fullName = getFullName(nextUser);
      nextUser.name = fullName || nextUser.name;
    }
    if (field === "correo") {
      nextUser.email = value;
    }
    updateUserState(nextUser);
  };

  const handleUnitsChange = (unitIds: string[]) => {
    const unidadesAsociadas = initial.hospitalUnits.filter((unit) =>
      unitIds.includes(unit.id)
    );
    const beforeIds = new Set(
      (user.unidadesAsociadas ?? []).map((unit) => unit.id)
    );
    const afterIds = new Set(unidadesAsociadas.map((unit) => unit.id));
    const added = Array.from(afterIds).filter((id) => !beforeIds.has(id));
    const removed = Array.from(beforeIds).filter((id) => !afterIds.has(id));
    if (added.length || removed.length) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        `Actualizo unidades (+${added.length} / -${removed.length})`,
        { added, removed }
      );
      bumpAudit();
    }
    updateUserState({ ...user, unidadesAsociadas });
  };

  const handleServicesChange = (serviceIds: string[]) => {
    const serviciosAsociados = initial.services.filter((service) =>
      serviceIds.includes(service.id)
    );
    const beforeIds = new Set(
      (user.serviciosAsociados ?? []).map((service) => service.id)
    );
    const afterIds = new Set(serviciosAsociados.map((service) => service.id));
    const added = Array.from(afterIds).filter((id) => !beforeIds.has(id));
    const removed = Array.from(beforeIds).filter((id) => !afterIds.has(id));
    if (added.length || removed.length) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        `Actualizo servicios (+${added.length} / -${removed.length})`,
        { added, removed }
      );
      bumpAudit();
    }
    updateUserState({ ...user, serviciosAsociados });
  };

  const handleWarehousesChange = (warehouseIds: string[]) => {
    const almacenesAsociados = initial.warehouses.filter((warehouse) =>
      warehouseIds.includes(warehouse.id)
    );
    const beforeIds = new Set(
      (user.almacenesAsociados ?? []).map((warehouse) => warehouse.id)
    );
    const afterIds = new Set(almacenesAsociados.map((warehouse) => warehouse.id));
    const added = Array.from(afterIds).filter((id) => !beforeIds.has(id));
    const removed = Array.from(beforeIds).filter((id) => !afterIds.has(id));
    if (added.length || removed.length) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        `Actualizo almacenes (+${added.length} / -${removed.length})`,
        { added, removed }
      );
      bumpAudit();
    }
    updateUserState({ ...user, almacenesAsociados });
  };

  const handleProfilesChange = (profileIds: string[]) => {
    const nextUser = { ...user, profileIds };
    const beforeIds = new Set(user.profileIds);
    const afterIds = new Set(profileIds);
    const added = Array.from(afterIds).filter((id) => !beforeIds.has(id));
    const removed = Array.from(beforeIds).filter((id) => !afterIds.has(id));
    if (added.length || removed.length) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        `Actualizo perfiles (+${added.length} / -${removed.length})`,
        { added, removed }
      );
      bumpAudit();
    }
    updateUserState(nextUser);
  };

  const handleSaveGrant = (grant: PermissionGrant) => {
    const exists = user.directGrants.some((item) => item.id === grant.id);
    const nextGrants = exists
      ? user.directGrants.map((item) => (item.id === grant.id ? grant : item))
      : [grant, ...user.directGrants];
    const nextUser = { ...user, directGrants: nextGrants };
    recordAuditLog(
      exists ? "MODIFICACION" : "ALTA",
      "USER",
      user.id,
      `${exists ? "Edito" : "Agrego"} permiso directo ${grant.permissionTypeId}`,
      { grantId: grant.id, permissionTypeId: grant.permissionTypeId }
    );
    bumpAudit();
    updateUserState(nextUser);
    setEditingGrant(null);
    setIsGrantEditorOpen(false);
  };

  const handleRemoveGrant = (grantId: string) => {
    const grant = user.directGrants.find((item) => item.id === grantId);
    if (!grant) return;
    const nextUser = {
      ...user,
      directGrants: user.directGrants.filter((grant) => grant.id !== grantId)
    };
    // perform removal and keep copy for undo
    setLastRemovedGrant(grant);
    updateUserState(nextUser);
    recordAuditLog(
      "BAJA",
      "USER",
      user.id,
      `Quito permiso directo ${grant.permissionTypeId}`,
      { grantId: grant.id, permissionTypeId: grant.permissionTypeId }
    );
    bumpAudit();
    showToast(`Permiso ${grant.permissionTypeId} eliminado.`, {
      actionLabel: "Deshacer",
      onAction: () => {
        // restore
        const restored = { ...grant };
        const restoredUser = { ...user, directGrants: [restored, ...user.directGrants] };
        updateUserState(restoredUser);
        recordAuditLog(
          "MODIFICACION",
          "USER",
          user.id,
          `Deshizo baja permiso ${grant.permissionTypeId}`,
          { grantId: grant.id }
        );
        bumpAudit();
        setLastRemovedGrant(null);
      }
    });
  };

  const confirmRemoveGrant = () => {
    if (!confirmRemovingGrantId) return;
    handleRemoveGrant(confirmRemovingGrantId);
    setConfirmRemovingGrantId(null);
  };

  const handleToggleGrant = (grantId: string) => {
    const nextUser = {
      ...user,
      directGrants: user.directGrants.map((grant) =>
        grant.id === grantId
          ? { ...grant, isActive: !grant.isActive }
          : grant
      )
    };
    const toggled = nextUser.directGrants.find((grant) => grant.id === grantId);
    if (toggled) {
      recordAuditLog(
        "MODIFICACION",
        "USER",
        user.id,
        `${toggled.isActive ? "Activo" : "Desactivo"} permiso ${
          toggled.permissionTypeId
        }`,
        { grantId: toggled.id, isActive: toggled.isActive }
      );
      bumpAudit();
    }
    updateUserState(nextUser);
  };

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleBack = () => {
    if (!isDirty || window.confirm("Tienes cambios sin guardar. ¿Salir sin guardar?")) {
      navigate("/admin/usuarios");
    }
  };

  const grantsTable = (
    <DataTable
      rows={user.directGrants}
      emptyLabel="No hay permisos directos"
      columns={[
        {
          header: "Sistema",
          accessor: (grant) =>
            permissionTypeMap.get(grant.permissionTypeId)?.system ?? "-"
        },
        {
          header: "Apartado",
          accessor: (grant) =>
            permissionTypeMap.get(grant.permissionTypeId)?.apartado ?? "-"
        },
        {
          header: "Grupo",
          accessor: (grant) =>
            permissionTypeMap.get(grant.permissionTypeId)?.grupo ?? "-"
        },
        {
          header: "Derecho",
          accessor: (grant) => {
            const perm = permissionTypeMap.get(grant.permissionTypeId);
            return (
              <div>
                <div className="table__title">{perm?.name ?? "-"}</div>
                <div className="muted">{perm?.key}</div>
              </div>
            );
          }
        },
        {
          header: "Cobertura",
          accessor: () => (
            <div>
              <div className="table__title">Cobertura (desde usuario)</div>
              <div className="muted">{getCoverageSummary(user)}</div>
            </div>
          )
        },
        {
          header: "Config",
          accessor: (grant) => (
            <Badge
              label={summarizeConfig(grant.config)}
              tone={grant.config ? "primary" : "neutral"}
            />
          )
        },
        {
          header: "Estado",
          accessor: (grant) => (
            <Badge
              label={grant.isActive ? "Activo" : "Inactivo"}
              tone={grant.isActive ? "success" : "neutral"}
            />
          )
        },
        {
          header: "Acciones",
          accessor: (grant) => (
            <div
              className="actions"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "flex-end"
              }}
            >
              <button
                className="button button--ghost"
                onClick={() => {
                  setEditingGrant(grant);
                  setIsGrantEditorOpen(true);
                }}
              >
                Editar
              </button>
              <button
                className="button button--ghost"
                onClick={() => setConfirmRemovingGrantId(grant.id)}
              >
                Quitar
              </button>
              <button
                className="button button--ghost"
                onClick={() => handleToggleGrant(grant.id)}
              >
                {grant.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          )
        }
      ]}
    />
  );

  const assignedProfiles = initial.profiles.filter((profile) =>
    user.profileIds.includes(profile.id)
  );

  const profileSummary = (
    <div className="stack">
      {assignedProfiles.length === 0 && (
        <div className="table__empty">Sin perfiles asignados</div>
      )}
      {assignedProfiles.map((profile) => {
        const permissions = profile.permissionTypeIds
          .map((permId) =>
            initial.permissionTypes.find((perm) => perm.id === permId)
          )
          .filter((perm) => perm && perm.isActive);

        const preview = permissions.slice(0, 3);

        return (
          <div key={profile.id} className="panel panel--compact">
            <div className="panel__header">
              <div>
                <div className="table__title">{profile.name}</div>
                <div className="muted">{profile.description}</div>
              </div>
              <Badge
                label={`${permissions.length} permisos activos`}
                tone="primary"
              />
            </div>
            <div className="muted">
              {preview.map((perm, index) => (
                <div key={perm?.id ?? index}>
                  {perm?.name} ({perm?.key})
                </div>
              ))}
            </div>
            {permissions.length > 3 && (
              <button
                className="button button--ghost"
                onClick={() => setProfilePreview(profile)}
              >
                Ver todos
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const effectivePermissions = buildEffectivePermissions(
    user,
    initial.profiles,
    initial.permissionTypes,
    { hospitalUnits: initial.hospitalUnits, services: initial.services }
  );

  const grouped = effectivePermissions.reduce<Record<string, EffectivePermission[]>>(
    (acc, perm) => {
      const key = perm.permissionTypeId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    },
    {}
  );

  const effectiveGroups = Object.values(grouped).sort((a, b) =>
    a[0].permissionName.localeCompare(b[0].permissionName)
  );

  const effectivePanel = (
    <div className="stack">
      {effectiveGroups.length === 0 && (
        <div className="table__empty">Sin permisos efectivos</div>
      )}
      {effectiveGroups.map((group) => (
        <div key={group[0].permissionTypeId} className="panel panel--compact">
          <div className="panel__header">
            <div>
              <div className="table__title">{group[0].permissionName}</div>
              <div className="muted">
                {[
                  group[0].system,
                  group[0].apartado,
                  group[0].grupo,
                  group[0].permissionKey
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
            </div>
          </div>
          <div className="stack">
            {group.map((perm) => (
              <button
                key={perm.permissionTypeId}
                className="table__row"
                onClick={() => setEffectiveDetail(perm)}
              >
                <div>
                  <div className="label">Cobertura</div>
                  <div className="actions">
                    <Badge label={getScopeLabel(perm.scopeMode)} tone="neutral" />
                    <span className="muted">
                      Cobertura (desde usuario): {getCoverageSummary(user)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="label">Fuentes</div>
                  <div className="actions">
                    {perm.sources.map((source) => (
                      <Badge
                        key={`${source.type}-${source.sourceId}`}
                        label={source.label}
                        tone={source.type === "direct" ? "success" : "primary"}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label">Config</div>
                  <Badge
                    label={perm.configSummary ?? "Sin detalle"}
                    tone={perm.config ? "primary" : "neutral"}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const auditLogs = useMemo(
    () =>
      getAuditLogsForUser(
        user.id,
        [user.id, user.correo ?? "", user.email ?? ""].filter(Boolean)
      ),
    [auditVersion, user.id, user.correo, user.email]
  );

  const auditPanel = (
    <div className="panel panel--compact">
      <DataTable
        rows={auditLogs}
        emptyLabel="Sin movimientos registrados"
        columns={[
          {
            header: "Fecha",
            accessor: (row) => {
              try {
                return new Date(row.fechaHora).toLocaleString();
              } catch (e) {
                return row.fechaHora;
              }
            }
          },
          {
            header: "Actor",
            accessor: (row) => row.actor
          },
          {
            header: "Accion",
            accessor: (row) => row.accion
          },
          {
            header: "Resumen",
            accessor: (row) => row.resumen
          }
        ]}
      />
    </div>
  );

  const tabs = [
    {
      id: "profiles",
      label: "Perfiles",
      content: (
        <div className="panel panel--compact stack">
          <MultiSelect
            options={profileOptions}
            value={user.profileIds}
            onChange={handleProfilesChange}
            placeholder="Buscar perfiles"
          />
          {profileSummary}
        </div>
      )
    },
    {
      id: "direct",
      label: "Permisos directos",
      content: (
        <div className="panel panel--compact">
          <div className="panel__header">
            <h3>Permisos directos</h3>
            <button
              className="button"
              onClick={() => {
                setEditingGrant(null);
                setIsGrantEditorOpen(true);
              }}
            >
              Agregar permiso directo
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
        <div className="panel panel--compact stack">
          <p className="muted">
            Consolidado de permisos activos por perfil y asignacion directa.
          </p>
          {effectivePanel}
        </div>
      )
    },
    {
      id: "audit",
      label: "Bitacora",
      content: auditPanel
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>{getFullName(user) || user.name}</h2>
          <p className="muted">
            {user.rud ? `RUD ${user.rud} · ` : ""}
            {(() => {
              const main = initial.services.find((s) => s.id === (user as any).servicioPrincipalId);
              if (main) return main.name;
              return user.serviciosAsociados && user.serviciosAsociados.length > 0
                ? user.serviciosAsociados[0].name
                : "Sin servicio asignado";
            })()}
          </p>
          <div className="muted">{getCoverageSummary(user)}</div>
        </div>
        <div className="actions">
          <button className="button" onClick={handleSave}>
            Guardar cambios
          </button>
          {saveMessage && <Badge label={saveMessage} tone="success" />}
          <button
            className="button button--ghost"
            onClick={handleBack}
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid--two">
        <CollapsibleSection
          title="Datos del usuario"
          summary={`${user.correo ?? user.email ?? ""}${user.categoria ? ` · ${user.categoria}` : ""}`}
          isOpen={isUserDataOpen}
          onToggle={() => setIsUserDataOpen((prev) => !prev)}
        >
          <label className="field">
            Fotografia (URL)
            <input
              className="input"
              value={user.fotografia ?? ""}
              onChange={(event) => handleUserFieldChange("fotografia", event.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="field">
            Nombres
            <input
              className="input"
              value={user.nombres ?? ""}
              onChange={(event) => handleUserFieldChange("nombres", event.target.value)}
              required
            />
          </label>
          <label className="field">
            Apellido paterno
            <input
              className="input"
              value={user.apellidoPaterno ?? ""}
              onChange={(event) =>
                handleUserFieldChange("apellidoPaterno", event.target.value)
              }
              required
            />
          </label>
          <label className="field">
            Apellido materno
            <input
              className="input"
              value={user.apellidoMaterno ?? ""}
              onChange={(event) =>
                handleUserFieldChange("apellidoMaterno", event.target.value)
              }
            />
          </label>
          <label className="field">
            RUD
            <input
              className="input"
              value={user.rud ?? ""}
              onChange={(event) => handleUserFieldChange("rud", event.target.value)}
              required
            />
          </label>
          <label className="field">
            Correo
            <input
              className="input"
              type="email"
              value={user.correo ?? ""}
              onChange={(event) => handleUserFieldChange("correo", event.target.value)}
              required
            />
          </label>
          <label className="field">
            Servicio principal
            <select
              className="input"
              value={(user as any).servicioPrincipalId ?? ""}
              onChange={(event) => handleUserFieldChange("servicioPrincipalId" as any, event.target.value)}
            >
              <option value="">Sin servicio</option>
              {initial.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Categoria
            <input
              className="input"
              value={user.categoria ?? ""}
              onChange={(event) => handleUserFieldChange("categoria", event.target.value)}
            />
          </label>
        </CollapsibleSection>

        <CollapsibleSection
          title="Asociaciones"
          summary={`Unidades: ${user.unidadesAsociadas?.length ?? 0}, Servicios: ${
            user.serviciosAsociados?.length ?? 0
          }, Almacenes: ${user.almacenesAsociados?.length ?? 0}`}
          isOpen={isAssociationsOpen}
          onToggle={() => setIsAssociationsOpen((prev) => !prev)}
        >
          <DualListSelector
            items={initial.hospitalUnits}
            selectedIds={(user.unidadesAsociadas ?? []).map((unit) => unit.id)}
            onChangeSelectedIds={handleUnitsChange}
            getId={(unit) => unit.id}
            renderLabel={(unit) => (
              <div>
                <div className="table__title">{unit.name}</div>
                <div className="muted">{unit.code}</div>
              </div>
            )}
            searchKeys={[(unit) => unit.name, (unit) => unit.code]}
            availableLabel="Unidades disponibles"
            selectedLabel="Unidades seleccionadas"
          />
          <DualListSelector
            items={initial.services}
            selectedIds={(user.serviciosAsociados ?? []).map((service) => service.id)}
            onChangeSelectedIds={handleServicesChange}
            getId={(service) => service.id}
            renderLabel={(service) => (
              <div>
                <div className="table__title">{service.name}</div>
                <div className="muted">{service.code}</div>
              </div>
            )}
            searchKeys={[(service) => service.name, (service) => service.code]}
            availableLabel="Servicios disponibles"
            selectedLabel="Servicios seleccionados"
          />
          <DualListSelector
            items={initial.warehouses}
            selectedIds={(user.almacenesAsociados ?? []).map((warehouse) => warehouse.id)}
            onChangeSelectedIds={handleWarehousesChange}
            getId={(warehouse) => warehouse.id}
            renderLabel={(warehouse) => (
              <div>
                <div className="table__title">{warehouse.name}</div>
                <div className="muted">{warehouse.code}</div>
              </div>
            )}
            searchKeys={[(warehouse) => warehouse.name, (warehouse) => warehouse.code]}
            availableLabel="Almacenes disponibles"
            selectedLabel="Almacenes seleccionados"
          />
        </CollapsibleSection>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <GrantEditor
        isOpen={isGrantEditorOpen}
        onClose={() => {
          setEditingGrant(null);
          setIsGrantEditorOpen(false);
        }}
        onSave={handleSaveGrant}
        permissionTypes={initial.permissionTypes.filter((perm) => perm.isActive)}
        catalogs={{
          hospitalUnits: initial.hospitalUnits,
          services: initial.services,
          warehouses: initial.warehouses,
          specialFlags: initial.specialFlags
        }}
        initialGrant={editingGrant}
      />

      <Modal
        title="Confirmar eliminación"
        isOpen={Boolean(confirmRemovingGrantId)}
        onClose={() => setConfirmRemovingGrantId(null)}
      >
        <div className="stack">
          <div>¿Confirma que desea quitar este permiso directo?</div>
          <div className="actions">
            <button className="button button--ghost" onClick={() => setConfirmRemovingGrantId(null)}>Cancelar</button>
            <button className="button" onClick={confirmRemoveGrant}>Confirmar</button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Permisos del perfil"
        isOpen={Boolean(profilePreview)}
        onClose={() => setProfilePreview(null)}
      >
        <div className="stack">
          <div className="table__title">{profilePreview?.name}</div>
          <div className="muted">{profilePreview?.description}</div>
          <div className="stack">
            {profilePreview?.permissionTypeIds.map((permId) => {
              const perm = initial.permissionTypes.find((p) => p.id === permId);
              if (!perm?.isActive) return null;
              return (
                <div key={perm.id} className="panel panel--compact">
                  <div className="table__title">{perm.name}</div>
                  <div className="muted">{perm.key}</div>
                  <Badge label={perm.scopeMode} tone="neutral" />
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        title="Detalle de permiso efectivo"
        isOpen={Boolean(effectiveDetail)}
        onClose={() => setEffectiveDetail(null)}
      >
        {effectiveDetail && (
          <div className="stack">
            <div>
              <div className="label">Permiso</div>
              <div className="table__title">
                {effectiveDetail.permissionName} ({effectiveDetail.permissionKey})
              </div>
            </div>
            <div>
              <div className="label">Cobertura</div>
              <div className="muted">
                Cobertura (desde usuario): {getCoverageSummary(user)}
              </div>
            </div>
            <div>
              <div className="label">Configuracion</div>
              <div className="muted">
                {effectiveDetail.configSummary ?? "Sin detalle"}
              </div>
            </div>
            <div>
              <div className="label">Fuentes</div>
              <div className="stack">
                {effectiveDetail.sources.map((source) => (
                  <div key={`${source.type}-${source.sourceId}`}>
                    <Badge
                      label={source.label}
                      tone={source.type === "direct" ? "success" : "primary"}
                    />
                    <div className="muted">{source.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            {effectiveDetail.config && (
              <div>
                <div className="label">Detalle de configuracion</div>
                <div className="stack">
                  {Object.entries(effectiveDetail.config).map(([key, value]) => (
                    <div key={key} className="panel panel--compact">
                      <div className="table__title">{key}</div>
                      <div className="muted">{formatConfigValue(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsuarioDetalle;
