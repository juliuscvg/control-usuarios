import { HospitalUnit, Service, PermissionType, Profile, User } from "../types";

export const hospitalUnits: HospitalUnit[] = [
  { id: "unit-jim", name: "Hospital JIM", code: "JIM" },
  { id: "unit-faa", name: "Hospital FAA", code: "FAA" },
  { id: "unit-hco", name: "Hospital HCO", code: "HCO" }
];

export const services: Service[] = [
  { id: "svc-jim-urg", name: "Urgencias", code: "URG", unitId: "unit-jim" },
  { id: "svc-jim-lab", name: "Laboratorio", code: "LAB", unitId: "unit-jim" },
  { id: "svc-faa-uci", name: "UCI", code: "UCI", unitId: "unit-faa" },
  { id: "svc-faa-cons", name: "Consulta Externa", code: "CONS", unitId: "unit-faa" },
  { id: "svc-hco-farm", name: "Farmacia", code: "FAR", unitId: "unit-hco" }
];

export const permissionTypes: PermissionType[] = [
  {
    id: "perm-users-read",
    key: "users.read",
    name: "Lectura de usuarios",
    description: "Permite visualizar usuarios y perfiles.",
    scopeMode: "GLOBAL",
    isActive: true
  },
  {
    id: "perm-users-write",
    key: "users.write",
    name: "Gestión de usuarios",
    description: "Permite crear y editar usuarios.",
    scopeMode: "GLOBAL",
    isActive: true
  },
  {
    id: "perm-alm-read",
    key: "almacenes.read",
    name: "Lectura de almacenes",
    description: "Acceso de lectura a almacenes por unidad.",
    scopeMode: "UNIT",
    isActive: true
  },
  {
    id: "perm-exp-read",
    key: "expedientes.read",
    name: "Lectura de expedientes",
    description: "Acceso a expedientes por servicio.",
    scopeMode: "SERVICE",
    isActive: true
  },
  {
    id: "perm-rep-read",
    key: "reportes.read",
    name: "Lectura de reportes",
    description: "Acceso a reportes por unidad y servicio.",
    scopeMode: "UNIT_SERVICE",
    isActive: true
  }
];

export const profiles: Profile[] = [
  {
    id: "profile-admin",
    name: "Administrador",
    description: "Acceso completo a la administracion institucional.",
    permissionTypeIds: ["perm-users-read", "perm-users-write", "perm-alm-read"],
    isActive: true
  },
  {
    id: "profile-consulta",
    name: "Consulta",
    description: "Acceso operativo a consulta y expedientes.",
    permissionTypeIds: ["perm-exp-read", "perm-rep-read"],
    isActive: true
  }
];

export const users: User[] = [
  {
    id: "user-admin",
    email: "admin@demo.com",
    name: "Admin Institucional",
    isActive: true,
    profileIds: ["profile-admin"],
    directGrants: [
      {
        id: "grant-admin-1",
        permissionTypeId: "perm-rep-read",
        unitId: "unit-jim",
        serviceId: "svc-jim-urg"
      }
    ]
  },
  {
    id: "user-demo",
    email: "user@demo.com",
    name: "Operador Consulta",
    isActive: true,
    profileIds: ["profile-consulta"],
    directGrants: [
      {
        id: "grant-demo-1",
        permissionTypeId: "perm-alm-read",
        unitId: "unit-faa"
      }
    ]
  }
];

export const getInitialState = () => ({
  hospitalUnits: [...hospitalUnits],
  services: [...services],
  permissionTypes: [...permissionTypes],
  profiles: [...profiles],
  users: [...users]
});

