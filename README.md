# MesaHelp — Gestión y seguimiento de solicitudes

**Proyecto académico individual · Corporación Universitaria Autónoma del Cauca**  
**Autor:** Hector Alejandro Garcés  
**Asignatura:** Sistemas de Información Empresariales  
**Versión:** v0.3.1, candidata académica de cierre (11 de noviembre de 2026)

MesaHelp es una aplicación web que permite registrar, clasificar, gestionar y dar seguimiento a solicitudes mediante tickets. No corrige automáticamente las incidencias: organiza la atención y conserva la trazabilidad de cada actuación.

## Estado verificado

- **33/33 pruebas automatizadas** aprobadas por el estudiante en Windows; cero fallidas.
- `check:agents` y `check:codex` correctos **como validaciones estructurales**, no como evidencia de ejecución de todos los agentes.
- Pruebas manuales favorables de filtros, ordenamiento, Live, roles, invitados, reportes y CSV en Opera y Excel.
- Demostración local funcional. **No se declara despliegue público de la aplicación ni certificación de seguridad para producción.**

## Funcionalidades

- Acceso autenticado con roles **coordinador** y **solicitante**; registro y seguimiento de invitados con código privado.
- Tickets con número, asunto, descripción, categoría, prioridad, estado e historial de actuaciones.
- Coordinación: cambiar estados y añadir observaciones de seguimiento.
- **Explorador**: búsqueda por número y asunto; filtros por estado, categoría y prioridad; ordenamiento por actividad y prioridad.
- **Live**: actualizaciones de tickets sin F5 mediante avisos WebSocket y recuperación HTTP de datos autorizados.
- **Reportes operativos**: recuentos por estado, categoría y prioridad; CSV para Excel con límites por rol.
- Respaldo SQLite, pruebas automatizadas y configuración Docker local.

## Instalar y ejecutar localmente

**Requisito:** Node.js **22.13.0 o superior** (probado con Node 22; `node:sqlite` puede imprimir una advertencia experimental). **No se requieren dependencias npm externas.**

1. Descarga el repositorio o clónalo y abre una terminal dentro de la carpeta.
2. Ejecuta:

```powershell
node --version
npm.cmd test
npm.cmd run check:agents
npm.cmd run check:codex
npm.cmd start
```

3. Visita `http://localhost:3000/login`.
4. **Solo en una base nueva y vacía**, ejecuta `npm.cmd run seed` para crear cuentas de demostración. El script muestra contraseñas aleatorias una sola vez. **No ejecutes seed sobre una base con datos.**

Para usar una base y un puerto aislados en PowerShell:

```powershell
$env:DATA_DIR = 'D:\MesaHelp_Datos_Demo'
$env:PORT = '3013'
npm.cmd start
```

La ruta `DATA_DIR` no debe apuntar a tu base privada. Nunca compartas `data/`, archivos `.sqlite*`, credenciales o códigos de seguimiento.

### Pruebas

```powershell
npm.cmd test                    # 33 pruebas automatizadas
npm.cmd run check:agents        # estructura de definiciones Claude
npm.cmd run check:codex         # estructura de definiciones Codex
npm.cmd run backup              # genera respaldo en una ruta privada
```

Las pruebas también se ejecutan mediante **GitHub Actions** en cada `push` a `main` y en cada pull request. El resultado del workflow remoto solo se conocerá después de publicar este repositorio.

## Documentación académica

**[Abrir portal de documentación](docs/index.html)** · [Anexos PDF](docs/academicos/) · [Diagramas](docs/diagramas/) · [Manual de publicación](PUBLICACION_GITHUB.md)

| Anexo | Documento | Estado |
|---|---|---|
| A | [Manual de usuario](docs/academicos/SIE_Individual_Anexo-A_ManualUsuario.pdf) | Obligatorio · borrador personalizado |
| B | [Manual técnico](docs/academicos/SIE_Individual_Anexo-B_ManualTecnico.pdf) | Obligatorio · borrador personalizado |
| C | [Requisitos y alcance](docs/academicos/SIE_Individual_Anexo-C_RequisitosAlcance.pdf) | Sugerido |
| D | [Modelo y diccionario](docs/academicos/SIE_Individual_Anexo-D_ModeloDiccionario.pdf) | Sugerido |
| E | [Pruebas y evidencias](docs/academicos/SIE_Individual_Anexo-E_PruebasEvidencias.pdf) | Sugerido |
| F | [Roles y seguridad](docs/academicos/SIE_Individual_Anexo-F_RolesSeguridad.pdf) | Sugerido |
| G | [Impacto en el proceso](docs/academicos/SIE_Individual_Anexo-G_ImpactoNegocio.pdf) | Sugerido |
| H | [Implementación y soporte](docs/academicos/SIE_Individual_Anexo-H_ImplementacionSoporte.pdf) | Sugerido |
| I | [Gestión del proyecto](docs/academicos/SIE_Individual_Anexo-I_GestionProyecto.pdf) | Sugerido |

> **Antes de entregar:** completar URL del repositorio, contacto institucional de soporte, verificar nomenclatura individual y que una persona ajena al proyecto pueda seguir el manual. Algunos PDF señalan estos pendientes con transparencia.

## GitHub Pages no es el servidor de MesaHelp

El portal `docs/index.html` puede publicarse con **Settings → Pages → Deploy from a branch → `main` → `/docs`**. Solo publica el **sitio estático de documentación**, no la aplicación Node.js ni SQLite. Para que la aplicación funcione desde Internet haría falta un hosting que ejecute Node.js, almacenamiento persistente, HTTPS y revisión de seguridad.

## Arquitectura y limitaciones

- Backend: Node.js con HTTP nativo, roles y CSRF.
- Persistencia: SQLite (`node:sqlite`) con tablas `users`, `sessions`, `tickets`, `ticket_events` y `guest_ticket_access`.
- Frontend: HTML/CSS/JavaScript; filtrado sobre el conjunto autorizado en la vista.
- Live: WebSocket unidireccional sencillo y recuperación por HTTP con los mismos controles de acceso.
- Sin adjuntos, SLA, asignación de técnicos, recuperación autónoma de contraseñas ni despliegue público confirmado.

Más detalle en [arquitectura](docs/ARQUITECTURA_V03.md) y [estado de validación](docs/VALIDACION_WINDOWS_33_20261111.md). Algunos archivos históricos conservan su situación a la fecha original y no sustituyen este resumen de cierre.

## Créditos y licenciamiento

Proyecto académico desarrollado por Hector Alejandro Garcés, con asistencia de herramientas de IA durante auditoría, documentación y correcciones. La configuración de agentes no prueba que cada agente se haya ejecutado. **Antes de hacer público el repositorio, revisar el campo `license` del `package.json` (actualmente MIT) y decidir conscientemente si mantener esa licencia y añadir el texto correspondiente.**
