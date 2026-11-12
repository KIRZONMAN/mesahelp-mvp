# Estado de publicación — MesaHelp v0.3.1

**Autor:** Hector Alejandro Garcés · **Modalidad:** Trabajo individual · **Revisión:** 11 de noviembre de 2026.

## Enlaces comprobados

- Repositorio: https://github.com/KIRZONMAN/mesahelp-mvp (público, rama principal `main`).
- Portal de documentación: https://kirzonman.github.io/mesahelp-mvp/ (GitHub Pages, rama `main`, carpeta `/docs`).
- GitHub Actions: https://github.com/KIRZONMAN/mesahelp-mvp/actions — primera ejecución de pruebas y validadores aprobada.
- Seguimiento técnico sin datos privados: https://github.com/KIRZONMAN/mesahelp-mvp/issues.

## Qué está publicado y qué no

La publicación contiene **código y documentos**; el portal de Pages es **estático**. GitHub Pages no ejecuta el servidor Node.js/SQLite. No existe una URL pública de la aplicación; se demuestra localmente con Node.js 22.13+ y datos ficticios. La versión final actual no tiene comprobación independiente de Docker ni una auditoría de seguridad para producción.

## Actualizar la documentación ya publicada

Desde la carpeta local con el repositorio Git y `origin` configurado:

```powershell
git status -sb
# Copiar el parche documental sobre esta misma carpeta y verificar los archivos modificados.
git status --short
git add README.md PUBLICACION_GITHUB.md ENLACES.txt docs/
git commit -m "docs: actualizar manuales y enlaces publicados"
git push origin main
```

La publicación de Pages se actualizará desde `main` conforme al flujo configurado. Revisar la pestaña Actions y acceder al portal después de la actualización.

## Precauciones

No añadir a Git `data/`, `backups/`, `*.sqlite*`, `.env`, contraseñas, sesiones ni códigos de invitados. `package.json` declara MIT, pero no se ha confirmado el texto `LICENSE` ni derechos de recursos de terceros. Si el repositorio es público, sus versiones históricas también pueden ser consultables.

## Pendientes de entrega universitaria

- Confirmar con el docente que la nomenclatura `SIE_Individual` corresponde al trabajo asignado.
- Realizar al menos una prueba de instalación/uso del manual con otra persona y documentarla.
- Preparar servidor local en la demostración y comprobar acceso coordinador/solicitante/invitado con datos ficticios.
- Entregar el ZIP académico con `ENLACES.txt`, los nueve anexos y una copia instalable del código.
