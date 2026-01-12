import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MultiSelect from "../components/MultiSelect";
import { getInitialState } from "../api/mock";
import { Profile } from "../types";

const PerfilEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = useMemo(() => getInitialState(), []);
  const existing = initial.profiles.find((profile) => profile.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [permissionIds, setPermissionIds] = useState<string[]>(
    existing?.permissionTypeIds ?? []
  );

  const permissionOptions = initial.permissionTypes.map((perm) => ({
    value: perm.id,
    label: `${perm.name} (${perm.key})`,
    description: perm.description
  }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: Profile = {
      id: existing?.id ?? `profile-${Date.now()}`,
      name,
      description,
      permissionTypeIds: permissionIds,
      isActive: true
    };

    console.log("Perfil guardado", payload);
    navigate("/admin/perfiles");
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>{existing ? "Editar perfil" : "Nuevo perfil"}</h2>
          <p className="muted">Define permisos y alcance institucional.</p>
        </div>
        <button className="button button--ghost" onClick={() => navigate("/admin/perfiles")}>
          Volver
        </button>
      </div>

      <form className="panel panel--compact stack" onSubmit={handleSubmit}>
        <label className="field">
          Nombre del perfil
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
        <div>
          <div className="label">Permisos incluidos</div>
          <MultiSelect
            options={permissionOptions}
            value={permissionIds}
            onChange={setPermissionIds}
            placeholder="Buscar permisos"
          />
        </div>
        <button className="button" type="submit">
          Guardar perfil
        </button>
      </form>
    </div>
  );
};

export default PerfilEditor;

