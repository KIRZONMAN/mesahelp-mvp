# MesaHelp v0.3.1 — Validación consolidada al 10 de noviembre de 2026

## Propósito, procedencia y alcance

Este informe consolida las verificaciones comunicadas por el propietario para la Misión 06C. La fecha corresponde al corte documental; no atribuye una fecha individual a cada ejecución previa. La consolidación modifica exclusivamente README, alcance, arquitectura y guion, y crea este informe. No declara la aplicación lista para producción.

Los resultados de regresión, validadores, comprobaciones manuales, SQLite, restauración y Docker son **evidencia previa reportada por el propietario**, incorporada sin repetir esas operaciones en esta misión. La inspección de los archivos actuales permite describir la cobertura de los tests y las implementaciones identificadas. No se aportaron aquí logs individuales, valores literales de hashes ni capturas de esas verificaciones; no se inventan ni se sustituyen por ejemplos.

Los documentos de verificación del 4/5 de noviembre y los registros históricos de Claude/Codex se conservan. Sus afirmaciones sobre responsive pendiente, Docker no ejecutado o Codex solo configurado describen cortes anteriores; el estado consolidado vigente se recoge aquí.

## Resultados automatizados reportados

- **Regresión final:** `npm test`, 16 pruebas aprobadas y ninguna fallida.
- **Estructura:** `npm run check:agents` y `npm run check:codex`, satisfactorios. Validan presencia/formato de configuraciones; no acreditan ejecución efectiva de subagentes.
- La inspección de `tests/` identifica 3 pruebas de sistema, v0.3 y migración, más 13 del cliente Live. Las pruebas de protocolo HTTP/WebSocket y las del cliente simulado no equivalen a interacción completa en un navegador real ni a pruebas de carga.

### Cobertura automatizada del cliente Live

Las 13 pruebas de `tests/live-client.test.js` usan DOM, solicitudes HTTP, temporizadores y WebSocket simulados. Cubren:

- Sincronización al abrir y conservación del contenido cuando no hay cambios.
- Protección de texto y selección pendientes tras perder el foco, y detección de valores cambiados sin evento de entrada.
- Recuperación de novedades después de descartar o revertir cambios, y tras un guardado confirmado.
- Conservación del borrador ante errores HTTP, de red o redirección a login.
- Conservación de ediciones posteriores a un POST tardío y del borrador de otro formulario.
- Descarte de un GET iniciado antes de editar, incluso si después se revierte la edición.
- Recuperación de visibilidad, foco, conexión y página sin perder borradores; avisos simultáneos durante una consulta.
- Recuperación al reconectar y mediante sondeo; respeto de campos activos durante una actualización.

Estos resultados no demuestran ausencia de fallos en cualquier navegador, red o secuencia de concurrencia. La protección es del formulario en la página abierta; no acredita almacenamiento persistente de borradores tras recargar o cerrar.

## Comprobaciones manuales reportadas

- **Responsive:** corrección implementada y comprobación manual favorable de las tarjetas al dividir la pantalla. No se acredita una matriz exhaustiva de dispositivos, tamaños y navegadores.
- **Live (Opera, sesiones independientes):** el estudiante reportó conservación de borradores durante actualizaciones remotas y recuperación de la sincronización al descartar o guardar cambios. En DevTools, con la conexión simulada como Offline, el borrador sobrevivió a solicitudes fallidas; después de reconectar, un envío manual permitió registrar y visualizar la observación en otra sesión. También se ensayaron solicitudes ralentizadas, pero el material resumido no demuestra de forma concluyente el orden exacto entre edición y respuesta tardía; ese comportamiento sí tiene prueba automatizada de cliente. No se acreditó una revisión exhaustiva de duplicados para todos los escenarios. **Las capturas y trazas individuales no están anexadas a este ZIP**. Se mantiene separada esta evidencia manual de la cobertura automatizada.

El guion de demostración propone acciones para la exposición; su inclusión no constituye evidencia de ejecución.

## SQLite: respaldo e integridad

Se reportó respaldo realizado y **hashes SHA256 iguales entre las copias comparadas**, `integrity_check=ok` y **cero infracciones de claves foráneas**. No se infiere que toda base activa deba ser idéntica byte a byte a un respaldo creado mediante `VACUUM INTO`.

La copia verificada contenía:

- 3 usuarios.
- 2 sesiones.
- 5 tickets.
- 19 eventos.
- 1 acceso de invitado.

Estos conteos corresponden a la copia verificada y no describen necesariamente la base activa actual. No se incluyen credenciales, cookies, códigos privados, rutas privadas de respaldos ni contenido de tickets.

## Restauración funcional aislada

La copia se restauró funcionalmente en una instancia aislada en el **puerto 3001**. Se comprobó que una escritura de prueba en esa instancia **no alteró la instancia original del puerto 3000**. Es evidencia de recuperación local e independencia para esa prueba; no acredita un plan de recuperación de producción completo ni se repitió aquí sobre los datos.

## Docker y Compose

