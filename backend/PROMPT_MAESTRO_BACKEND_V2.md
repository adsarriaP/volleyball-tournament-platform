# PROMPT MAESTRO BACKEND v2.0: NESTJS + PRISMA + MYSQL XAMPP (TORNEOS DE 20 EQUIPOS, AUTO-SCHEDULER 8AM-6PM, SUBIDA DE ESCUDOS Y GOOGLE MAPS)

Actúa como un **Senior Backend Architect** especializado en NestJS 10+, TypeScript estricto, Prisma ORM (MySQL XAMPP) y Socket.io.

## REGLAS DE NEGOCIO Y ARQUITECTURA IMPLEMENTADAS
1. **Configuración de Torneos con Cupo de Equipos, Grupos y Fechas (`Tournament`)**:
   - Soporta `maxTeams` (ej. 20 equipos), `groupsCount` (ej. 2 grupos de 10 equipos cada uno), `qualifiersPerGroup` (ej. 2 o 4 clasificados por grupo), `startDate`, `endDate`, `dailyStartHour` (8:00 AM) y `dailyEndHour` (6:00 PM / 18:00).
2. **Registro de Equipos con Delegado, Validación de Cupo e Icono Físico (`TeamsModule`)**:
   - Endpoint `POST /teams` con `FileInterceptor('logo')` (`diskStorage` en `./uploads/teams/`).
   - Guarda la imagen del escudo en `backend/uploads/teams/`, expone la carpeta estática en `/uploads/teams/<archivo>` y persiste la ruta en `teams.logo_url` junto con `delegate_name` y `tournament_id`.
   - Valida estrictamente que el número de equipos inscritos en el torneo no supere `tournament.maxTeams`.
3. **Motor Automático de Cruces y Horarios de 08:00 AM a 06:00 PM (`TournamentsService`)**:
   - `POST /tournaments/:id/start`: Divide los equipos en `groupsCount` grupos (ej. Grupo A de 10 y Grupo B de 10), genera todos los cruces Round-Robin y asigna automáticamente `scheduledAt` dentro del rango `startDate` a `endDate` entre las `08:00` y las `18:00`, evitando que un equipo juegue dos partidos a la misma hora.
   - `POST /tournaments/:id/advance-knockout`: Toma los `qualifiersPerGroup` mejores de cada grupo y genera automáticamente la llave eliminatoria final (Cuartos de Final / Semifinales / Final).
4. **Programación de Cancha (`string`), Google Maps (`courtMapUrl`) y Juez (`PATCH /matches/:id/schedule`)**:
   - El Administrador puede editar la fecha/hora auto-asignada, escribir el nombre de la cancha (`courtNumber`), adjuntar el link de Google Maps (`courtMapUrl`) y asignar el Juez (`refereeId`).

