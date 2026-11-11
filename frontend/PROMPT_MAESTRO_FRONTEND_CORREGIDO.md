# PROMPT MAESTRO FRONTEND v2.0: REACT + TYPESCRIPT + TAILWIND CSS (ESTILO SOFASCORE EN NEGRO, GRIS, AMARILLO Y BLANCO)

Actúa como un **Lead Frontend Architect & UI/UX Designer** especializado en interfaces deportivas en tiempo real estilo **SofaScore** con React, TypeScript, Tailwind CSS y Socket.io.

## SISTEMA DE DISEÑO Y PALETA DE COLORES OBLIGATORIA
- **Fondo Principal**: Negro profundo (`#09090B` / `bg-zinc-950`).
- **Superficies y Paneles**: Gris oscuro y carbón (`#18181B` / `bg-zinc-900`, `#27272A` / `bg-zinc-800`, bordes `border-zinc-800`).
- **Acento Principal**: Amarillo deportivo (`#FACC15` / `bg-yellow-400`, `text-yellow-400`, `border-yellow-400`).
- **Texto**: Blanco puro (`#FFFFFF`) para nombres de equipos y marcadores; Gris claro (`text-zinc-400`) para metadatos.

## PANTALLAS Y FUNCIONALIDADES IMPLEMENTADAS
1. **Explorador de Torneos y Vista Detalle Estilo SofaScore (`/tournaments` y `/tournaments/:tournamentId`)**:
   - Barra superior de filtros rápidos estilo SofaScore: `TODOS`, `EN VIVO (LIVE)`, `PRÓXIMOS`, `FINALIZADOS`, selector de Fecha y selector de Equipo con su escudo e información del delegado.
   - Filas de partido tipo SofaScore: hora a la izquierda (8:00 AM - 6:00 PM), estado en vivo pulsante, escudos cargados desde el backend (`/uploads/teams/...`), parciales por set alineados en columnas, marcador de sets en **Amarillo (`#FACC15`)** y botón `📍 Mapa` con enlace directo a **Google Maps**.
   - Tablas de posiciones separadas por grupo (`Grupo A`, `Grupo B`) destacando con borde lateral amarillo a los equipos en puestos de clasificación (`qualifiersPerGroup`).
2. **Panel de Administración Completo (`/admin`)**:
   - Configuración de torneo con: Cupo de equipos (ej. 20), Cantidad de grupos (ej. 2 de 10 equipos), Clasificados por grupo (ej. 2), Fecha Inicio y Fecha Fin (con programación automática de 8:00 AM a 6:00 PM).
   - Registro de equipos con: Torneo asociado, validación de cupo (`X / 20`), Nombre del Equipo, Nombre del Delegado y subida de archivo de imagen del escudo (`FormData`).
   - Tabla de edición de cruces donde el Administrador puede editar fecha/hora, escribir el nombre de la cancha (`courtNumber`), pegar el link de Google Maps (`courtMapUrl`) y asignar el Juez (`refereeId`), además de generar la fase eliminatoria final con los clasificados de cada grupo.
