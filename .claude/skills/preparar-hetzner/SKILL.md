---
name: preparar-hetzner
description: Preparación segura y verificación de un despliegue de MesaHelp en Hetzner con Docker, Caddy y HTTPS.
---
# Skill: preparar despliegue Hetzner

Usar con `/preparar-hetzner` cuando el código local esté probado.

1. Leer `compose.yml`, `Dockerfile`, `Caddyfile`, README y `docs/ALCANCE_Y_VALIDACION.md`.
2. Comprobar configuración Compose, variables de entorno, persistencia SQLite y no exposición pública del puerto interno.
3. Listar prerrequisitos: aprobación de costos, VPS, clave SSH, DNS, firewall puertos 80/443 y 22 limitado, backups.
4. Nunca aprovisionar ni modificar recursos pagados sin confirmación explícita.
5. Proponer comandos y plan reversible para despliegue y eliminación de recursos.
6. Si hubo ejecución real, consignar URL y pruebas (sin credenciales); en otro caso escribir «Preparado, no desplegado».
