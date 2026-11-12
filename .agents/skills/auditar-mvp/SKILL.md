---
name: auditar-mvp
description: Revisa seguridad, permisos, regresiones y evidencias del MVP MesaHelp tras modificaciones o antes de entregar.
---

# Auditoría del MVP

1. Consulta `docs/ALCANCE_Y_VALIDACION.md` y revisa cambios recientes.
2. Ejecuta `npm test`, `npm run check:agents` y `npm run check:codex` si el entorno y la tarea lo permiten.
3. Inspecciona permisos por rol, CSRF, autenticación, secreto de invitados, WebSockets, migraciones y posible exposición de datos.
4. Revisa si los avisos de sincronización llegan y si hay fallback. No confundas pruebas unitarias y navegador.
5. Anota cada criterio como: comprobado, pendiente o no aplicable. No atribuyas ejecuciones a agentes no usados.
6. Revisa diseño responsive sin prometer correcciones no probadas. No elimines ni alteres respaldos o SQLite.
