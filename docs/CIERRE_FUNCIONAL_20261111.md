# Cierre funcional — MesaHelp 11/11/2026

## Alcance
- Nueva búsqueda combinada: asunto/número, estado, categoría y **prioridad**.
- Nuevo ordenamiento del Explorador: actividad reciente, antigua, prioridad alta primero y prioridad baja primero.
- Controles fuera de `data-live-zone`: mantienen los valores durante actualización Live.
- Ordenación estable: desempate por `updated_at` UTC y `id`. No se escribe en la BD.
- `Limpiar filtros` restaura la selección de prioridad vacía y el orden reciente.

## Archivos modificados
- `src/server.js`: atributos `data-priority`, `data-updated`, `data-ticket-id`, cuerpo ordenable y controles adicionales.
- `public/explorer.js`: filtro, orden y preservación durante actualizaciones.
- `public/styles.css`: rejilla adaptable a cinco campos.
- `tests/explorer.test.js`: cuatro casos nuevos.
- `README.md`: este cierre.

## Verificación ejecutada en el entorno de construcción
- `npm test`: **33/33**, 0 fallidas.
- `npm run check:agents`: válido (solo estructura).
- `npm run check:codex`: válido (solo estructura).

## Verificación pendiente en Windows
1. Detener el servidor de pruebas previo del puerto 3012, o usar 3013 para esta candidata.
2. Extraer ZIP completo en **otra** carpeta. Restaurar una **copia** SQLite aislada sin reemplazar bases existentes.
3. `npm.cmd test` y `npm.cmd start` con `DATA_DIR` aislado.
4. En Opera, comprobar filtros combinados y cuatro órdenes; confirmar resultados tras crear un ticket desde otra sesión sin F5.
5. Repetir como solicitante y confirmar restricción de datos.
6. Capturar nuevas pantallas para el manual de usuario definitivo.

**No se certifica un despliegue público ni se afirma que las nuevas funciones ya hayan sido comprobadas manualmente en Windows.**
