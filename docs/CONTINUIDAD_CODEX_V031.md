# Continuidad MesaHelp v0.3.1 — ChatGPT Plus + Codex

**Fecha de consolidación:** 5 de noviembre de 2026. **Entrega prevista:** 13 de noviembre de 2026.
Este documento no certifica ejecución real de Codex ni modifica los requisitos del profesor.

## Qué se integró

- El archivo `public/live.js` corresponde al parche de recuperación v0.3.1.
- Se preservó **sin tocar** `src/`, `public/styles.css`, tests originales, base de datos y backups.
- `package.json` pasa a `0.3.1` y añade exclusivamente `npm run check:codex`.
- Se añade `AGENTS.md`, configuración `.codex/config.toml`, cuatro subagentes `.codex/agents/*.toml`, tres skills `.agents/skills/*/SKILL.md` y guía/evidencia de Codex.
- Se conservan intactos `CLAUDE.md`, `.claude/` y `docs/evidencia-agentes/REGISTRO_SESIONES.md`.

## Frontera económica

- IA adicional autorizada: **US$0**. Usar ChatGPT Plus para Codex; no usar API key, Claude Pro, créditos extra ni MCP pagos.
- Hetzner es separado y **no autorizado todavía** para contratar o desplegar.
- El paquete **no contiene** autenticación configurada, tokens de Codex, claves API ni facturación.

## Instalar como carpeta NUEVA en Windows

1. Detén el servidor anterior (`Ctrl+C`); conserva la carpeta v0.3 anterior intacta.
2. Extrae el ZIP en `D:\Proyectos\MesaHelp\MesaHelp_v031_Codex`.
3. Entra en `D:\Proyectos\MesaHelp\MesaHelp_v031_Codex\MesaHelp_MVP`.
4. Si usas ZIP **privado**, la base existente y respaldos ya estarán dentro. **No la compartas**.
5. Si usas ZIP **limpio**, copia la carpeta `data` desde la instalación anterior con el servidor detenido, sin ejecutar `npm run seed`. Conserva tus propios backups fuera del proyecto.

```powershell
cd D:\Proyectos\MesaHelp\MesaHelp_v031_Codex\MesaHelp_MVP
node --version
npm run check:agents
npm run check:codex
npm test
```

Estas verificaciones deben reproducirse **en tu equipo**; las ejecutadas al empaquetar no sustituyen tu comprobación.

## Acceso inicial a Codex SIN modificar proyecto

```powershell
Get-Command codex -ErrorAction SilentlyContinue
# Si aún NO está instalado: npm install -g @openai/codex
codex --version
cd D:\Proyectos\MesaHelp\MesaHelp_v031_Codex\MesaHelp_MVP
codex --sandbox read-only
```

Selecciona **Sign in with ChatGPT** con tu cuenta Plus (no API key); comprueba `/status` y permisos de solo lectura.
No se requiere ninguna conexión MCP. Los agentes personalizados están definidos en el proyecto; su disponibilidad real depende de la versión de Codex y su configuración activa.

### Primer mensaje sugerido

> Inspecciona MesaHelp v0.3.1 en SOLO LECTURA. Verifica versión, árbol, rutas y código, presencia del parche Live, datos y respaldos sin revelar su contenido privado. Compara AGENTS.md y configuraciones de Claude/Codex. Investiga la superposición responsive de tarjetas a media pantalla y entrega diagnóstico y plan mínimo con criterios de aceptación. No edites archivos, no ejecutes seed, no instales dependencias, no despliegues ni contrates servicios y no afirmes que has corrido pruebas que no ejecutaste.

## Equivalencia de agentes

| Claude (preservado) | Codex (nuevo) | Propósito |
|---|---|---|
| `analista-mvp` | `analista_mvp` | Alcance y aceptación; inspección |
| `desarrollador-node` | `desarrollador_node` | Correcciones pequeñas autorizadas |
| `auditor-calidad` | `auditor_calidad` | Verificación independiente |
| `devops-hetzner` | `devops_hetzner` | Revisión infraestructura sin costos |

Los subagentes de Codex **heredan los permisos del agente principal**. El texto «no editar» en una definición no equivale a sandbox de solo lectura: aplica `--sandbox read-only` para la auditoría inicial. No fijamos un modelo, ni proveedor API, ni servidores MCP en la configuración.

## Próximas acciones verificables

1. Auditoría Codex solo lectura y registro real en `docs/evidencia-codex/REGISTRO_SESIONES.md`.
2. Autorizar después, por separado, la corrección responsive de las tarjetas.
3. Ejecutar pruebas de regresión y repetir validación manual en Opera (dos sesiones).
4. Validar restauración de SQLite en copia aislada y Docker local.
5. Revisar seguridad de invitados y WebSocket antes de exponer público.
6. Preparar evidencias y entrega, sin asegurar ejecución de Claude/Codex que no sucedió.

## Inventario de paquetes

- **ZIP PRIVADO:** contiene el proyecto, base `data/`, backups y `.bak` que ya venían en el archivo facilitado por el estudiante. Solo uso personal.
- **ZIP FUENTE LIMPIA:** código completo, configuraciones, pruebas y documentación, excluyendo SQLite, backups y `.bak`. Es el adecuado para compartir el código, no la base personal.
