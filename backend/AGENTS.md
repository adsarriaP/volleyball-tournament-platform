# Reglas del Agente IA — Backend NestJS + Prisma + WebSockets

1. **Tipado Estricto**: Prohibido usar `any` implícito. Todos los DTOs deben validarse con `class-validator` y `class-transformer` (`whitelist: true`, `forbidNonWhitelisted: true`).
2. **Motor Puro (`VolleyballEngineService`)**:
   - No debe tener dependencias de base de datos; recibe estados inmutables y retorna el nuevo estado calculado.
   - Rotación reglamentaria en sentido horario cuando el equipo receptor gana el punto (`side-out`):
     `P1 -> P6`, `P6 -> P5`, `P5 -> P4`, `P4 -> P3`, `P3 -> P2`, `P2 -> P1 (nuevo sacador)`.
   - Si anota el equipo que ya tenía el saque, suma punto pero NO rota.
3. **Transacciones ACID**:
   - `LiveScoringService.scorePoint()` siempre ejecuta la lectura y actualización de `Match`, `MatchSet` y `SetLineup` dentro de `this.prisma.$transaction(...)`.
   - Solo después de confirmar (`commit`) la transacción se emite el evento WebSocket `matchScoreUpdated` a la sala `match_${matchId}`.
4. **Base de Datos XAMPP**:
   - Conexión local predeterminada en `.env`: `DATABASE_URL="mysql://root:@localhost:3306/volleyball_tournaments"`.

