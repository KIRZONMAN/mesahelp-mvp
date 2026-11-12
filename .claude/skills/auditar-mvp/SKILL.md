---
name: auditar-mvp
description: Ejecuta una revisión disciplinada de seguridad, pruebas y alcance antes de entregar o desplegar MesaHelp.
---
# Skill: auditoría del MVP

Usar con `/auditar-mvp` después de cambios o antes de entrega.

1. Leer criterios de aceptación en `docs/ALCANCE_Y_VALIDACION.md`.
2. Ejecutar `npm test` y `npm run check:agents` si es posible; reportar resultados exactos.
3. Comprobar roles, sesiones, validaciones, historial y exposición de secretos.
4. Inspeccionar diferencias de código; señalar errores con pasos de reproducción.
5. Registrar estado de cada criterio: comprobado, pendiente, no aplicable.
6. No afirmar validación del despliegue real, UI o agentes si no se ejecutaron.
