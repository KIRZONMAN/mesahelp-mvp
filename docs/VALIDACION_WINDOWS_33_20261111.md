# Cierre de validación en Windows — 11 de noviembre de 2026

Versión: **MesaHelp v0.3.1** (filtro prioridad + ordenamiento + Reportes + Live).  
Modalidad: **trabajo individual**, Corporación Universitaria Autónoma del Cauca.

## Evidencia aportada por el desarrollador

- `npm.cmd test`: **33 pruebas**, **33 aprobadas**, **0 fallidas**, 0 omitidas.
- `npm.cmd run check:agents`: validaciones de estructura de cuatro agentes y tres skills correctas; no certifica ejecución de agentes.
- `npm.cmd run check:codex`: definiciones y skills presentes; no certifica ejecución de subagentes.
- Capturas manuales en Opera: filtros por prioridad alta/baja; combinación de criterios; orden de prioridad; reset; actualización de tickets mediante Live; prueba de roles e invitado.
- Excel: exportación CSV con **9 registros para coordinador** y **7 para solicitante** en el momento capturado; el total es variable, pues siguieron creándose tickets de prueba. No es una cifra fija del producto.
- Se observaron **10 tickets** en una captura posterior de la instancia de prueba. Los tickets son ejemplos y no datos de producción.

## Alcance real del cierre

Evidencia **favorable para demostración académica local**. No acredita auditoría de penetración, alta disponibilidad, despliegue de producción o ejecución de Docker sobre esta última variante. El respaldo y Docker local se validaron anteriormente en variantes de desarrollo, con sus límites descritos en documentos históricos.

## Nota sobre documentación histórica

Los documentos de octubre y primeros días de noviembre contienen cifras de 16, 22 o 28 pruebas y algunas tareas pendientes que describen cortes anteriores. Para el estado de la última versión consultar este archivo y el README raíz.
