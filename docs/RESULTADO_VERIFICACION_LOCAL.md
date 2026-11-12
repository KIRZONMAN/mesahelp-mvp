# Verificación local de MesaHelp v0.3 — 4/5 de noviembre de 2026

## Evidencia ejecutada en el entorno de desarrollo de esta entrega

- `node --check src/server.js`, `src/db.js`, `src/live.js` y `public/live.js`: sin errores de sintaxis.
- `npm test`: **3 suites aprobadas, 0 fallos**.
  1. Migración aditiva desde una BD simulada v0.2 con ticket e historial existentes.
  2. Regresión de v0.2: autenticación, sesiones, permisos, CSRF, creación, estados e historial.
  3. v0.3: invitado y token privado, categoría de aseo, observaciones independientes, roles, protección CSRF, handshake WebSocket, control de origen, privacidad del ticket y señalización de cambios.
- `npm run check:agents`: comprobadas las **4 definiciones de agentes y 3 skills**, sin ejecutar a Claude Code.
- `npm run backup`: backup SQLite consistente generado en directorio temporal mediante `VACUUM INTO`.
- HTTP GET real a `/login`, `/guest/new`, `/seguimiento`, `/styles.css`, `/live.js` y `/healthz`: **HTTP 200**; formularios públicos presentes.

## Limitaciones verificables

- Se intentó abrir la aplicación con Chromium headless y Playwright, pero el entorno bloqueó toda navegación, incluso `localhost` y archivos locales (`ERR_BLOCKED_BY_ADMINISTRATOR`). No se pudo certificar el aspecto gráfico ni la interacción real del navegador; se requiere completar la guía de pruebas manuales en Opera.
- Las comprobaciones WebSocket se realizaron a nivel de protocolo TCP/HTTP y de notificaciones; **no sustituyen** la prueba visual de dos sesiones del navegador.
- Docker no está disponible en este entorno, por lo que no se compiló ni ejecutó la imagen ni Compose.
- No se realizó despliegue público, ni se contrató o creó un VPS, ni se ejecutaron subagentes Claude Code.
- No hay pruebas de carga, auditoría externa de seguridad ni verificación de un servicio accesible por Internet. El servidor WebSocket es mínimo y no debe considerarse listo para producción.

## Condición para marcar v0.3 como versión de entrega

1. Confirmar la ejecución real en Opera y de los escenarios de `PRUEBAS_MANUALES_V03.md`.
2. Conservar una copia de seguridad del SQLite original y confirmar la migración real con los tickets de la máquina del estudiante.
3. Ejecutar y documentar los agentes Claude Code si la rúbrica lo exige.
4. Probar Docker local y revisar seguridad antes de un posible despliegue público.
