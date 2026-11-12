# Guía de publicación — GitHub + entrega académica

**Repositorio sugerido:** `mesahelp-mvp` · **Cuenta GitHub conectada durante la preparación:** `KIRZONMAN`.
**IMPORTANTE:** la URL no existía cuando se generó este paquete. Debes crear el repositorio antes de intentar `push`.

## 1. Revisión de seguridad (antes de publicar)

1. **No copies** dentro de esta carpeta tus datos `data/`, `backups/`, contraseñas, cookies o bases `.sqlite`.
2. Verifica que los nueve PDF no contienen datos institucionales o personales que no quieras publicar.
3. Los manuales contienen marcadores pendientes: completar repositorio, soporte y nomenclatura individual cuando corresponda.
4. `package.json` declara licencia **MIT**. Confirmar si quieres conservarla y, de ser así, incorporar el fichero `LICENSE`. No supongas que GitHub privado equivale a autorización pública.
5. Si usarás credenciales de demostración, que sean **nuevas y exclusivas de un ambiente de pruebas**; jamás subirlas al repositorio.

## 2. Crear el repositorio

1. Entra a `https://github.com/new` con tu propia sesión.
2. Nombre sugerido: **`mesahelp-mvp`**.
3. Descripción sugerida: `MVP académico de mesa de ayuda con Node.js, SQLite, Live y reportes`.
4. **Recomendado: privado inicialmente** para revisión; luego lo podrás hacer público si lo decides.
5. Si vas a publicar desde esta carpeta existente, **no inicialices el repositorio remoto con README, .gitignore ni licencia**, porque ya vienen incluidos en el paquete.
6. Crea el repositorio.

## 3. Subir los archivos desde Windows

Extrae el ZIP de **Repositorio para GitHub** en una carpeta nueva y abre PowerShell **dentro de ella**. La terminal debe mostrar `README.md`, `src/` y `package.json` con `Get-ChildItem`.

```powershell
git --version
npm.cmd test
npm.cmd run check:agents
npm.cmd run check:codex

git init -b main
git add .
git status --short
# Revisa que NO aparezcan data/, backups/, .env ni archivos *.sqlite.
git commit -m "MesaHelp v0.3.1 - entrega academica"
git remote add origin https://github.com/KIRZONMAN/mesahelp-mvp.git
git push -u origin main
```

Si Git solicita autenticación, usa el flujo de navegador de Git Credential Manager o GitHub Desktop; **no escribas contraseñas ni tokens en el chat o el repositorio**.

## 4. Comprobar publicación

- Abre el repositorio nuevo en GitHub y verifica README, `src/`, `tests/`, `docs/academicos/` con los nueve PDF, `docs/diagramas/` y `.github/workflows/pruebas.yml`.
- En la pestaña **Actions**, revisa `MesaHelp - Pruebas y validadores`: debe aprobarse tras el primer push. Una ejecución local aprobada **no garantiza** un resultado remoto hasta que el workflow termine.
- Para documentación web estática: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main /docs → Save**.
- Después de publicar Pages, la URL esperada si mantienes nombre y usuario propuestos será `https://kirzonman.github.io/mesahelp-mvp/`. **No se garantiza que exista hasta habilitar Pages**.
- El sitio Pages aloja exclusivamente la documentación estática; **no ejecuta MesaHelp ni SQLite**.

## 5. Entrega para Jefferson

- Coloca la URL **real y verificada** del repositorio en `ENLACES.txt` del ZIP académico.
- Confirma si el docente acepta `SIE_Individual` en los PDF, porque la plantilla general dice `SIE_Grupo##`.
- Completa el contacto de soporte que aparece pendiente en el Anexo A.
- Asegúrate de que los dos manuales obligatorios A y B estén en PDF, y los anexos C-I solo con afirmaciones respaldadas.
- Mantén una copia privada local con datos ficticios para demostración. `http://127.0.0.1:3013` **no es una URL pública**.
- Comprueba enlaces, PDFs, integridad del ZIP y un ensayo antes de cargar.

## 6. Despliegue real del servidor (posterior)

GitHub no ejecuta permanentemente nuestro proceso HTTP. Un despliegue real requiere un proveedor con ejecución Node.js 22+, almacenamiento persistente para SQLite, dominio/HTTPS y una auditoría adicional de seguridad, especialmente del WebSocket mínimo y los límites de abuso. **No declarar despliegue en la nube hasta que funcione y sea verificado.**
