# Control de Usuarios - Frontend

Frontend React + Vite + TypeScript para la gestion institucional de usuarios, perfiles y permisos.

## Arquitectura
- `src/api/mock.ts`: datos en memoria (sin backend real)
- `src/utils/permissionEngine.ts`: calculo de permisos efectivos con trazabilidad
- `src/routes/AdminRoutes.tsx`: layout administrativo y guardia basica por token fake
- `src/components/`: componentes reutilizables (tabla, tabs, modal, sidebar, header)
- `src/pages/`: pantallas principales

## Conceptos de permisos
- Tipos de permisos (`PermissionType`) definen su `scopeMode`.
- Perfiles agrupan tipos de permisos.
- Usuarios reciben permisos por perfil y asignaciones directas.
- Los permisos efectivos consolidan ambas fuentes y muestran origen y alcance.

## Usuarios demo
- `admin@demo.com`
- `user@demo.com`

## Rutas disponibles
- `/login`
- `/admin`
- `/admin/usuarios`
- `/admin/usuarios/:id`
- `/admin/perfiles`
- `/admin/perfiles/nuevo`
- `/admin/perfiles/:id`
- `/admin/permisos`
- `/admin/catalogos`

## Ejecutar
```bash
npm install
npm run dev
```

> Nota: El login guarda un token falso en `localStorage`.