- Construcción exitosa de **`mesahelp:prueba-local`**.
- Ejecución local en el **puerto 3010**, con healthcheck **`healthy`**.
- Ticket invitado creado y recuperado después de eliminar y recrear el contenedor **reutilizando su volumen**. Se verificó persistencia en esa prueba local.
- **`docker compose config --quiet`** validado con un dominio ficticio. Comprueba la configuración, sin acreditar un dominio público ni emisión de certificados.

La prueba de 3010 es distinta de `compose.local.yml`, que publica `127.0.0.1:3000`. **No se ha ejecutado el despliegue de producción con Caddy**. No hay despliegue confirmado en Hetzner ni validación pública de HTTPS/Caddy.

## Seguridad: implementaciones identificadas en código

La revisión de código identifica cookies `HttpOnly` y `SameSite=Lax`, atributo `Secure` configurable mediante `COOKIE_SECURE`, CSRF, CSP y consultas SQL parametrizadas. También identifica limitadores básicos:

- Login: 12 solicitudes por minuto.
- Creación de invitados: 8 solicitudes por minuto.
- Consultas de seguimiento: 30 solicitudes por minuto.

Son verificaciones de código, **no una certificación de seguridad** ni evidencia de funcionamiento seguro en Internet. El rate limiting utiliza la IP del socket TCP; queda pendiente su revisión detrás de un proxy de confianza. El WebSocket es mínimo, de una sola instancia, sin auditoría de carga ni endurecimiento para producción.

## Uso de Codex y trazabilidad

Se utilizó **Codex para auditoría y correcciones**, según la evidencia comunicada para esta misión. No se ha demostrado la ejecución independiente de todos los subagentes. Las definiciones de roles y skills y los resultados de los validadores de estructura no prueban que esos subagentes se hayan invocado.

`CLAUDE.md`, `.claude/` y sus registros se mantienen como configuración e histórico independientes. No se atribuye a Claude ni a subagentes una intervención sin evidencia de ejecución.

## Pendientes y recomendaciones

1. Confirmar Hetzner y HTTPS/Caddy público únicamente después de un despliegue autorizado y comprobado; las verificaciones locales no lo sustituyen.
2. Revisar rate limiting por IP detrás del proxy, y realizar endurecimiento y pruebas de carga del WebSocket antes de exposición pública.
3. Completar, si se requiere mayor cobertura manual, registros por escenario de Live y una matriz responsive de navegadores/tamaños; conservar evidencia sin secretos.
4. Vincular logs originales, hashes y evidencias manuales sanitizadas si están disponibles. La ausencia de esos anexos limita la trazabilidad independiente de este resumen.
5. Si se exige acreditar subagentes, registrar únicamente sus ejecuciones reales. Revisar los documentos históricos fuera del alcance de esta misión si se desea actualizar sus referencias, preservando el corte original.
6. Confirmar requisitos de la rúbrica y aprobación del propietario para la entrega académica del 13 de noviembre de 2026.

Esta consolidación distingue resultados probados reportados, implementaciones identificadas y recomendaciones futuras. No autoriza despliegue, gastos ni cambios funcionales.


## Adenda de ampliación: Explorador de Tickets (10 de noviembre de 2026)

Esta adenda amplía el corte anterior de 16 pruebas. **La versión integrada aquí reúne 22 pruebas automatizadas aprobadas (0 fallos)**: 16 casos previos y 6 adicionales vinculados al Explorador, incluidos los de filtrado, búsqueda y su interacción con Live. El resultado de 22/22 fue reportado por el estudiante tras ejecutar `npm.cmd test` en Windows; las dos validaciones estructurales `check:agents` y `check:codex` también resultaron satisfactorias. Los resultados históricos de 16/16 anteriores describen el estado previo a esta función.

**Comprobaciones manuales reportadas en Opera sobre el puerto 3011 y una copia aislada de SQLite:**

- Coordinador: Explorador visible; combinación de estado **Cerrado** y categoría **Académico** mostró una coincidencia entre cinco tickets autorizados.
- Solicitante: búsqueda del ticket `0002` mostró una coincidencia entre tres tickets autorizados.
- Live + filtros: una sesión de solicitante conservó búsqueda `Explorador Live` y categoría `Académico`; otro acceso del mismo rol creó el ticket #0006. Sin recargar la página, el total del primer panel pasó de 3 a 4 y apareció el nuevo ticket coincidente. Se observó actualización sin F5.

Las capturas de esta comprobación fueron compartidas durante la revisión conversacional y **no están incorporadas en este ZIP**. La secuencia manual muestra un caso favorable, no prueba todas las combinaciones, navegadores ni roles en la sincronización cruzada. El modo invitado no dispone de Explorador porque consulta un ticket individual mediante código privado. El documento `docs/AMPLIACION_EXPLORADOR_20261110.md` describe los componentes y límites de esta ampliación.

**La validación de Docker, restauración SQLite, Compose y seguridad descrita arriba corresponde a la base v0.3.1 anterior al Explorador**, no a una ejecución Docker repetida de esta ampliación. Antes de desplegar la versión integrada habría que reconstruir la imagen y repetir sus comprobaciones. El despliegue público sigue sin validarse.
