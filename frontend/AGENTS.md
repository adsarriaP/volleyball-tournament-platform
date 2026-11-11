# Reglas del Agente IA — Frontend React + TypeScript + Tailwind PWA

1. **Stack**: React 18+, TypeScript estricto, Tailwind CSS, `socket.io-client`.
2. **Tiempo Real**: Usar el hook `useMatchLiveSocket.ts` para suscribirse a la sala `match_${matchId}` y escuchar `matchScoreUpdated`.
3. **Componentes Clave**:
   - `VolleyballCourt.tsx`: Renderizado 2D de posiciones 1 a 6 con indicador de sacador (P1) y transiciones de rotación horaria.
   - `RefereeScoreboard.tsx`: Interfaz táctil optimizada para tablets/móviles (PWA) exclusiva para `REFEREE` / `ADMIN`.

