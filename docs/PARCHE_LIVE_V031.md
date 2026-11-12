# MesaHelp v0.3.1 - parche de fiabilidad del seguimiento en vivo

Este parche afecta SOLO al cliente `public/live.js` y añade `tests/live-client.test.js`.
No cambia tablas SQLite, credenciales, usuarios, tickets, servidor o Docker.

## Problemas atendidos

- Los avisos WebSocket recibidos durante un `fetch` anterior ya no se descartan: se encolan para consultar de nuevo.
- Al reabrirse el WebSocket se sincroniza el estado que pudo cambiar mientras estuvo desconectado.
- Una sincronización periódica de 20 segundos sirve de recuperación si un aviso se pierde.
- Las consultas sin cambios no reemplazan el contenido de la página.
- Si el usuario está escribiendo dentro de un formulario, se aplaza la sustitución de contenido hasta salir del campo.
- Cuando una sesión vuelve a estar visible, obtiene foco o recupera conexión de red, se sincroniza de nuevo.

## Instalación en Windows

1. Detén `npm start` con `Ctrl+C`.
2. Dentro de `D:\Proyectos\MesaHelp\MesaHelp_v03\MesaHelp_MVP`, respalda `public\live.js` como `public\live.js.bak`.
3. Copia las carpetas `public`, `tests` y `docs` de este ZIP sobre el mismo proyecto (fusionar carpetas y reemplazar SOLO `public\live.js`).
4. Ejecuta `npm test` y `npm start`.
5. En Opera usa `Ctrl+F5` para cargar el JavaScript nuevo.
6. Repite la prueba entre una sesión normal y una privada. Abre el mismo ticket en ambas ventanas; modifica estado desde el coordinador; observa el solicitante sin recargar. Repite agregando una observación, dos cambios seguidos y reabriendo la ventana después de una desconexión.

## Límites

Este cambio mejora la sincronización del navegador, pero no sustituye pruebas reales en Opera ni demuestra que la conexión WebSocket nunca se interrumpa. El sondeo de recuperación no es instantáneo (máximo objetivo 20 segundos si la pestaña está visible). La implementación WebSocket del servidor sigue siendo la versión mínima académica y debe revisarse antes de despliegue público.

## Reversión

Detén el servidor y restaura `public\live.js.bak` sobre `public\live.js`. La base de datos no requiere reversión.
