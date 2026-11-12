# Actualizar tu MesaHelp v0.2 (con parche CSRF) a v0.3 SIN perder datos

**No ejecutes `npm run seed` sobre una base existente para obtener nuevas claves.** En v0.3 `seed` respeta las cuentas ya creadas.

## Opción recomendada: instalación paralela, con copia de datos

1. En la terminal de v0.2, detén `npm start` mediante `Ctrl+C` y cierra otras instancias.
2. **Respaldar la carpeta anterior completa** (incluye `data`):

```powershell
$old = 'D:\Proyectos\MesaHelp\MesaHelp_MVP'
Copy-Item $old 'D:\Proyectos\MesaHelp\MesaHelp_MVP_RESPALDO_v02' -Recurse
```

3. Extrae el ZIP de v0.3 en una carpeta **nueva**, por ejemplo: `D:\Proyectos\MesaHelp\MesaHelp_v03\MesaHelp_MVP`. No descomprimas encima del original todavía.
4. Copia únicamente la carpeta `data` de tu proyecto original a la nueva ubicación (la v0.3 no incluye ninguna base de datos):

```powershell
$new = 'D:\Proyectos\MesaHelp\MesaHelp_v03\MesaHelp_MVP'
if (Test-Path "$old\data") { Copy-Item "$old\data" "$new\data" -Recurse -Force }
cd $new
```

5. Ejecuta las comprobaciones y arranca:

```powershell
node --version
npm run check:agents
npm test
npm start
```

6. Abre `http://localhost:3000`. **Tus usuarios y contraseñas v0.2 se conservan** al haber copiado `data`.
7. Verifica los tickets históricos, sus estados y su historial. Luego sigue `docs/PRUEBAS_MANUALES_V03.md`.

## ¿Qué cambia en la base de datos?

`src/db.js` ejecuta `CREATE TABLE IF NOT EXISTS guest_ticket_access` e índices nuevos al arrancar. No borra ni reemplaza las tablas existentes. El usuario técnico `__invitado__` solo aparece la primera vez que creas un ticket anónimo.

## Si algo falla

1. Detén v0.3 con `Ctrl+C`.
2. No intentes borrar o editar a mano las tablas SQLite.
3. Regresa a la carpeta **original** v0.2 (o su copia) y ejecuta `npm start` con tus datos intactos.
4. Guarda la salida de la terminal y compártela sin contraseñas, tokens ni códigos de seguimiento.

**Importante:** abrir una BD ya modificada por v0.3 con el código de v0.2 no está garantizado como operación de reversión. Para volver a la base estrictamente anterior utiliza la copia de la carpeta `data/` realizada **antes** de abrir v0.3.
