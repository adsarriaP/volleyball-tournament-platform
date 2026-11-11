# Contexto del Proyecto: Plataforma de Torneos de Voleibol en Tiempo Real

## 1. Visión General del Sistema
Plataforma multiplataforma (Web, Tablet y Móvil vía PWA) para la gestión, administración y seguimiento en vivo de torneos de voleibol. Incluye control de accesos por roles (`ADMIN`, `REFEREE`, `TEAM_REP`), generación de formatos de competencia y planilla digital interactiva en vivo con WebSockets.

## 2. Reglas de Arquitectura Global
- **Backend (`./backend`)**: NestJS v10+ con TypeScript estricto, Prisma ORM sobre MySQL 8+ / MariaDB (XAMPP en `localhost:3306`), y `@nestjs/platform-socket.io`.
- **Frontend (`./frontend`)**: React + TypeScript + Tailwind CSS (PWA instalable).
- **Integridad Transaccional**: Toda mutación de marcador, rotación, cierre de set o cierre de partido DEBE ejecutarse dentro de `prisma.$transaction()` y validarse mediante `VolleyballEngineService`.
- **Seguridad (RBAC)**: Todas las rutas protegidas deben usar `JwtAuthGuard` y `RolesGuard` con el decorador `@Roles(...)`.

