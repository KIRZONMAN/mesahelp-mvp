# Prueba manual — MesaHelp v0.3.1 con Reportes (11 de noviembre de 2026)

> **Versión candidata, no definitiva.** No sustituir la versión estable ni modificar su base de datos. Usar una copia de SQLite restaurada mediante respaldo consistente.

## Preparación

1. Mantener el servidor estable del puerto 3011 sin cambios.
2. Crear una carpeta nueva para el código (`MesaHelp_v031_Reportes_Prueba`) y otra carpeta distinta para la base (`Reportes_Datos_Prueba_20261111`).
3. Copiar a esa carpeta **solo** el archivo `.sqlite` del respaldo consistente generado con `npm.cmd run backup`; renombrarlo `mesahelp.sqlite`.
4. Configurar `DATA_DIR` hacia esa carpeta nueva y `PORT=3012` antes de iniciar `npm.cmd start`.
5. Acceder por `http://localhost:3012` y utilizar las credenciales de prueba sin enviarlas ni guardarlas en el repositorio.

## Escenarios

- **S1 — Coordinador:** entrar a `Reportes` desde el menú lateral; comprobar total, estados, categorías y prioridades, y que las sumas coinciden con los tickets disponibles.
- **S2 — Solicitante:** iniciar sesión en una ventana independiente; comprobar que el total corresponde solo a sus tickets.
- **S3 — Descarga CSV:** pulsar `Exportar CSV`; abrir el archivo en Excel, importar como UTF-8 con delimitador coma si hiciera falta; comprobar cabeceras y registros.
- **S4 — Privacidad:** revisar que el CSV no contiene descripciones, observaciones, credenciales ni códigos de seguimiento de invitados.
- **S5 — Sesión anónima:** abrir `/reportes` y `/reportes.csv` en ventana privada sin autenticar; ambos deben redirigir al inicio de sesión.
- **S6 — Regresión:** probar Explorador, creación de ticket, estado, historial y Live; ejecutar `npm.cmd test`, `npm.cmd run check:agents` y `npm.cmd run check:codex`.
- **S7 — Pantalla estrecha:** reducir ancho de Opera y verificar que las tarjetas y el menú no se superponen.

## Evidencias a conservar

- Captura del reporte del coordinador y del solicitante.
- Captura del CSV importado con datos ficticios.
- Resultado de PowerShell de las 28 pruebas automatizadas y validadores estructurales.
- Resultado manual de los siete escenarios anteriores.

**Límites:** CSV de consulta, sin gráficos históricos ni PDF; el reporte no se actualiza continuamente con Live, se actualiza al recargar. Este módulo no demuestra por sí mismo mejoras reales de tiempo o costo para una organización.
