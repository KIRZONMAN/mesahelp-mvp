# MesaHelp v0.3.1 — alcance académico y criterios de aceptación

**Fecha de corte de la propuesta:** 4 de noviembre de 2026. **Fecha ofrecida por el profesor para entregar:** viernes 13 de noviembre de 2026, según revisión oral del estudiante. Confirmar requisitos finales con las consignas del curso.

**Corte de consolidación:** 10 de noviembre de 2026. Los resultados reportados por el propietario y su alcance se detallan en [VALIDACION_FINAL_20261110.md](VALIDACION_FINAL_20261110.md); esta actualización documental no vuelve a ejecutar esas verificaciones.

## Alcance autorizado para v0.3 (plan equilibrado)

| Código | Funcionalidad | Estado al corte documental |
|---|---|---|
| F-01 | Login/logout como solicitante y coordinador | Implementado; prueba automatizada |
| F-02 | Creación de tickets autenticados | Implementado; prueba automatizada |
| F-03 | Estados Abierto, En proceso, Resuelto, Cerrado | Implementado; prueba automatizada |
| F-04 | Historial de cambios | Implementado; prueba automatizada |
| F-05 | Aislamiento de tickets por rol | Implementado; prueba automatizada |
| F-06 | Categoría Aseo y mantenimiento | Implementado; prueba automatizada |
| F-07 | Nota sin cambio de estado | Implementado; prueba automatizada |
| F-08 | Creación y seguimiento de tickets como invitado con código secreto | Implementado; prueba automatizada |
| F-09 | Avisos WebSocket de cambios para sesiones autenticadas | Implementado; pruebas de protocolo y cliente simulado; comprobación manual Live reportada, sin cobertura manual exhaustiva acreditada |
| F-10 | Tarjeta Resueltos y categoría en listado | Implementado; corrección responsive con comprobación manual favorable al dividir pantalla |
| INF-01 | Respaldo y restauración SQLite | Copia verificada, integridad y claves foráneas correctas; restauración funcional aislada en 3001 sin alterar 3000 |
| INF-02 | Docker local | Imagen construida, ejecución en 3010, healthcheck healthy y persistencia del ticket invitado tras recrear contenedor con el mismo volumen |
| INF-03 | Hetzner + HTTPS | Configuración preparada; **sin despliegue real** |
| IA-01 | Cuatro agentes Claude Code y tres skills | Estructura validada; **sin ejecución real certificada** |
| IA-02 | Configuraciones Codex y uso de Codex | Estructura validada; Codex utilizado para auditoría y correcciones, sin demostrar ejecución independiente de todos los subagentes |

## Evidencia y límites

- Regresión final reportada: `npm test`, **16 pruebas aprobadas y ninguna fallida**, incluida migración SQLite y cliente Live v0.3.1. No equivale a una auditoría de producción.
- `npm run check:agents` y `npm run check:codex`: satisfactorios; comprueban estructura, no ejecución efectiva de subagentes.
- Live: protección de borradores, errores HTTP/red, reconexión y respuestas tardías cubiertos por pruebas automatizadas del cliente simulado. La comprobación manual reportada se distingue de esa cobertura y no acredita todos esos casos en navegador real.
- SQLite: respaldo realizado, hashes SHA256 iguales entre las copias comparadas, `integrity_check=ok`, cero infracciones de claves foráneas; copia con 3 usuarios, 2 sesiones, 5 tickets, 19 eventos y 1 acceso de invitado. Escritura de prueba en la restauración aislada de 3001 sin alterar la instancia original de 3000.
- Docker: `mesahelp:prueba-local` construido y ejecutado en 3010, `healthy`, ticket invitado recuperado tras eliminar y recrear el contenedor reutilizando el volumen. `docker compose config --quiet` validado con dominio ficticio; sin despliegue de producción con Caddy.
- Seguridad identificada en código: cookies HttpOnly y SameSite, Secure configurable, CSRF, CSP, SQL parametrizado y límites básicos de 12 solicitudes/minuto para login, 8 para creación de invitados y 30 para seguimiento. No constituye certificación de seguridad.
- El WebSocket manual de una instancia sirve al MVP académico; **no** autoriza un despliegue público sin endurecimiento.
- Se conserva la misión: informar y dar seguimiento, **no solucionar automáticamente** las incidencias.

## Pendientes recomendados antes de presentar

1. Ensayar el guion v0.3.1 y conservar evidencia manual sin secretos; completar los escenarios de navegador cuya ejecución no esté individualmente documentada.
2. Si la rúbrica exige subagentes independientes, acreditar solo las ejecuciones reales; las definiciones y los validadores no las sustituyen.
3. Mantener como evidencia complementaria el respaldo/restauración y Docker local ya verificados; conservar registros originales sin datos sensibles.
4. Antes de exposición pública, revisar rate limiting detrás del proxy (hoy usa la IP del socket), privacidad y endurecimiento/carga del WebSocket mínimo de una sola instancia. Hetzner y HTTPS/Caddy público siguen sin confirmación.
5. Confirmar requisitos académicos y aprobación del propietario para la entrega del 13 de noviembre; esta consolidación no declara preparación para producción.

## Fuera de alcance

Chat interno, IA que resuelva tickets, archivos adjuntos, correo, escalamiento multiárea, categorías editables desde UI, SMS, SLA, app móvil, múltiples réplicas de backend, contratación automática de infraestructura.

## Actualización de estrategia (05-11-2026)

El 5 de noviembre se adoptó **ChatGPT Plus + Codex** como herramienta principal y quedaron definidas cuatro configuraciones de subagentes y tres skills, conservando el material de Claude por trazabilidad académica. En ese corte responsive y una revisión Live más amplia estaban pendientes.

Al 10 de noviembre se reporta uso de Codex para auditoría y correcciones, corrección responsive comprobada manualmente y estabilización Live con pruebas automatizadas y comprobación manual de alcance limitado. No se ha demostrado la ejecución independiente de todos los subagentes. Se mantiene el presupuesto extra de IA de US$0; no se contrata Claude Pro ni se autoriza consumo adicional. Hetzner conserva su autorización presupuestaria independiente y no tiene despliegue confirmado.
