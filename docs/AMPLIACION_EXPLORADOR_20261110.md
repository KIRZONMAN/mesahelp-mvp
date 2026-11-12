# MesaHelp v0.3.1 — Ampliación probada localmente: Explorador de Tickets

**Corte:** 10 de noviembre de 2026. **Origen:** ZIP de revisión aportado por el estudiante. **Objetivo:** una última funcionalidad útil sin alterar los procesos ni los datos de MesaHelp.

## Alcance implementado

- Buscar por identificador y asunto de tickets (sin distinguir mayúsculas o tildes).
- Filtrar por estado y categoría, combinando criterios.
- Mostrar contador de coincidencias, estado sin resultados y botón para limpiar.
- Preservar los controles y criterios ante actualizaciones del listado con Live.
- Diseño adaptable al tamaño de pantalla; sin dependencias npm nuevas.

## Seguridad y arquitectura

El servidor entrega únicamente `DB.listTickets(user)` para el usuario autenticado. El filtrado se realiza **sobre ese subconjunto autorizado** en `public/explorer.js`; no es una nueva ruta de consulta ni modifica permisos. `src/server.js` agrega los atributos HTML necesarios y sirve el JS estático. Los controles quedan fuera de `[data-live-zone]` para evitar que Live los reemplace. Antes de comparar el HTML, `public/live.js` aplica la misma representación de filas filtradas a la respuesta; de esta forma, el sondeo no provoca reconstrucciones por simples atributos `hidden`.

Si se desactiva JavaScript, el panel de filtros permanece oculto y el listado autorizado sigue visible. Los filtros no persisten después de recargar/cerrar el navegador; esa persistencia no forma parte del alcance.

## Archivos afectados

- `src/server.js`: controles de exploración, metadatos de las filas y carga de `/explorer.js` en el panel.
- `public/explorer.js`: búsqueda, filtros, conteo, vacíos y restablecimiento.
- `public/live.js`: integración acotada con los filtros durante las actualizaciones.
- `public/styles.css`: estilo visual y adaptación responsive.
- `tests/explorer.test.js`: nuevas pruebas del filtrado.
- `tests/live-client.test.js`: nueva comprobación de integración de Live.
- `tests/v03.test.js`: comprobación adicional de permisos y entrega del script.
- `README.md` y este documento: explicación de la ampliación.

No se modificaron `src/db.js`, archivos SQLite, respaldos, Dockerfile, Compose, scripts de seed ni definiciones de agentes.

## Evidencias de la revisión de esta copia

- `npm test`: **22 pruebas aprobadas, 0 fallidas** (16 originales + 6 nuevas), ejecutadas en un directorio extraído del ZIP.
- Comprobación de interacción del explorador en Chromium con DOM real y HTML producido por el servidor: búsqueda sin tildes, filtros combinados, borrado, mensaje de cero coincidencias y reposición de la zona Live simulada.
- Inspección móvil a 390 px: controles visibles y sin desbordamiento horizontal en el escenario probado.
- Los tests de sistema verifican que el solicitante no recibe filas de otro solicitante ni de invitados; el coordinador recibe el listado autorizado por el servidor.

**Límite de la evidencia:** la comprobación de Chromium se realizó sobre HTML servido e inyectado en el navegador de pruebas debido a restricciones de acceso directo a localhost en el entorno de auditoría. No equivale a una prueba manual de punta a punta de WebSocket en Opera ni a una auditoría exhaustiva de dispositivos. Las 13 pruebas Live anteriores y la nueva prueba de integración simulan el protocolo y el DOM de forma controlada. La instalación definitiva debe validarse en el navegador del estudiante.

## Verificación recomendada en Windows

1. Conservar la instalación original y sus respaldos intactos.
2. Extraer el ZIP completo en **una carpeta de prueba diferente**.
3. Ejecutar `npm.cmd test`, `npm.cmd run check:agents` y `npm.cmd run check:codex` en esa copia.
4. Iniciar esa copia en un puerto libre con una **copia de datos SQLite aislada** (`DATA_DIR`) y comprobar que se puede iniciar sesión; nunca ejecutar `seed` sobre datos del proyecto original.
5. En el panel, buscar por asunto/número, combinar estado/categoría, probar «Limpiar filtros», crear un ticket desde otra sesión y comprobar que Live conserva la búsqueda.
6. Verificar el mismo panel como solicitante y como coordinador; comprobar que no aparecen tickets ajenos para solicitante.
7. Solo si la validación es favorable, planificar la integración de los archivos en la carpeta principal.

## Estado y límites

**Pruebas automatizadas (22/22) y comprobaciones manuales en Opera reportadas favorables; integración a la instalación principal aún pendiente.** No se propone desplegarla públicamente ni modificar Hetzner. Mantener como versión de respaldo la instantánea de MesaHelp v0.3.1 previa al explorador. Los informes de validación anteriores describen la versión anterior a esta ampliación y no deben interpretarse como resultados ejecutados después de ella.

## Adenda de comprobación manual en Opera

El estudiante reportó pruebas del Explorador con coordinador y solicitante, búsqueda por número y filtros combinados. Para Live, se mantuvo una búsqueda activa y el filtro Académico durante la creación de un ticket #0006 desde otra sesión del mismo rol; el listado y el total se actualizaron sin F5 y conservaron los criterios. Esta comprobación es favorable para ese escenario, sin acreditar una matriz exhaustiva ni despliegue público.
