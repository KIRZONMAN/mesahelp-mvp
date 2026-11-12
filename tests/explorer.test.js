'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/explorer.js'), 'utf8');

function harness(list = [
  {search: '#0001 1 Error técnico', state: 'abierto', category: 'Soporte técnico', priority: 'alta', updated: '2026-11-03 14:00:00', ticketId: '1'},
  {search: '#0002 2 Mantenimiento del salón', state: 'cerrado', category: 'Aseo y mantenimiento', priority: 'baja', updated: '2026-11-04 15:00:00', ticketId: '2'},
  {search: '#0005 5 Revisión de notas', state: 'resuelto', category: 'Académico', priority: 'media', updated: '2026-11-05 16:00:00', ticketId: '5'}
]) {
  const handlers = {};
  function control() {
    return {value: '', events: {}, addEventListener(event, callback) { this.events[event] = callback; }, focus() { this.focused = true; }};
  }
  const search=control(), status=control(), category=control(), priority=control(), sort=control(), clear=control();
  sort.value = 'recent';
  const count={textContent:''};
  const panel={hidden:true, querySelector(selector) {
    return ({'[data-explorer-search]':search,'[data-explorer-status]':status,
      '[data-explorer-category]':category,'[data-explorer-priority]':priority,
      '[data-explorer-sort]':sort,'[data-explorer-clear]':clear,
      '[data-explorer-count]':count})[selector] || null;
  }};
  function makeZone(data) {
    const rows=data.map(row=>({dataset:row,hidden:false}));
    const table={hidden:false}, empty={hidden:true};
    const body={children:[...rows],appendChild(row){this.children=this.children.filter(x=>x!==row);this.children.push(row);}};
    return {rows,table,empty,body,querySelectorAll(selector) {
      return selector==='[data-explorer-row]' ? rows : [];
    },querySelector(selector) {
      return ({'[data-explorer-table]':table,'[data-explorer-empty]':empty,'[data-explorer-body]':body})[selector] || null;
    }};
  }
  let zone=makeZone(list);
  const document={querySelector(selector) {return selector==='[data-ticket-explorer]'?panel:selector==='[data-live-zone]'?zone:null;}};
  const window={};
  vm.runInNewContext(source,{window,document},{filename:'public/explorer.js'});
  return {
    search,status,category,priority,sort,count,clear,panel,window,
    get zone(){return zone;},
    change(control,value,kind) {control.value=value;control.events[kind==='input'?'input':'change']();},
    replace(data) {zone=makeZone(data);window.MesaHelpExplorer.refresh(zone);},
    clickClear() {clear.events.click();}
  };
}

test('explorador: busca por número y asunto sin distinguir mayúsculas ni tildes', () => {
  const h=harness();
  assert.equal(h.panel.hidden,false);
  assert.equal(h.count.textContent,'3 de 3 tickets');
  h.change(h.search,'#0005','input');
  assert.deepEqual(h.zone.rows.map(row=>row.hidden),[true,true,false]);
  h.change(h.search,'tecnico','input');
  assert.deepEqual(h.zone.rows.map(row=>row.hidden),[false,true,true]);
  h.change(h.search,'REVISION DE NOTAS','input');
  assert.deepEqual(h.zone.rows.map(row=>row.hidden),[true,true,false]);
});

test('explorador: combina estado y categoría, refleja resultados y mensaje vacío', () => {
  const h=harness();
  h.change(h.status,'cerrado');
  h.change(h.category,'Académico');
  assert.equal(h.count.textContent,'0 de 3 tickets');
  assert.equal(h.zone.table.hidden,true);
  assert.equal(h.zone.empty.hidden,false);
  h.change(h.category,'Aseo y mantenimiento');
  assert.deepEqual(h.zone.rows.map(row=>row.hidden),[true,false,true]);
  assert.equal(h.count.textContent,'1 de 3 tickets');
  assert.equal(h.zone.table.hidden,false);
  assert.equal(h.zone.empty.hidden,true);
});

