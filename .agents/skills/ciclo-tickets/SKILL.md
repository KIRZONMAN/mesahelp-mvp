---
name: ciclo-tickets
description: Verifica el ciclo de tickets MesaHelp (roles, invitado, historial, estados y WebSockets); úsala en pruebas funcionales o preparación de demostración.
---

# Ciclo de tickets de MesaHelp

1. Revisa `README.md`, `docs/PRUEBAS_MANUALES_V03.md` y las rutas involucradas.
2. Prueba solicitante → ticket nuevo → historial → cambio de estado por coordinador → seguimiento del solicitante. El solicitante no debe ver tickets ajenos.
3. Comprueba notas sin cambiar el estado; categoría Aseo y mantenimiento; ticket invitado y consulta con código (no lo copies en capturas).
4. En dos sesiones diferentes, verifica actualización en vivo sin F5, reconexión y recuperación por sondeo. Diferencia la prueba manual de tests con mocks.
5. Ejecuta `npm test` cuando sea posible y reporta verificaciones exactas, hallazgos y evidencias. No ejecutes `npm run seed` con la base existente.
6. No afirmes que el sistema resuelve realmente una incidencia.
