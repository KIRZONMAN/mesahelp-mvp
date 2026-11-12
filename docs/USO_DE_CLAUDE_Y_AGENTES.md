# Actualización 04-11-2026 — MesaHelp v0.3

La v0.3 incluye modo invitado, notas independientes y WebSockets, **desarrollados en esta iteración de ChatGPT**. Esto NO prueba que los subagentes de Claude Code hayan participado. Para cumplir el requisito de proceso, usarlos efectivamente, revisar su resultado y registrar evidencias reales sin fabricar sesiones.

# Guía para trabajar con Claude Code y demostrar los agentes

## 1. ¿Qué se ha preparado?

Este proyecto contiene definiciones **válidas como archivos de proyecto de Claude Code**:

- `CLAUDE.md`: instrucciones generales.
- `.claude/agents/analista-mvp.md`: delimita requisitos.
- `.claude/agents/desarrollador-node.md`: programa.
- `.claude/agents/auditor-calidad.md`: audita.
- `.claude/agents/devops-hetzner.md`: prepara despliegue.
- `.claude/skills/ciclo-tickets/SKILL.md`: prueba funcional.
- `.claude/skills/auditar-mvp/SKILL.md`: auditoría guiada.
- `.claude/skills/preparar-hetzner/SKILL.md`: preparación de VPS.
- `.claude/rules/seguridad.md`: pautas permanentes.

**IMPORTANTE:** estos archivos son definiciones. No demuestran por sí solos que Claude haya ejecutado agentes, generado código, corrido pruebas o desplegado en Hetzner.

## 2. Activación en tu equipo (Windows)

1. Extrae el ZIP respetando la carpeta oculta `.claude` (activa «Elementos ocultos» en Explorador si no la ves).
2. Abre la raíz del proyecto en VS Code o una terminal PowerShell.
3. Instala/abre una versión compatible de Claude Code (CLI o interfaz Code de Claude Desktop) y autentícate con tu cuenta o credenciales propias; esto puede tener costo.
4. Inicia la sesión desde la raíz del proyecto; comprueba que lea `CLAUDE.md` mediante `/context` si tu versión lo permite.
5. Ejecuta `/agents` o abre el selector `@` para verificar los cuatro agentes. Si creaste por primera vez `.claude/agents` mientras una sesión ya estaba abierta, reinicia esa sesión.
6. Prueba skills `/ciclo-tickets`, `/auditar-mvp` y `/preparar-hetzner`. Las habilidades pueden invocarse por nombre en sesiones compatibles.

## 3. Primer ejercicio real: flujo de agentes

Pega este prompt en la sesión principal:

> Lee CLAUDE.md y docs/ALCANCE_Y_VALIDACION.md. Invoca al agente analista-mvp para comparar el sistema actual con los requisitos académicos de seguimiento de tickets. Después solicita a auditor-calidad que revise de forma independiente la autenticación, el historial y los permisos de roles, y que ejecute npm test. No cambies código todavía. Entrega un resumen de hallazgos con evidencias verificables y separa lo realizado de lo pendiente.

Segundo ejercicio, **solo si aparece un defecto real**:

> Invoca a desarrollador-node para corregir únicamente el defecto [describir], sin añadir funciones. A continuación invoca a auditor-calidad para revisar la corrección y ejecuta npm test. Resume qué archivos cambiaron, qué pruebas se realizaron y qué sigue pendiente.

Tercer ejercicio, antes de pagar Hetzner:

> Invoca a devops-hetzner para revisar Docker, Compose y Caddy. No crees ni pagues recursos. Entrega checklist de DNS, SSH, HTTPS, backup y costos. Distingue preparación de despliegue realizado.

## 4. Evidencias para la exposición

- Captura del explorador de VS Code con `.claude/agents`, `.claude/skills` y `CLAUDE.md`.
- Captura de Claude Code mostrando la lista de agentes y una delegación realizada.
- Registro `docs/evidencia-agentes/REGISTRO_SESIONES.md` con fecha, objetivo, agente, prompt, acciones observadas, resultado y evidencia.
- Salida real de `npm test` y, si procede, capturas del flujo completo en el navegador.
- Si Hetzner se despliega finalmente: prueba HTTPS, URL, y evidencia del servidor sin secretos.

No inventes ni fabriques capturas, ejecuciones, logs o intervención de agentes. **El propietario debe ejecutar realmente los flujos con Claude Code** para demostrar que trabajó con agentes.

## 5. ¿Agentes en desarrollo o dentro de la aplicación?

Estas carpetas instrumentan **agentes del desarrollo**. No convierten el backend ni la interfaz en una plataforma de agentes de IA. Si el profesor exige agentes ejecutándose en la app para usuarios finales, será otro requisito funcional y habrá que acordar su utilidad, costo, privacidad y alcance.

Fuentes técnicas oficiales:
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/memory