test('explorador: limpiar filtros restaura todas las filas y devuelve el foco', () => {
  const h=harness();
  assert.equal(h.clear.disabled,true);
  h.change(h.search,'un ticket inexistente','input');
  assert.equal(h.clear.disabled,false);
  h.clickClear();
  assert.equal(h.search.value,'');
  assert.equal(h.status.value,'');
  assert.equal(h.category.value,'');
  assert.equal(h.priority.value,'');
  assert.equal(h.sort.value,'recent');
  assert.ok(h.zone.rows.every(row=>!row.hidden));
  assert.equal(h.clear.disabled,true);
  assert.equal(h.search.focused,true);
});

test('explorador: filtros siguen activos tras recibir nuevos tickets del servidor', () => {
  const h=harness();
  h.change(h.search,'notas','input');
  const before=h.search;
  h.replace([
    {search:'#0005 5 Revisión de notas',state:'cerrado',category:'Académico'},
    {search:'#0006 6 Nuevas notas de coordinación',state:'abierto',category:'Académico'},
    {search:'#0007 7 Soporte de equipo',state:'resuelto',category:'Soporte técnico'}
  ]);
  assert.equal(h.search,before,'la búsqueda se mantiene fuera de la zona Live');
  assert.equal(h.search.value,'notas');
  assert.deepEqual(h.zone.rows.map(row=>row.hidden),[false,false,true]);
  assert.equal(h.count.textContent,'2 de 3 tickets');
});

test('explorador: sin tickets conserva el estado inicial vacío', () => {
  const h=harness([]);
  assert.equal(h.count.textContent,'0 de 0 tickets');
  assert.equal(h.zone.empty.hidden,true);
  h.replace([{search:'#0001 1 Nuevo ticket',state:'abierto',category:'Académico'}]);
  assert.equal(h.count.textContent,'1 de 1 ticket');
});


test('explorador: prioridad combinada con estado y búsqueda restringe resultados', () => {
  const h=harness();
  h.change(h.priority,'alta');
  assert.deepEqual(h.zone.rows.map(r=>r.hidden),[false,true,true]);
  h.change(h.status,'cerrado');
  assert.equal(h.count.textContent,'0 de 3 tickets');
  h.change(h.status,'abierto');
  h.change(h.search,'TECNICO','input');
  assert.equal(h.count.textContent,'1 de 3 tickets');
  h.clickClear();
  assert.equal(h.priority.value,'');
  assert.equal(h.count.textContent,'3 de 3 tickets');
});

test('explorador: orden por fecha reciente y antigua es determinista', () => {
  const h=harness();
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['5','2','1']);
  h.change(h.sort,'oldest');
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['1','2','5']);
  h.clickClear();
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['5','2','1']);
});

test('explorador: orden por prioridad alta o baja conserva desempate por actividad', () => {
  const h=harness();
  h.change(h.sort,'priority-high');
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['1','5','2']);
  h.change(h.sort,'priority-low');
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['2','5','1']);
});

test('explorador: prioridad y orden se mantienen tras la actualización Live', () => {
  const h=harness();
  h.change(h.priority,'alta');
  h.change(h.sort,'priority-high');
  h.replace([
    {search:'#0008 Nueva incidencia',state:'abierto',category:'Académico',priority:'baja',updated:'2026-11-10 15:00:00',ticketId:'8'},
    {search:'#0009 Revisión urgente',state:'abierto',category:'Académico',priority:'alta',updated:'2026-11-10 16:00:00',ticketId:'9'},
    {search:'#0007 Urgente anterior',state:'abierto',category:'Académico',priority:'alta',updated:'2026-11-10 14:00:00',ticketId:'7'}
  ]);
  assert.equal(h.priority.value,'alta');
  assert.equal(h.sort.value,'priority-high');
  assert.equal(h.count.textContent,'2 de 3 tickets');
  assert.deepEqual(h.zone.body.children.map(r=>r.dataset.ticketId),['9','7','8']);
  assert.deepEqual(h.zone.rows.map(r=>r.hidden),[true,false,false]);
});
