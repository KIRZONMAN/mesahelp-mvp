---
name: preparar-hetzner
description: Revisa Docker/Compose/Caddy y prepara plan de despliegue reversible de MesaHelp en Hetzner sin generar costos.
---

# Preparación Hetzner (sin despliegue)

1. Lee `Dockerfile`, `compose.local.yml`, `compose.yml`, `Caddyfile`, `.env.example` y README.
2. Inspecciona configuración de Docker local, volumen SQLite, puerto 3000 aislado, HTTPS y variables; no ejecutes contenedores si no se autorizó.
3. Diseña checklist para servidor, SSH, DNS, firewall, copias y restauración, registro de costos y procedimiento de baja.
4. Hetzner tiene presupuesto separado del de IA. No compres recursos, no configures billing ni despliegues sin permiso explícito.
5. Nunca afirmes «desplegado» si solo hay archivos preparados. Antes de exposición pública, exigir auditoría adicional de WebSockets e invitados.
