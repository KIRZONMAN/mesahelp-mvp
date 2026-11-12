# Guion de demostración para Jefferson — MesaHelp v0.3.1 (4–5 minutos)

**Corte documental:** 10 de noviembre de 2026. Preparar dos sesiones independientes y un ticket autenticado de demostración antes de empezar. Usar datos ficticios y mantener credenciales y códigos privados fuera de la proyección. Este guion propone acciones; no acredita que se hayan ejecutado en esta sesión documental.

**0:00–0:40 · Propósito y alcance**

«MesaHelp es una aplicación académica para registrar, clasificar y hacer seguimiento de solicitudes. La plataforma no soluciona técnicamente las incidencias, sino que facilita su trazabilidad. v0.3.1 consolida los flujos de v0.3, corrige la superposición de tarjetas al dividir pantalla y mejora la estabilidad del seguimiento en vivo».

**0:40–1:30 · Invitado y categorías**

Abrir `/guest/new`, registrar un ticket ficticio de **Aseo y mantenimiento** y guardar el código fuera de la proyección. Consultarlo en `/seguimiento` sin mostrar el código completo. Explicar que se almacena su hash en SQLite y que el invitado no tiene acceso a otros tickets.

**1:30–2:30 · Coordinador y observaciones**

Acceder con el coordinador, ubicar el ticket recién generado, cambiar a **En proceso** y registrar una observación adicional sin cambiar el estado. Mostrar el historial cronológico y el número de eventos.

**2:30–3:30 · Live y responsive**

En las dos sesiones preparadas, mantener el ticket autenticado en la del solicitante, modificarlo desde coordinación y observar el cambio sin F5. Explicar: «El WebSocket comunica solo el aviso; el navegador consulta de nuevo el contenido por HTTP, que verifica sus permisos». El modo invitado consulta manualmente con su código.

Explicar con la evidencia automatizada que Live conserva borradores ante novedades, errores de guardado y respuestas tardías, sin presentar todos esos escenarios como ejecutados en directo. Dividir la pantalla para mostrar el detalle sin tarjetas superpuestas. No dedicar este bloque a simular todos los errores o desconexiones.

**3:30–4:05 · Arquitectura y validación**

Señalar las responsabilidades de `src/server.js`, `src/db.js`, `src/live.js` y `public/live.js`. Mostrar el resumen de [validación final](VALIDACION_FINAL_20261110.md): 16 pruebas aprobadas y ninguna fallida. Aclarar que los casos automatizados Live usan un entorno simulado; las comprobaciones manuales se registran por separado. Las protecciones de cookies, CSRF, CSP, SQL parametrizado y límites básicos se identificaron en código; no constituyen certificación de seguridad.

**4:05–4:40 · Codex y evidencia complementaria**

«Se utilizó Codex para auditoría y correcciones. `check:agents` y `check:codex` fueron satisfactorios, pero comprueban estructura y no demuestran la ejecución independiente de todos los subagentes. La configuración de Claude se conserva como histórico».

Señalar, sin repetir operaciones en directo, la evidencia complementaria del respaldo SQLite y restauración aislada en 3001 sin alterar 3000, y Docker local en 3010 con healthcheck `healthy` y persistencia tras recrear el contenedor. Compose se validó con dominio ficticio; no se ha ejecutado producción con Caddy ni confirmado Hetzner o HTTPS público.

**4:40–4:50 · Cierre**

«La versión v0.3.1 reúne seguimiento de tickets, mejoras de interfaz y verificaciones locales. Quedan pendientes HTTPS/Caddy público, revisión del límite por IP detrás del proxy y endurecimiento y carga del WebSocket. No se declara lista para producción».

## Evidencia complementaria fuera de los 4–5 minutos

Consultar el informe final para hashes SHA256 iguales, integridad y claves foráneas de SQLite, conteos de la copia, aislamiento de restauración y persistencia Docker. No proyectar respaldos, cookies, credenciales, códigos privados ni contenido sensible de tickets. Las pruebas de infraestructura se presentan como resultados reportados, sin reconstruir contenedores ni escribir sobre bases durante la exposición.
