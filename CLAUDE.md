# MesaHelp — instrucciones del proyecto para Claude Code

## Contexto y alcance
Proyecto académico individual de Sistemas de Información Empresarial. Una mesa de ayuda registra tickets y permite consultar y cambiar sus estados. El sistema **no resuelve automáticamente** las incidencias; solo registra su seguimiento. El despliegue final previsto es un VPS de Hetzner con Docker y HTTPS; aún no está realizado.

## Tecnología existente
- Node.js con módulos nativos (sin dependencias npm), servidor HTTP en `src/server.js` y canal WebSocket unidireccional en `src/live.js`.
- Persistencia con `node:sqlite` en `src/db.js`; CSS en `public/styles.css`; actualización visual en `public/live.js`.
- Tests: `npm test`; servidor: `npm start`; cuentas demo: `npm run seed`.
- Docker: `compose.local.yml` (local) y `compose.yml` (producción con Caddy).

## Funcionalidades implementadas v0.3
- Solicitante crea tickets y consulta sus propios tickets e historial.
- Coordinador consulta todos, cambia `abierto` → `en_proceso` → `resuelto` → `cerrado` (sin transición forzada) y deja notas sin necesariamente cambiar estado.
- Invitado registra y consulta ticket con un código secreto; no dispone de sesión registrada ni WebSocket.
- WebSocket autenticado avisa cambios del ticket sin exponer su contenido; el navegador vuelve a pedir la vista autorizada.
- Mantener compatibilidad con bases SQLite v0.2; migraciones aditivas y backup previo.
- Proteger sesiones, permisos, datos y formularios. No implementar un motor de resolución real.

## Forma de trabajo con agentes
- `analista-mvp`: verifica que cada cambio responda al requisito académico y no amplíe alcance.
- `desarrollador-node`: implementa cambios pequeños y comprobables.
- `auditor-calidad`: revisa pruebas, permisos y seguridad, preferentemente sin modificar archivos.
- `devops-hetzner`: prepara despliegue sin crear servidores pagados por su cuenta.
- Skills reutilizables en `.claude/skills/` para ciclo de ticket, revisión de calidad y despliegue.

## Reglas obligatorias para cualquier agente
1. Leer README y archivos necesarios antes de editar. Proponer plan breve antes de cambios amplios.
2. Mantener código comprensible; explicar cambios y cómo verificarlos. Cambios incrementales; preservar la base y los tickets previos.
3. Ejecutar `npm test` tras cambiar el código; guardar evidencia real en `docs/evidencia-agentes/` cuando se haya trabajado efectivamente con Claude.
4. Nunca afirmar que Claude, los agentes, los tests o Hetzner se ejecutaron si no hay prueba de ello.
5. No copiar secretos, contraseñas, tokens ni datos reales de estudiantes al repositorio, capturas ni prompts.
6. No desplegar a Hetzner, crear recursos facturables ni destruir recursos sin aprobación expresa del propietario.
7. No añadir chatbot, LLM, agentes en tiempo de ejecución, pagos, correo, integraciones o funciones extras salvo requisito confirmado.

## Advertencia v0.3 sobre despliegue
La implementación WebSocket nativa es una demostración académica de una sola instancia; revisar/endurecer con biblioteca mantenida y limitar abuso público antes de producción. No afirmar que está auditada o desplegada.
