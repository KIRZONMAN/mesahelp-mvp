# MesaHelp — instrucciones de Codex

## Propósito y entorno
MVP académico de mesa de ayuda, creado con Node.js HTTP nativo, `node:sqlite` y CSS.
Registra tickets y su seguimiento: **no resuelve automáticamente incidencias**.
Código: `src/server.js`, `src/db.js`, `src/live.js`, `public/live.js`, `public/styles.css`.
Pruebas: `npm test`; validaciones de estructura: `npm run check:agents` y `npm run check:codex`.
Para contexto técnico usa `docs/ARQUITECTURA_V03.md`; para requisitos usa `docs/ALCANCE_Y_VALIDACION.md`.

## Estado de referencia documentado (10-11-2026): verificar antes de intervenir
- La versión del paquete es **v0.3.1** (`package.json`). El MVP incluye roles, tickets, categorías, invitados, historial, observaciones, Live y Explorador de Tickets (filtrado local autorizado).
- La superposición responsive al dividir pantalla **fue corregida** en `public/styles.css`, con comprobación manual favorable. No se afirma cobertura exhaustiva de dispositivos.
- Live recibió correcciones para conservar borradores durante actualizaciones, fallos de red y respuestas tardías. La regresión previa fue **16/16** (13 pruebas de cliente Live simulado y 3 de sistema/migración); tras el Explorador, la regresión actual reportada y comprobada en esta copia es **22/22**. Ver `docs/VALIDACION_FINAL_20261110.md` y `docs/AMPLIACION_EXPLORADOR_20261110.md`.
- SQLite: respaldo, integridad y restauración aislada en puerto 3001 comprobados según evidencias reportadas. Docker: imagen construida, contenedor saludable en 3010 y persistencia verificada tras recreación. **Compose solo fue validado estáticamente**; no se acredita ejecución pública de Caddy, HTTPS ni Hetzner.
- Seguridad: revisión estática de cookies, CSRF y límites básicos; para producción siguen pendientes proxy/IP real, endurecimiento de WebSocket y pruebas de carga.
- Codex principal se utilizó en auditoría, correcciones y documentación; **no** se acredita ejecución independiente de los cuatro subagentes. Conservar `CLAUDE.md` y `.claude/` como configuración histórica independiente.
- Este estado es un corte documental, **no una aprobación para producción**. Contrastar siempre con código, pruebas y documentación vigentes antes de decidir cambios.

## Reglas de trabajo
1. **Primera tarea: solo inspección.** No modificar archivos hasta que el usuario autorice un cambio concreto.
2. Mantener funcionalidad y datos. Nunca ejecutar `npm run seed` sobre una base ya poblada, borrar `data/`, modificar `backups/` ni regenerar credenciales.
3. Antes de editar, informar qué se cambiará y por qué; usar diffs pequeños, reversibles y comprobables.
4. Después de cambios de código, ejecutar `npm test` y los validadores de estructura pertinentes; informar resultados reales.
5. No eliminar ni reemplazar `.claude/`, su histórico, las skills antiguas ni copias `.bak`.
6. Proteger autenticación, permisos, CSRF, códigos de invitado y WebSockets. Evitar exponer secretos y tickets reales en informes.
7. No usar OpenAI API/Anthropic API con facturación, créditos extra, MCP de pago, Claude Pro ni servicios externos facturables. La frontera adicional de IA es **US$0**, salvo autorización explícita.
8. Hetzner es una excepción presupuestaria independiente: **no** crear/desplegar recursos, cambiar DNS, comprar dominios ni generar cargos sin autorización.
9. No instalar paquetes ni introducir nuevas integraciones sin justificación y aprobación.
10. Registrar agentes, comandos, pruebas y evidencias **solo después** de ejecutarlos realmente; el archivo de configuración por sí solo no acredita ejecución.

## Roles y skills disponibles
- Subagentes de Codex en `.codex/agents/`: `analista_mvp`, `desarrollador_node`, `auditor_calidad`, `devops_hetzner`.
- Skills de Codex en `.agents/skills/`: `ciclo-tickets`, `auditar-mvp`, `preparar-hetzner`.
- El historial académico de Claude se conserva por separado en `.claude/`.

## Criterio de entrega
No declarar MesaHelp finalizado ni listo para exposición pública sin pruebas relevantes, auditoría, respaldo/restauración verificados y aprobación del propietario. Fecha de referencia académica: 13 de noviembre de 2026.
