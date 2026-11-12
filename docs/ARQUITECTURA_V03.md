# MesaHelp v0.3.1 — Arquitectura y decisiones técnicas

**Consolidación documental:** 10 de noviembre de 2026. Se conserva la arquitectura de v0.3 y se actualizan Live, responsive y la evidencia local. Resultados y procedencia en [VALIDACION_FINAL_20261110.md](VALIDACION_FINAL_20261110.md).

## Flujo principal

```
Opera / navegador
   | GET/POST, formulario CSRF
   v
src/server.js (HTTP, permisos, HTML)
   | operaciones parametrizadas, transacciones
   v
src/db.js -> SQLite: users, sessions, tickets, ticket_events,
                     guest_ticket_access (nueva en v0.3)
   |
   +--- tras COMMIT -> src/live.js (WebSocket solo aviso {ticketId})
                           |
                           v
                      public/live.js
                      | GET de página con sesión y permisos
                      v
                  reemplaza la zona visual sin F5
```

## Roles

- **Solicitante autenticado:** crea tickets; solo ve los suyos; recibe eventos WebSocket solo de tickets propios.
- **Coordinador:** ve todos, cambia estados y agrega observaciones; recibe avisos de cambios en el panel general.
- **Invitado:** no recibe usuario o sesión autenticada; crea ticket con código secreto de 192 bits (`MH-` + hex). Su código se almacena como hash SHA-256 en `guest_ticket_access`; la persona lo usa en un POST con CSRF para consultar. No hay edición o seguimiento WebSocket de invitado.
- **Usuario técnico `__invitado__`:** existe únicamente para conservar integridad referencial de los tickets anónimos sin rehacer el modelo v0.2. No puede iniciar sesión por HTTP.

## Historial de eventos

- Creación: `old_status IS NULL`, `new_status='abierto'`.
- Cambio: `old_status <> new_status`.
- Observación: `old_status = new_status`, con nota. Esta convención permite una mejora aditiva sin migrar la tabla de eventos.
- La aplicación no impone una máquina de estados secuencial; coordinación puede seleccionar cualquier estado admitido.

## Seguridad implementada y límites conocidos

1. Passwords scrypt + sal; cookies de sesión `HttpOnly` y `SameSite=Lax`, con `Secure` si `COOKIE_SECURE=1` bajo HTTPS.
2. Protección CSRF para login, creación, seguimiento y acciones autenticadas.
3. Permisos evaluados en el servidor, nunca solo en la interfaz. El WebSocket exige cookie de sesión válida, cabecera `Origin` del mismo sitio y permiso sobre el ticket solicitado.
4. Los mensajes WebSocket **solo contienen tipo de evento e ID**: no incluyen descripción, notas ni datos personales. El navegador recupera el HTML por HTTP con sus permisos.
5. SQL parametrizado, escape de contenido HTML y cabeceras CSP, `nosniff`, `no-referrer` y bloqueo de frames.
6. Límites básicos por IP del socket: 12 solicitudes/minuto para login, 8 para altas invitadas y 30 para consultas de seguimiento; el campo trampa reduce bots triviales. **No constituye protección suficiente contra abuso en Internet.**
7. El canal WebSocket es una implementación acotada de RFC 6455 hecha con módulos nativos de Node, de salida (server→browser) y sin recibir mensajes de aplicación. Mantiene un máximo de 80 conexiones y ping/pong. **No está endurecido ni auditado para producción pública**; antes de publicarlo, migrar a `ws` u otra biblioteca mantenida, ejecutar pruebas de carga y endurecer el proxy.
8. El límite por IP actual usa la dirección del socket TCP; detrás de un proxy todas las solicitudes pueden aparecer con una sola IP. Necesita un diseño específico de rate limiting en proxy de confianza para producción.
9. El modo invitado no dispone de mecanismo de recuperación de códigos. La entrega del código es una credencial de tipo bearer y quien la posea podrá consultar el ticket. Se desaconseja incluir datos sensibles en tickets anónimos.

Estas son implementaciones identificadas mediante revisión de código, no una certificación de seguridad ni una validación de HTTPS público.

## Cliente Live y presentación v0.3.1

- `public/live.js` encola avisos durante consultas en curso, sincroniza al reconectar y realiza sondeo de recuperación cada 20 segundos con la pestaña visible. También consulta al recuperar visibilidad, foco o conexión de red.
- Compara valores de formularios para proteger borradores incluso después de perder el foco. Aplaza reemplazos con campos activos, cambios pendientes o envíos en curso. No ofrece persistencia de borradores tras cerrar o recargar la página.
- Los envíos interceptados conservan el borrador ante errores HTTP/red o una redirección a login. Una respuesta tardía no debe borrar ediciones posteriores ni el borrador de otro formulario; las revisiones del cliente descartan consultas iniciadas antes de una edición.
- La regresión reportada incluye 13 pruebas del cliente Live con DOM, red y WebSocket simulados, dentro de 16 pruebas totales aprobadas. La comprobación manual Live se registra por separado; no acredita cada fallo simulado en un navegador real.
- `public/styles.css` contiene la corrección de tarjetas superpuestas: permite contraer columnas y paneles, ajusta textos y pasa el detalle a una columna hasta 990 px. Se reportó comprobación manual favorable al dividir pantalla; no se acredita una matriz exhaustiva de dispositivos.

## Persistencia y Docker

- SQLite en modo WAL, una instancia Node con acceso a la base.
- `scripts/backup-db.cjs` usa `VACUUM INTO` para backup consistente.
- Respaldo reportado: hashes SHA256 iguales entre las copias comparadas, `integrity_check=ok` y cero infracciones de claves foráneas. Copia verificada con 3 usuarios, 2 sesiones, 5 tickets, 19 eventos y 1 acceso de invitado; son conteos de esa copia.
- Restauración funcional aislada en puerto 3001: una escritura de prueba no alteró la instancia original del puerto 3000.
- Dockerfile usa Node 24 Alpine, usuario no privilegiado, puerto 3000 y comprobación `/healthz`.
- `compose.local.yml`: contenedor local en `127.0.0.1:3000`, volumen SQLite.
- Prueba Docker independiente: construcción exitosa de `mesahelp:prueba-local`, ejecución en puerto 3010, healthcheck `healthy` y recuperación de un ticket invitado después de eliminar y recrear el contenedor reutilizando su volumen.
- `compose.yml`: app + Caddy para un dominio con HTTPS. `docker compose config --quiet` validado con dominio ficticio; no se ha ejecutado el despliegue de producción con Caddy. **Sin despliegue confirmado en Hetzner ni validación pública de HTTPS/Caddy**.
- No ejecutar múltiples instancias compartiendo SQLite y WebSockets sin cambiar arquitectura.

## Codex y configuración histórica de Claude

`.claude/agents/` contiene las definiciones `analista-mvp`, `desarrollador-node`, `auditor-calidad` y `devops-hetzner`; son herramientas del **proceso de desarrollo**, no participantes del flujo de tickets. Su comprobación estructural es distinta a su uso real. Archivar la evidencia real de ejecución en `docs/evidencia-agentes/`.

`.codex/agents/` y `.agents/skills/` contienen las configuraciones equivalentes de Codex. Se utilizó Codex para auditoría y correcciones. Los resultados satisfactorios de `check:agents` y `check:codex` comprueban estructura; no demuestran la ejecución independiente de todos los subagentes. `CLAUDE.md` y `.claude/` permanecen como configuración histórica independiente.
