# Guía de aceptación manual MesaHelp v0.3

## A. Funcionalidad existente y persistencia

- [ ] Inicio de sesión como solicitante y coordinador.
- [ ] Solicitante crea un ticket y observa el estado **Abierto**.
- [ ] Coordinador actualiza **En proceso → Resuelto → Cerrado**.
- [ ] Solicitante ve el historial, pero no puede modificar el ticket.
- [ ] Otra cuenta de solicitante no puede acceder al ticket por URL.
- [ ] Reiniciar `npm start`: los tickets y eventos siguen allí.

## B. Nueva categoría y observaciones

- [ ] En «Nueva solicitud», escoger **Aseo y mantenimiento**.
- [ ] Confirmar la categoría en el detalle y el panel.
- [ ] Como coordinador, seleccionar **Agregar observación** sin cambiar el estado.
- [ ] Confirmar en el historial «Observación de seguimiento» y que el estado no cambió.
- [ ] Verificar que solo el coordinador dispone del formulario de observaciones.

## C. Invitados

- [ ] En `/login`, pulsar «Registrar solicitud como invitado».
- [ ] Crear ticket de aseo. Guardar el código **MH-...** en un lugar privado, no en una captura compartida.
- [ ] Abrir «Consultar ticket de invitado» e introducir el código.
- [ ] Comprobar que se muestra estado e historial.
- [ ] Comprobar que un código incorrecto no devuelve datos.
- [ ] Como coordinador, comprobar que aparece el ticket con solicitante **Invitado** y cambiar su estado.
- [ ] Volver a la consulta de invitado e introducir el código para observar el nuevo estado.

## D. WebSockets en dos ventanas independientes

**Requisito:** dos sesiones de navegador separadas; por ejemplo, perfil normal de Opera como solicitante y ventana privada como coordinador.

1. En la primera sesión entra como solicitante y abre el detalle de un ticket creado por ese usuario. **No cierres la ventana.**
2. En la segunda sesión entra como coordinador y abre el mismo ticket.
3. Verifica que aparezca «Actualización en vivo activa» en la barra superior de la primera sesión.
4. Desde el coordinador cambia a «En proceso» y guarda.
5. Observa que en el solicitante el estado y el historial cambian **sin pulsar F5**. La página sustituye automáticamente el contenido relevante mediante HTTP al recibir el evento WebSocket.
6. Repite con «Agregar observación». El estado permanece y aparece un nuevo evento.
7. Desconecta temporalmente la red local o cierra el servidor y vuelve a abrirlo. La vista debe intentar reconectarse. Si falla, el usuario siempre puede recargar.

Nota: los invitados **no** tienen canal WebSocket. Su seguimiento se consulta mediante el código secreto.

## E. Seguridad, respaldo y herramientas

- [ ] `npm run check:agents` — estructura válida, **no** uso efectivo de Claude.
- [ ] `npm test` — debe pasar el conjunto de pruebas.
- [ ] `npm run backup` — crea un SQLite en `backups/` y no altera tickets.
- [ ] Si Docker está instalado: `docker compose -f compose.local.yml up -d --build` y comprobar `/healthz`.
- [ ] Guardar capturas SIN contraseñas, tokens de sesión o códigos invitados.

## Criterio de entrega académica

Solo afirmar «probado en el navegador» tras completar la demostración D. No afirmar «agentes ejecutados» sin registros en Claude Code. No afirmar «desplegado en Hetzner» hasta tener una URL funcional y evidencia verificable.
