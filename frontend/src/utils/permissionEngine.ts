import {
  EffectivePermission,
  HospitalUnit,
  PermissionType,
  Profile,
  Service,
  User
} from "../types";

type Catalogs = {
  hospitalUnits: HospitalUnit[];
  services: Service[];
};

const buildScopeLabel = (
  permission: PermissionType,
  unit?: HospitalUnit,
  service?: Service
) => {
  if (permission.scopeMode === "GLOBAL") return "GLOBAL";
  if (permission.scopeMode === "UNIT" && unit) return `UNIT:${unit.code}`;
  if (permission.scopeMode === "SERVICE" && service) return `SERVICE:${service.code}`;
  if (permission.scopeMode === "UNIT_SERVICE" && unit && service) {
    return `UNIT_SERVICE:${unit.code}-${service.code}`;
  }
  if (permission.scopeMode === "UNIT") return "UNIT:ALL";
  if (permission.scopeMode === "SERVICE") return "SERVICE:ALL";
  return "UNIT_SERVICE:ALL";
};

export const permissionEngine = (
  user: User,
  profiles: Profile[],
  permissionTypes: PermissionType[],
  catalogs: Catalogs
): EffectivePermission[] => {
  const permissionMap = new Map(permissionTypes.map((perm) => [perm.id, perm]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const unitMap = new Map(catalogs.hospitalUnits.map((unit) => [unit.id, unit]));
  const serviceMap = new Map(catalogs.services.map((svc) => [svc.id, svc]));
  const results: EffectivePermission[] = [];
  const seen = new Set<string>();

  const pushIfNew = (entry: EffectivePermission) => {
    const key = [
      entry.permissionKey,
      entry.scope,
      entry.unit?.id ?? "-",
      entry.service?.id ?? "-",
      entry.source,
      entry.sourceId
    ].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      results.push(entry);
    }
  };

  user.profileIds.forEach((profileId) => {
    const profile = profileMap.get(profileId);
    if (!profile) return;

    profile.permissionTypeIds.forEach((permissionTypeId) => {
      const permission = permissionMap.get(permissionTypeId);
      if (!permission) return;

      const scope = buildScopeLabel(permission);
      pushIfNew({
        permissionKey: permission.key,
        scope,
        source: "profile",
        sourceId: profile.id
      });
    });
  });

  user.directGrants.forEach((grant) => {
    const permission = permissionMap.get(grant.permissionTypeId);
    if (!permission) return;

    const unit = grant.unitId ? unitMap.get(grant.unitId) : undefined;
    const service = grant.serviceId ? serviceMap.get(grant.serviceId) : undefined;
    const scope = buildScopeLabel(permission, unit, service);

    pushIfNew({
      permissionKey: permission.key,
      scope,
      unit,
      service,
      source: "direct",
      sourceId: grant.id
    });
  });

  return results;
};

