---
name: ciclo-tickets
description: Guía la demostración y verificación funcional de MesaHelp: creación, seguimiento y cierre de tickets con los dos roles.
---
# Skill: ciclo de tickets

Usar con `/ciclo-tickets` cuando se necesite probar o preparar una demostración del MVP.

1. Revisar README, `docs/GUION_DEMOSTRACION.md` y tests.
2. Verificar que el solicitante pueda iniciar sesión, crear ticket y consultar solo sus propios datos.
3. Verificar que el coordinador pueda verlo y cambiar estado a `en_proceso`, `resuelto`, `cerrado` con historial.
4. Confirmar que el sistema solamente guarda información de seguimiento y no ejecuta la solución del problema.
5. Ejecutar `npm test` cuando el entorno permita y producir checklist con evidencia comprobada y pendiente.
6. Nunca usar datos personales reales ni inventar ejecuciones de navegador.
