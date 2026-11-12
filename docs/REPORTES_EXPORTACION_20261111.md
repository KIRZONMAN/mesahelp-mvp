# Ampliación de reportes y exportación CSV — 11/11/2026

## Alcance

- Una vista autenticada `/reportes` con total de solicitudes autorizadas y agrupaciones por **estado**, **categoría** y **prioridad**.
- Descarga autenticada `/reportes.csv` en formato UTF-8 (BOM) y delimitador coma.
- El coordinador incluye tickets propios, de otros solicitantes y de invitados; el solicitante solo los propios.
- Invitados sin sesión no pueden abrir los reportes, aunque sí seguir consultando su ticket individual por código.
- No se cambia el modelo SQLite, no se introducen dependencias externas ni se crean métricas ficticias de productividad.

## Protección de información

- Ambas rutas pasan por la autenticación normal del servidor y obtienen sus datos únicamente desde `DB.listTickets(user)`.
- El CSV exporta número, asunto, solicitante, categoría, prioridad, estado, fecha de creación y última actividad (UTC).
- Se omiten **descripciones**, **notas**, claves, tokens y códigos privados. No publicar el CSV de datos reales.
- Todos los campos CSV van entre comillas, duplicando las comillas internas; se coloca un apóstrofo si comienzan (tras blancos/caracteres de control) por `=`, `+`, `-` o `@` para neutralizar fórmulas en aplicaciones de hojas de cálculo. Pese a esta defensa, los archivos de datos no confiables requieren revisión antes de exportarse a terceros.
- El cliente recibe la vista ya limitada por permisos; no se basa en ocultar registros mediante JavaScript.

## Uso

1. Iniciar sesión como coordinador o solicitante.
2. En el menú lateral abrir `Reportes`.
3. Consultar los tres grupos de indicadores.
4. Pulsar `Exportar CSV`; abrir en Excel importando como UTF-8, separado por comas si fuera necesario.
5. Volver a cargar la página para observar cifras actualizadas: el reporte no incorpora sincronización Live continua.

## Criterios de aceptación

- [ ] Un coordinador ve todas las solicitudes autorizadas incluidas las de invitados.
- [ ] Cada solicitante solo ve las suyas.
- [ ] Sin inicio de sesión, las rutas redirigen al login.
- [ ] Las sumas por estado, categoría y prioridad concuerdan con el total.
- [ ] La descarga incluye BOM, cabecera, UTF-8, comillas escapadas y protección contra fórmulas.
- [ ] El CSV no expone descripción ni código privado.
- [ ] La suite preexistente, pruebas de autorización y el modo Live siguen pasando.
- [ ] Validación visual manual en Opera, desktop y ancho estrecho.

## Límites

Los reportes son operativos y descriptivos. No contienen SLA, gráficas históricas,
asignación de responsables, tiempo medio de atención, PDF de reportes, métricas de
impacto real ni exportación de invitado sin sesión. Se requiere evaluación de
seguridad adicional antes de un despliegue público.
