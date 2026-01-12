export type ScopeMode = "GLOBAL" | "UNIT" | "SERVICE" | "UNIT_SERVICE";

export type HospitalUnit = {
  id: string;
  name: string;
  code: string;
};

export type Service = {
  id: string;
  name: string;
  code: string;
  unitId: string;
};

export type PermissionType = {
  id: string;
  key: string;
  name: string;
  description: string;
  scopeMode: ScopeMode;
  isActive: boolean;
};

export type Profile = {
  id: string;
  name: string;
  description: string;
  permissionTypeIds: string[];
  isActive: boolean;
};

export type PermissionGrant = {
  id: string;
  permissionTypeId: string;
  unitId?: string;
  serviceId?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  profileIds: string[];
  directGrants: PermissionGrant[];
};

export type EffectivePermission = {
  permissionKey: string;
  scope: string;
  unit?: HospitalUnit;
  service?: Service;
  source: "profile" | "direct";
  sourceId: string;
};

