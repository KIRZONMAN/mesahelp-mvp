'use strict';
// Reportes de solo lectura. El servidor entrega únicamente la lista autorizada.
const STATES = {abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado'};
const PRIORITIES = {baja: 'Baja', media: 'Media', alta: 'Alta'};
const CATEGORIES = ['Soporte técnico', 'Académico', 'Administrativo', 'Aseo y mantenimiento', 'Otro'];

function summarize(tickets) {
  const byStatus = Object.entries(STATES).map(([key,label]) => ({key,label,count:tickets.filter(t=>t.status===key).length}));
  const byPriority = Object.entries(PRIORITIES).map(([key,label]) => ({key,label,count:tickets.filter(t=>t.priority===key).length}));
  const byCategory = CATEGORIES.map(key => ({key,label:key,count:tickets.filter(t=>t.category===key).length}));
  return {total:tickets.length, byStatus, byPriority, byCategory};
}
// Las celdas se rodean siempre con comillas y se neutralizan fórmulas de Excel.
function csvCell(value) {
  let text=String(value ?? '');
  if (/^[\u0000-\u0020]*[=+\-@]/u.test(text)) text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
function exportCsv(tickets) {
  const heading=['Numero','Asunto','Solicitante','Categoria','Prioridad','Estado','Creado UTC','Actualizado UTC'];
  const lines=[heading, ...tickets.map(t=>[
    String(t.id).padStart(4,'0'),t.subject,t.requester,t.category,
    PRIORITIES[t.priority]||t.priority,STATES[t.status]||t.status,t.created_at,t.updated_at
  ])];
  return '\ufeff'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
module.exports={summarize,csvCell,exportCsv};
