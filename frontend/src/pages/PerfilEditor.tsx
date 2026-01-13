import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import MultiSelect from "../components/MultiSelect";
import { getInitialState, upsertProfile } from "../api/mock";
import { buildDiff, recordAuditLog } from "../utils/auditLog";
import {
  HospitalUnit,
  PermissionConfigField,
  PermissionGrant,
  PermissionType,
  Profile,
  Service,
  SpecialFlag,
  Warehouse
} from "../types";

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

const getScopeLabel = (scopeMode: PermissionType["scopeMode"]) => {
  if (scopeMode === "GLOBAL") return "Global";
  if (scopeMode === "UNIT" || scopeMode === "UNIDAD") return "Unidad";
  if (scopeMode === "SERVICE" || scopeMode === "SERVICIO") return "Servicio";
  if (scopeMode === "UNIT_SERVICE" || scopeMode === "UNIDAD_Y_SERVICIO") {
    return "Unidad + servicio";
  }
  return "Alcance";
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

const PerfilEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = useMemo(() => getInitialState(), []);
  const existing = initial.profiles.find((profile) => profile.id === id);

  const initialGrants =
    existing?.permissionGrants && existing.permissionGrants.length
      ? existing.permissionGrants
      : existing?.permissionTypeIds.map((permissionTypeId) => ({
          id: `profile-${existing.id}-${permissionTypeId}`,
          permissionTypeId,
          isActive: true
        })) ?? [];

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [permissionGrants, setPermissionGrants] =
    useState<PermissionGrant[]>(initialGrants);
  const [isGrantEditorOpen, setIsGrantEditorOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<PermissionGrant | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const permissionTypeMap = useMemo(
    () => new Map(initial.permissionTypes.map((perm) => [perm.id, perm])),
    [initial.permissionTypes]
  );

  const handleSaveGrant = (grant: PermissionGrant) => {
    const exists = permissionGrants.some((item) => item.id === grant.id);
    const nextGrants = exists
      ? permissionGrants.map((item) => (item.id === grant.id ? grant : item))
      : [grant, ...permissionGrants];
    setPermissionGrants(nextGrants);
    setIsDirty(true);
    setEditingGrant(null);
    setIsGrantEditorOpen(false);
  };

  const handleRemoveGrant = (grantId: string) => {
    setPermissionGrants((prev) => prev.filter((item) => item.id !== grantId));
    setIsDirty(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const permissionTypeIds = Array.from(
      new Set(permissionGrants.map((grant) => grant.permissionTypeId))
    );
    const payload: Profile = {
      id: existing?.id ?? `profile-${Date.now()}`,
      name,
      description,
      permissionTypeIds,
      permissionGrants,
      isActive: true
    };

    upsertProfile(payload);
    if (existing) {
      const diff = buildDiff(
        existing as Record<string, unknown>,
        payload as Record<string, unknown>,
        ["name", "description", "permissionTypeIds"]
      );
      recordAuditLog(
        "MODIFICACION",
        "PROFILE",
        payload.id,
        `Edito perfil ${payload.name}`,
        diff
      );
    } else {
      recordAuditLog(
        "ALTA",
        "PROFILE",
        payload.id,
        `Creo perfil ${payload.name}`,
        { permissionTypeIds }
      );
    }
    navigate("/admin/perfiles");
    setIsDirty(false);
  };

  const handleBack = () => {
    if (!isDirty || window.confirm("Tienes cambios sin guardar. ¿Salir sin guardar?")) {
      navigate("/admin/perfiles");
    }
  };

  const grantsTable = (
    <DataTable
      rows={permissionGrants}
      emptyLabel="Sin permisos configurados"
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
          accessor: (grant) => {
            const perm = permissionTypeMap.get(grant.permissionTypeId);
            return (
              <div>
                <div className="table__title">
                  {perm?.scopeMode ? getScopeLabel(perm.scopeMode) : "-"}
                </div>
                <div className="muted">
                  Cobertura definida por el usuario
                </div>
              </div>
            );
          }
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
          header: "Acciones",
          accessor: (grant) => (
            <div className="actions">
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
                onClick={() => handleRemoveGrant(grant.id)}
              >
                Quitar
              </button>
            </div>
          )
        }
      ]}
    />
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>{existing ? "Editar perfil" : "Nuevo perfil"}</h2>
          <p className="muted">Define permisos y alcance institucional.</p>
        </div>
        <div className="actions">
          <button className="button" type="submit" form="profile-form">
            Guardar cambios
          </button>
          {isDirty && <Badge label="Cambios sin guardar" tone="neutral" />}
          <button className="button button--ghost" onClick={handleBack} type="button">
            Volver
          </button>
        </div>
      </div>

      <form
        id="profile-form"
        className="panel panel--compact stack"
        onSubmit={handleSubmit}
      >
        <label className="field">
          Nombre del perfil
          <input
            className="input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setIsDirty(true);
            }}
            required
          />
        </label>
        <label className="field">
          Descripcion
          <textarea
            className="input"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setIsDirty(true);
            }}
            rows={3}
          />
        </label>
        <div className="stack">
          <div className="panel__header">
            <h3>Permisos del perfil</h3>
            <button
              className="button"
              type="button"
              onClick={() => {
                setEditingGrant(null);
                setIsGrantEditorOpen(true);
              }}
            >
              Agregar permiso al perfil
            </button>
          </div>
          {grantsTable}
        </div>
        <button className="button" type="submit">
          Guardar cambios
        </button>
      </form>

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
    </div>
  );
};

export default PerfilEditor;
